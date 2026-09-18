-- ============================================================================
-- STEP 29: FOREIGN KEY DEDUPLICATION
-- ============================================================================
-- The appointments/appointment_items CREATE TABLE statements in STEP 21
-- declared their relationships inline via REFERENCES:
--
--   appointments.patient_id      REFERENCES patients(id)     -> appointments_patient_id_fkey
--   appointments.inquiry_id      REFERENCES inquiries(id)    -> appointments_inquiry_id_fkey
--   appointment_items.appointment_id REFERENCES appointments(id) -> appointment_items_appointment_id_fkey
--
-- STEP 21 ALSO added explicitly-named DO-block copies of those same three
-- relationships (fk_appointments_patient, fk_appointments_inquiry,
-- fk_appointment_items_appointment). On any database that ran STEP 21
-- as-written, both constraints now exist for the same column pair, which:
--
--   * creates redundant constraint and index overhead, and
--   * can make PostgREST report ambiguous relationships (PGRST201) when the
--     same column can be reached through two different foreign keys.
--
-- The application reads through PostgREST embeds that refer to the auto-named
-- *_fkey constraints (e.g. appointments_patient_id_fkey, and
-- appointment_items_appointment_id_fkey in getUpcomingAppointments /
-- getAppointmentHistory), so the *_fkey names are canonical and MUST survive.
-- This migration therefore removes the three duplicate named fk_* constraints,
-- keeping exactly one constraint per relationship.
--
-- It is idempotent: on a database where STEP 21 was already corrected (or the
-- duplicates were removed manually), it makes no change. If the auto-named
-- constraint is missing for some reason but the named one exists, the named one
-- is RENAMED to the canonical name so the application keeps working.

DO $step29$
DECLARE
  v_auto_exists boolean;
  v_named_exists boolean;
BEGIN
  -- 1. appointments.patient_id -> patients.id
  v_auto_exists  := EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.appointments'::regclass AND conname = 'appointments_patient_id_fkey');
  v_named_exists := EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.appointments'::regclass AND conname = 'fk_appointments_patient');

  IF v_named_exists AND v_auto_exists THEN
    ALTER TABLE public.appointments DROP CONSTRAINT fk_appointments_patient;
  ELSIF v_named_exists AND NOT v_auto_exists THEN
    ALTER TABLE public.appointments RENAME CONSTRAINT fk_appointments_patient TO appointments_patient_id_fkey;
  END IF;

  -- 2. appointments.inquiry_id -> inquiries.id
  v_auto_exists  := EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.appointments'::regclass AND conname = 'appointments_inquiry_id_fkey');
  v_named_exists := EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.appointments'::regclass AND conname = 'fk_appointments_inquiry');

  IF v_named_exists AND v_auto_exists THEN
    ALTER TABLE public.appointments DROP CONSTRAINT fk_appointments_inquiry;
  ELSIF v_named_exists AND NOT v_auto_exists THEN
    ALTER TABLE public.appointments RENAME CONSTRAINT fk_appointments_inquiry TO appointments_inquiry_id_fkey;
  END IF;

  -- 3. appointment_items.appointment_id -> appointments.id
  v_auto_exists  := EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.appointment_items'::regclass AND conname = 'appointment_items_appointment_id_fkey');
  v_named_exists := EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.appointment_items'::regclass AND conname = 'fk_appointment_items_appointment');

  IF v_named_exists AND v_auto_exists THEN
    ALTER TABLE public.appointment_items DROP CONSTRAINT fk_appointment_items_appointment;
  ELSIF v_named_exists AND NOT v_auto_exists THEN
    ALTER TABLE public.appointment_items RENAME CONSTRAINT fk_appointment_items_appointment TO appointment_items_appointment_id_fkey;
  END IF;
END;
$step29$;