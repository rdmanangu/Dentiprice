import type { AppointmentStatus } from "../types/appointment";
import type { InquiryStatus } from "../types/inquiry";

// ─────────────────────────────────────────────
// CANONICAL WORKFLOW TRANSITIONS
// Single source of truth for allowed status
// transitions across the admin UI.
//
// NOTE: These mirror the database triggers in
// supabase/migrations/20260904000000_step28_workflow_integrity.sql.
// The database remains the final authority; this
// table only drives which options are offered and
// which actions are enabled in the UI.
// ─────────────────────────────────────────────

// Inquiry workflow:
//   pending    -> confirmed | cancelled
//   confirmed  -> completed
//   cancelled  -> (terminal)
//   completed  -> (terminal)
export const ALLOWED_INQUIRY_TRANSITIONS: Record<
  InquiryStatus,
  InquiryStatus[]
> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed"],
  cancelled: [],
  completed: [],
};

export function canTransitionInquiry(
  from: InquiryStatus,
  to: InquiryStatus
): boolean {
  return ALLOWED_INQUIRY_TRANSITIONS[from].includes(to);
}

// Appointment workflow:
//   scheduled  -> confirmed | completed | cancelled | no_show
//   confirmed  -> completed | cancelled | no_show
//   completed  -> (terminal)
//   cancelled  -> (terminal)
//   no_show    -> (terminal)
export const ALLOWED_APPOINTMENT_TRANSITIONS: Record<
  AppointmentStatus,
  AppointmentStatus[]
> = {
  scheduled: ["confirmed", "completed", "cancelled", "no_show"],
  confirmed: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

export function canTransitionAppointment(
  from: AppointmentStatus,
  to: AppointmentStatus
): boolean {
  return ALLOWED_APPOINTMENT_TRANSITIONS[from].includes(to);
}
