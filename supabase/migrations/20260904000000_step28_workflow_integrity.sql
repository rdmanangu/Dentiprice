-- ============================================================================
-- STEP 28: INQUIRY → APPOINTMENT WORKFLOW POLISH
-- ============================================================================
-- Hardens the administrative workflow with durable, database-level state
-- integrity so invalid status transitions and duplicate appointments cannot
-- occur even if the browser UI is bypassed or two requests race together.
--
-- This migration is safe to re-run (idempotent).

-- ----------------------------------------------------------------------------
-- 1. DUPLICATE APPOINTMENT PROTECTION
-- ----------------------------------------------------------------------------
-- One inquiry produces at most one appointment. The Confirm & Schedule RPC
-- already locks the inquiry row (FOR UPDATE) to serialize concurrent calls,
-- but a unique partial index adds durable protection at the storage level.
-- It is deliberately partial (inquiry_id IS NOT NULL) so that manual/legacy
-- appointments not tied to an inquiry are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS appointments_one_per_inquiry_key
  ON public.appointments (inquiry_id)
  WHERE inquiry_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. APPOINTMENT STATUS TRANSITION GUARDS
-- ----------------------------------------------------------------------------
-- Enforces the canonical workflow:
--   scheduled -> confirmed -> completed
--   scheduled/confirmed -> cancelled / no_show
--   completed / cancelled / no_show  are terminal.
-- Prevents silently reverting a completed/cancelled/no_show appointment back
-- to an active state. Same-status no-ops are permitted. The transaction then
-- fails fast with the NOTICE-able message via a distinct SQLSTATE the client
-- can translate into a friendly message.
CREATE OR REPLACE FUNCTION public.guard_appointment_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Active states may move forward along the workflow or to a terminal state.
  IF OLD.status IN ('scheduled', 'confirmed') THEN
    IF NEW.status IN ('confirmed', 'completed', 'cancelled', 'no_show') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Invalid appointment status transition from % to %', OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;

  -- Terminal states must never revert to an active state.
  RAISE EXCEPTION 'Appointment is already % and cannot be changed', OLD.status
    USING ERRCODE = '23514';
END;
$$;

DROP TRIGGER IF EXISTS guard_appointment_status_transition_trigger
  ON public.appointments;
CREATE TRIGGER guard_appointment_status_transition_trigger
  BEFORE UPDATE OF status ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_appointment_status_transition();

-- ----------------------------------------------------------------------------
-- 3. INQUIRY STATUS TRANSITION GUARDS
-- ----------------------------------------------------------------------------
-- Enforces the canonical workflow:
--   pending -> confirmed | cancelled
--   confirmed -> completed (explicit admin action; appointment completion is
--                 NOT auto-synced to the inquiry)
--   cancelled / completed  are terminal.
-- This keeps the pending -> confirmed -> completed chain and prevents obvious
-- mistakes such as reverting a confirmed inquiry to pending or reopening a
-- terminal inquiry.
CREATE OR REPLACE FUNCTION public.guard_inquiry_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF OLD.status = 'pending' THEN
    IF NEW.status IN ('confirmed', 'cancelled') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Invalid inquiry status transition from % to %', OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;

  IF OLD.status = 'confirmed' THEN
    IF NEW.status IN ('completed') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'Invalid inquiry status transition from % to %', OLD.status, NEW.status
      USING ERRCODE = '23514';
  END IF;

  RAISE EXCEPTION 'Inquiry is already % and cannot be changed', OLD.status
    USING ERRCODE = '23514';
END;
$$;

DROP TRIGGER IF EXISTS guard_inquiry_status_transition_trigger
  ON public.inquiries;
CREATE TRIGGER guard_inquiry_status_transition_trigger
  BEFORE UPDATE OF status ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_inquiry_status_transition();
