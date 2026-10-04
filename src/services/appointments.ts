import { supabase } from "../lib/supabase";
import type {
  Appointment,
  AppointmentStatus,
  AppointmentWithDetails,
} from "../types/appointment";

// ─────────────────────────────────────────────
// GET APPOINTMENTS (with patient + items)
// Uses a single embedded select to avoid N+1
// requests. Fetches appointment_items via the
// appointments → appointment_items relationship.
// ─────────────────────────────────────────────

export async function getAppointments(): Promise<AppointmentWithDetails[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      patient:patients!appointments_patient_id_fkey(
        id, full_name, phone, email
      ),
      appointment_items!appointment_items_appointment_id_fkey(
        id, appointment_id, procedure_id, add_on_id,
        item_name, item_price, created_at
      )
    `
    )
    .order("appointment_date", { ascending: true })
    .order("appointment_start_time", { ascending: true });

  if (error) {
    console.error("Get appointments error:", error);
    throw error;
  }

  return (data ?? []) as AppointmentWithDetails[];
}

// ─────────────────────────────────────────────
// GET APPOINTMENTS BY DATE RANGE (with patient + items)
// Efficiently fetches only appointments within
// a given date range. Used by the calendar view
// to avoid loading the entire appointment table.
// Dates are YYYY-MM-DD strings; the query uses
// inclusive bounds (gte/lte).
// ─────────────────────────────────────────────

export async function getAppointmentsByDateRange(
  startDate: string,
  endDate: string
): Promise<AppointmentWithDetails[]> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      patient:patients!appointments_patient_id_fkey(
        id, full_name, phone, email
      ),
      appointment_items!appointment_items_appointment_id_fkey(
        id, appointment_id, procedure_id, add_on_id,
        item_name, item_price, created_at
      )
    `
    )
    .gte("appointment_date", startDate)
    .lte("appointment_date", endDate)
    .order("appointment_date", { ascending: true })
    .order("appointment_start_time", { ascending: true });

  if (error) {
    console.error("Get appointments by date range error:", error);
    throw error;
  }

  return (data ?? []) as AppointmentWithDetails[];
}

// ─────────────────────────────────────────────
// GET APPOINTMENT BY ID (with patient + items)
// ─────────────────────────────────────────────

export async function getAppointmentById(
  id: string
): Promise<AppointmentWithDetails | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      patient:patients!appointments_patient_id_fkey(
        id, full_name, phone, email
      ),
      appointment_items!appointment_items_appointment_id_fkey(
        id, appointment_id, procedure_id, add_on_id,
        item_name, item_price, created_at
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Get appointment by ID error:", error);
    throw error;
  }

  return data as AppointmentWithDetails | null;
}

// ─────────────────────────────────────────────
// UPDATE APPOINTMENT STATUS
// ─────────────────────────────────────────────

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update appointment status error:", error);

    // The status transition guard trigger raises 23514. Translate it
    // into the same guidance the UI uses so admins never see a raw
    // database message.
    if (error.code === "23514") {
      throw new Error(
        "This appointment has reached a final status and can no longer be changed."
      );
    }

    if (
      error.code === "42501" ||
      error.message.toLowerCase().includes("row-level security")
    ) {
      throw new Error(
        "Permission denied. Your account cannot update this appointment."
      );
    }

    throw error;
  }

  return data as Appointment;
}

// ─────────────────────────────────────────────
// GET APPOINTMENT BY INQUIRY ID
// Used by InquiryDetails to find the related
// appointment for a confirmed inquiry.
// Returns the first match; an inquiry should
// have at most one appointment.
// ─────────────────────────────────────────────

export async function getAppointmentByInquiryId(
  inquiryId: string
): Promise<AppointmentWithDetails | null> {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      patient:patients!appointments_patient_id_fkey(
        id, full_name, phone, email
      ),
      appointment_items!appointment_items_appointment_id_fkey(
        id, appointment_id, procedure_id, add_on_id,
        item_name, item_price, created_at
      )
    `
    )
    .eq("inquiry_id", inquiryId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Get appointment by inquiry ID error:", error);
    throw error;
  }

  return data as AppointmentWithDetails | null;
}

// ─────────────────────────────────────────────
// RESCHEDULE APPOINTMENT
// Updates date and time in a single atomic
// update. Does not modify patient_id, inquiry_id,
// appointment_items, or status.
//
// Date/time validity (end after start, one appointment
// per inquiry, admin-only RLS) is enforced by the
// database; the client additionally blocks obvious
// conflicts before submitting so the admin gets an
// immediate, actionable message.
// ─────────────────────────────────────────────

export async function rescheduleAppointment(
  id: string,
  appointmentDate: string,
  startTime: string,
  endTime: string
): Promise<Appointment> {
  if (!appointmentDate || !startTime || !endTime) {
    throw new Error(
      "Please choose a date, a start time, and an end time."
    );
  }

  if (endTime <= startTime) {
    throw new Error("End time must be after the start time.");
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({
      appointment_date: appointmentDate,
      appointment_start_time: startTime,
      appointment_end_time: endTime,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Reschedule appointment error:", error);

    // Surface a readable reason for the known database
    // constraints instead of a raw driver message.
    if (error.code === "23514") {
      throw new Error(
        "The new time is not valid. End time must be after the start time."
      );
    }

    if (
      error.code === "42501" ||
      error.message.toLowerCase().includes("row-level security")
    ) {
      throw new Error(
        "Permission denied. Your account cannot reschedule this appointment."
      );
    }

    throw error;
  }

  return data as Appointment;
}

// ─────────────────────────────────────────────
// UPDATE APPOINTMENT NOTES
// Updates administrative notes in a single
// atomic update. Uses the existing updated_at
// trigger.
// ─────────────────────────────────────────────

export async function updateAppointmentNotes(
  id: string,
  notes: string | null
): Promise<Appointment> {
  const { data, error } = await supabase
    .from("appointments")
    .update({ notes })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update appointment notes error:", error);
    throw error;
  }

  return data as Appointment;
}
