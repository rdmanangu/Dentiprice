-- ============================================================================
-- STEP 20: PATIENT RECORDS FOUNDATION
-- ============================================================================
-- This migration is safe to re-run. It keeps patient data behind RLS and
-- exposes only the public inquiry-submission RPC to anonymous callers.

-- 1. Patients table and inquiry relationship
CREATE TABLE IF NOT EXISTS public.patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  date_of_birth date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS patient_id uuid;

-- PostgreSQL does not support ADD CONSTRAINT IF NOT EXISTS.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.inquiries'::regclass
      AND conname = 'fk_inquiries_patient'
  ) THEN
    ALTER TABLE public.inquiries
      ADD CONSTRAINT fk_inquiries_patient
      FOREIGN KEY (patient_id)
      REFERENCES public.patients(id)
      ON DELETE RESTRICT;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_inquiries_patient_id
  ON public.inquiries (patient_id);

-- Canonical contact values are unique. These indexes enforce identity under
-- concurrency; fail early with a clear error if pre-existing data conflicts.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.patients
    GROUP BY regexp_replace(phone, '[^0-9]', '', 'g')
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add normalized phone uniqueness: duplicate patient phones exist. Resolve duplicates before running Step 20.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.patients
    GROUP BY lower(btrim(email))
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot add normalized email uniqueness: duplicate patient emails exist. Resolve duplicates before running Step 20.';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS patients_normalized_phone_key
  ON public.patients ((regexp_replace(phone, '[^0-9]', '', 'g')));

CREATE UNIQUE INDEX IF NOT EXISTS patients_normalized_email_key
  ON public.patients ((lower(btrim(email))));

-- 2. Patient timestamp trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS patients_set_updated_at ON public.patients;
CREATE TRIGGER patients_set_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 3. RLS: only admins can access patient rows directly.
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view patients" ON public.patients;
CREATE POLICY "Admins can view patients"
  ON public.patients FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can insert patients" ON public.patients;
CREATE POLICY "Admins can insert patients"
  ON public.patients FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can update patients" ON public.patients;
CREATE POLICY "Admins can update patients"
  ON public.patients FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can delete patients" ON public.patients;
CREATE POLICY "Admins can delete patients"
  ON public.patients FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4. Internal patient resolver. It is SECURITY DEFINER only so the public
