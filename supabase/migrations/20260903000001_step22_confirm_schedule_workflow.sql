-- ============================================================================
-- STEP 22: CONFIRM & SCHEDULE WORKFLOW
-- ============================================================================
-- Creates the atomic RPC that confirms a pending inquiry and creates the
-- associated appointment + appointment items in a single transaction.
-- This migration is safe to re-run.

-- 1. Confirm & schedule RPC
CREATE OR REPLACE FUNCTION public.confirm_inquiry_and_schedule(
  p_inquiry_id          uuid,
  p_appointment_date    date,
  p_appointment_start   time,
  p_appointment_end     time,
  p_notes               text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_inquiry         record;
  v_appointment_id  uuid;
  v_item            record;
  v_items           jsonb := '[]'::jsonb;
BEGIN
  -- Admin authorization (SECURITY DEFINER requires explicit check)
  IF (auth.jwt() -> 'app_metadata' ->> 'role') IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Authorization denied: admin role required'
      USING ERRCODE = '42501';
  END IF;

  -- Lock the inquiry row to prevent concurrent confirmation
  SELECT id, patient_id, status
  INTO v_inquiry
  FROM public.inquiries
  WHERE id = p_inquiry_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Inquiry not found'
      USING ERRCODE = 'P0002';
  END IF;

  -- Only pending inquiries may be confirmed
  IF v_inquiry.status IS DISTINCT FROM 'pending' THEN
    RAISE EXCEPTION 'Inquiry cannot be confirmed: current status is %', v_inquiry.status
      USING ERRCODE = 'P0001';
  END IF;

  -- Appointment must belong to a resolved patient
  IF v_inquiry.patient_id IS NULL THEN
    RAISE EXCEPTION 'Inquiry has no linked patient. Patient resolution required before scheduling.'
      USING ERRCODE = 'P0003';
  END IF;

  -- Verify patient exists
  IF NOT EXISTS (
    SELECT 1 FROM public.patients WHERE id = v_inquiry.patient_id
  ) THEN
    RAISE EXCEPTION 'Patient record not found for this inquiry'
      USING ERRCODE = 'P0004';
  END IF;

  -- Validate date is not in the past
  IF p_appointment_date < current_date THEN
    RAISE EXCEPTION 'Cannot schedule an appointment in the past'
      USING ERRCODE = '22023';
  END IF;

  -- Validate time range
  IF p_appointment_end <= p_appointment_start THEN
    RAISE EXCEPTION 'Appointment end time must be after start time'
      USING ERRCODE = '22023';
  END IF;

  -- Create the appointment
  INSERT INTO public.appointments (
    patient_id, inquiry_id, appointment_date,
    appointment_start_time, appointment_end_time,
    status, notes
  ) VALUES (
    v_inquiry.patient_id, p_inquiry_id, p_appointment_date,
    p_appointment_start, p_appointment_end,
    'scheduled', p_notes
  )
  RETURNING id INTO v_appointment_id;

  -- Snapshot inquiry items into appointment items
  FOR v_item IN
    SELECT procedure_id, add_on_id, item_name, item_price
    FROM public.inquiry_items
    WHERE inquiry_id = p_inquiry_id
  LOOP
    INSERT INTO public.appointment_items (
      appointment_id, procedure_id, add_on_id, item_name, item_price
    ) VALUES (
      v_appointment_id,
      v_item.procedure_id,
      v_item.add_on_id,
      v_item.item_name,
      v_item.item_price
    );

    v_items := v_items || jsonb_build_object(
      'item_name', v_item.item_name,
      'item_price', v_item.item_price
    );
  END LOOP;

  -- Mark inquiry as confirmed
  UPDATE public.inquiries
  SET status = 'confirmed'
  WHERE id = p_inquiry_id;

  RETURN jsonb_build_object(
    'appointment_id', v_appointment_id,
    'inquiry_id',      p_inquiry_id,
    'patient_id',      v_inquiry.patient_id,
    'appointment_date',      p_appointment_date,
    'appointment_start_time', p_appointment_start,
    'appointment_end_time',   p_appointment_end,
    'appointment_status', 'scheduled',
    'inquiry_status',    'confirmed',
    'items',            v_items
  );
END;
$$;

-- 2. Access control: only authenticated admins
REVOKE ALL ON FUNCTION public.confirm_inquiry_and_schedule(
  uuid, date, time, time, text
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.confirm_inquiry_and_schedule(
  uuid, date, time, time, text
) TO authenticated;
