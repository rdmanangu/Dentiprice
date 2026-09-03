import { supabase } from "../lib/supabase";
import type {
  Appointment,
  AppointmentItem,
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
      patient:patients(
        id, full_name, phone, email
      ),
      appointment_items(
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
      patient:patients(
        id, full_name, phone, email
      ),
      appointment_items(
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
    throw error;
  }

  return data as Appointment;
}

// ─────────────────────────────────────────────
// GET APPOINTMENT ITEMS (standalone)
// Optional: used when a standalone list is needed
// without re-fetching the whole appointment.
// ─────────────────────────────────────────────

export async function getAppointmentItems(
  appointmentId: string
): Promise<AppointmentItem[]> {
  const { data, error } = await supabase
    .from("appointment_items")
    .select("*")
    .eq("appointment_id", appointmentId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Get appointment items error:", error);
    throw error;
  }

  return (data ?? []) as AppointmentItem[];
}
