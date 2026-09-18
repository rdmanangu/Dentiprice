-- ============================================================================
-- STEP 30: REMOVE DUPLICATE FOREIGN KEY ON appointment_items.appointment_id
-- ============================================================================
-- The appointment_items.appointment_id -> appointments.id relationship is
-- defined twice on databases that ran STEP 21 as first written:
--
--   * appointment_items_appointment_id_fkey (inline REFERENCES on the column,
--     ON DELETE CASCADE) -- CANONICAL, KEPT
--   * fk_appointment_items_appointment (duplicate DO-block copy, ON DELETE
--     CASCADE) -- REMOVED HERE
--
-- Both constraints are identical in every respect (same column pair, same
-- ON DELETE CASCADE, same default ON UPDATE NO ACTION). Two foreign keys on
-- the same column pair make PostgREST report ambiguous embed relationships
-- (PGRST201: "Could not embed because more than one relationship was found").
--
-- The application embeds appointment_items through the canonical name
-- (appointment_items!appointment_items_appointment_id_fkey), so that
-- constraint is retained and the duplicate named copy is dropped.
--
-- Idempotent: DROP CONSTRAINT IF EXISTS is a no-op on databases where the
-- duplicate is already gone (or was never created).

ALTER TABLE public.appointment_items
  DROP CONSTRAINT IF EXISTS fk_appointment_items_appointment;