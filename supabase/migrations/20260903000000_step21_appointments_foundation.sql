-- ============================================================================
-- STEP 21: APPOINTMENTS FOUNDATION
-- ============================================================================
-- Creates the database foundation for appointments and appointment line items.
-- This migration is safe to re-run. It does NOT modify any existing tables,
-- data, functions, or policies. It does NOT create an RPC for appointment
-- creation — that will come in a later step with the Confirm & Schedule
-- workflow.

-- 1. Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id             uuid        NOT NULL REFERENCES public.patients(id) ON DELETE RESTRICT,
  inquiry_id             uuid                 REFERENCES public.inquiries(id) ON DELETE SET NULL,
  appointment_date       date        NOT NULL,
  appointment_start_time time        NOT NULL,
  appointment_end_time   time        NOT NULL,
  status                 text        NOT NULL DEFAULT 'scheduled',
  notes                  text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

-- 2. Appointment items (snapshot of what is scheduled)
CREATE TABLE IF NOT EXISTS public.appointment_items (
  id             uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid    NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  procedure_id   uuid,
  add_on_id      uuid,
  item_name      text    NOT NULL,
  item_price     numeric NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- 3. Foreign key guards (ADD CONSTRAINT IF NOT EXISTS via DO block)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.appointments'::regclass
      AND conname = 'fk_appointments_patient'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT fk_appointments_patient
      FOREIGN KEY (patient_id)
      REFERENCES public.patients(id)
      ON DELETE RESTRICT;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.appointments'::regclass
      AND conname = 'fk_appointments_inquiry'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT fk_appointments_inquiry
      FOREIGN KEY (inquiry_id)
      REFERENCES public.inquiries(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.appointment_items'::regclass
      AND conname = 'fk_appointment_items_appointment'
  ) THEN
    ALTER TABLE public.appointment_items
      ADD CONSTRAINT fk_appointment_items_appointment
      FOREIGN KEY (appointment_id)
      REFERENCES public.appointments(id)
      ON DELETE CASCADE;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.appointment_items'::regclass
      AND conname = 'fk_appointment_items_procedure'
  ) THEN
    ALTER TABLE public.appointment_items
      ADD CONSTRAINT fk_appointment_items_procedure
      FOREIGN KEY (procedure_id)
      REFERENCES public.procedures(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.appointment_items'::regclass
      AND conname = 'fk_appointment_items_add_on'
  ) THEN
    ALTER TABLE public.appointment_items
      ADD CONSTRAINT fk_appointment_items_add_on
      FOREIGN KEY (add_on_id)
      REFERENCES public.add_ons(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

-- 4. Business rule constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.appointments'::regclass
      AND conname = 'appointments_status_check'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_status_check
      CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'));
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.appointments'::regclass
      AND conname = 'appointments_end_after_start_check'
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_end_after_start_check
      CHECK (appointment_end_time > appointment_start_time);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.appointment_items'::regclass
      AND conname = 'appointment_items_price_non_negative_check'
  ) THEN
    ALTER TABLE public.appointment_items
      ADD CONSTRAINT appointment_items_price_non_negative_check
      CHECK (item_price >= 0);
  END IF;
END;
$$;

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id
  ON public.appointments (patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_inquiry_id
  ON public.appointments (inquiry_id);

CREATE INDEX IF NOT EXISTS idx_appointments_date_time
  ON public.appointments (appointment_date, appointment_start_time);

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON public.appointments (status);

CREATE INDEX IF NOT EXISTS idx_appointment_items_appointment_id
  ON public.appointment_items (appointment_id);

-- 6. Timestamp trigger (reuses existing set_updated_at function)
DROP TRIGGER IF EXISTS appointments_set_updated_at ON public.appointments;
CREATE TRIGGER appointments_set_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 7. RLS: only admins can access appointment rows directly.
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view appointments" ON public.appointments;
CREATE POLICY "Admins can view appointments"
  ON public.appointments FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can insert appointments" ON public.appointments;
CREATE POLICY "Admins can insert appointments"
  ON public.appointments FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;
CREATE POLICY "Admins can update appointments"
  ON public.appointments FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can delete appointments" ON public.appointments;
CREATE POLICY "Admins can delete appointments"
  ON public.appointments FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 8. RLS: appointment_items inherit the same admin-only access model.
ALTER TABLE public.appointment_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view appointment_items" ON public.appointment_items;
CREATE POLICY "Admins can view appointment_items"
  ON public.appointment_items FOR SELECT TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can insert appointment_items" ON public.appointment_items;
CREATE POLICY "Admins can insert appointment_items"
  ON public.appointment_items FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can update appointment_items" ON public.appointment_items;
CREATE POLICY "Admins can update appointment_items"
  ON public.appointment_items FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "Admins can delete appointment_items" ON public.appointment_items;
CREATE POLICY "Admins can delete appointment_items"
  ON public.appointment_items FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