-- submission RPC can write patients without any direct anonymous table access.
CREATE OR REPLACE FUNCTION public.find_or_create_patient(
  p_full_name text,
  p_phone text,
  p_email text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_full_name text := regexp_replace(btrim(coalesce(p_full_name, '')), '\s+', ' ', 'g');
  v_norm_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  v_norm_email text := lower(btrim(coalesce(p_email, '')));
  v_patient_id uuid;
  v_lock_a text;
  v_lock_b text;
BEGIN
  IF v_full_name = '' OR v_norm_phone = '' OR v_norm_email = '' THEN
    RAISE EXCEPTION 'Patient name, phone, and email are required'
      USING ERRCODE = '22023';
  END IF;

  -- Stable lock order prevents deadlock. Unique indexes remain the durable
  -- database-level protection if calls arrive concurrently.
  v_lock_a := 'patient-contact:' || v_norm_phone;
  v_lock_b := 'patient-contact:' || v_norm_email;
  IF v_lock_a > v_lock_b THEN
    PERFORM pg_advisory_xact_lock(hashtextextended(v_lock_b, 0));
    PERFORM pg_advisory_xact_lock(hashtextextended(v_lock_a, 0));
  ELSE
    PERFORM pg_advisory_xact_lock(hashtextextended(v_lock_a, 0));
    PERFORM pg_advisory_xact_lock(hashtextextended(v_lock_b, 0));
  END IF;

  -- Preserve the legacy exact-match, phone-first, then email fallback.
  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE regexp_replace(phone, '[^0-9]', '', 'g') = v_norm_phone
    AND lower(btrim(email)) = v_norm_email
  ORDER BY created_at, id LIMIT 1;
  IF v_patient_id IS NOT NULL THEN RETURN v_patient_id; END IF;

  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE regexp_replace(phone, '[^0-9]', '', 'g') = v_norm_phone
  ORDER BY created_at, id LIMIT 1;
  IF v_patient_id IS NOT NULL THEN RETURN v_patient_id; END IF;

  SELECT id INTO v_patient_id
  FROM public.patients
  WHERE lower(btrim(email)) = v_norm_email
  ORDER BY created_at, id LIMIT 1;
  IF v_patient_id IS NOT NULL THEN RETURN v_patient_id; END IF;

  INSERT INTO public.patients (full_name, phone, email)
  VALUES (v_full_name, v_norm_phone, v_norm_email)
  RETURNING id INTO v_patient_id;

  RETURN v_patient_id;
END;
$$;

-- New functions receive PUBLIC EXECUTE by default; do not expose this resolver.
REVOKE ALL ON FUNCTION public.find_or_create_patient(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.find_or_create_patient(text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.find_or_create_patient(text, text, text) FROM authenticated;

-- 5. Link existing inquiries. Bad legacy contact data is left unlinked and
-- reported; patient_id intentionally remains nullable for those rows.
DO $$
DECLARE
  v_inquiry record;
  v_patient_id uuid;
  v_inquiries_linked integer := 0;
BEGIN
  FOR v_inquiry IN
    SELECT id, patient_name, phone, email
    FROM public.inquiries
    WHERE patient_id IS NULL
    ORDER BY created_at, id
  LOOP
    BEGIN
      v_patient_id := public.find_or_create_patient(
        v_inquiry.patient_name, v_inquiry.phone, v_inquiry.email
      );
      UPDATE public.inquiries
      SET patient_id = v_patient_id
      WHERE id = v_inquiry.id AND patient_id IS NULL;
      v_inquiries_linked := v_inquiries_linked + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Could not link inquiry % to a patient: %', v_inquiry.id, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'Step 20 migration complete: % inquiries linked to patients', v_inquiries_linked;
END;
$$;

-- 6. Public inquiry RPC. The old seven-argument version is removed. The
-- eight-argument signature is retained for current clients, but p_patient_id
-- is ignored: every call resolves its patient from submitted contact details.
DROP FUNCTION IF EXISTS public.create_inquiry_with_items(
  text, text, text, numeric, date, text, jsonb
);

CREATE OR REPLACE FUNCTION public.create_inquiry_with_items(
  p_patient_name text,
  p_phone text,
  p_email text,
  p_calculated_total_price numeric,
  p_preferred_date date,
  p_preferred_time_slot text,
  p_items jsonb,
  p_patient_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_inquiry_id uuid;
  v_patient_id uuid;
  v_item jsonb;
  v_result jsonb;
BEGIN
  -- p_patient_id is deliberately ignored. It is retained only as a temporary
  -- compatibility parameter while callers are updated.
  v_patient_id := public.find_or_create_patient(
    p_patient_name, p_phone, p_email
  );

  INSERT INTO public.inquiries (
    patient_id, patient_name, phone, email, calculated_total_price,
    preferred_date, preferred_time_slot, status
  ) VALUES (
    v_patient_id, p_patient_name, p_phone, p_email, p_calculated_total_price,
    p_preferred_date, p_preferred_time_slot, 'pending'
  )
  RETURNING id INTO v_inquiry_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO public.inquiry_items (
      inquiry_id, procedure_id, add_on_id, item_name, item_price
    ) VALUES (
      v_inquiry_id,
      (v_item ->> 'procedure_id')::uuid,
      (v_item ->> 'add_on_id')::uuid,
      v_item ->> 'item_name',
      (v_item ->> 'item_price')::numeric
    );
  END LOOP;

  SELECT jsonb_build_object('id', id, 'status', status, 'patient_name', patient_name)
  INTO v_result
  FROM public.inquiries
  WHERE id = v_inquiry_id;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.create_inquiry_with_items(
  text, text, text, numeric, date, text, jsonb, uuid
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.create_inquiry_with_items(
  text, text, text, numeric, date, text, jsonb, uuid
) TO anon, authenticated;
