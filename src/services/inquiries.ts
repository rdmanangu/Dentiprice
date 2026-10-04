import { supabase } from "../lib/supabase";
import type {
  Inquiry,
  InquiryStatus,
  CreateInquiryInput,
} from "../types/inquiry";
import type { ConfirmScheduleResult } from "../types/appointment";

// ─────────────────────────────────────────────
// INQUIRY ITEM TYPE
// ─────────────────────────────────────────────

export type InquiryItem = {
  id: string;
  inquiry_id: string;
  procedure_id: string | null;
  add_on_id: string | null;
  item_name: string;
  item_price: number;
};

// ─────────────────────────────────────────────
// CREATE INQUIRY
// Uses the atomic Supabase RPC
// ─────────────────────────────────────────────

export async function createInquiry(
  input: CreateInquiryInput
) {
  const {
    patientName,
    phone,
    email,
    procedureId,
    procedureName,
    procedurePrice,
    selectedAddOns,
    totalPrice,
    preferredDate,
    preferredTimeSlot,
  } = input;

  // Build the inquiry_items payload.
  //
  // The main procedure is stored as a procedure item.
  // Each selected add-on is stored as an add-on item.
  const items = [
    {
      procedure_id: procedureId,
      add_on_id: null,
      item_name: procedureName,
      item_price: procedurePrice,
    },

    ...selectedAddOns.map((addOn) => ({
      procedure_id: null,
      add_on_id: addOn.id,
      item_name: addOn.name,
      item_price: addOn.price,
    })),
  ];

  const { data, error } = await supabase.rpc(
    "create_inquiry_with_items",
    {
      p_patient_name: patientName.trim(),
      p_phone: phone.trim(),
      p_email: email.trim().toLowerCase(),
      p_calculated_total_price: totalPrice,
      p_preferred_date: preferredDate,
      p_preferred_time_slot: preferredTimeSlot,
      p_items: items,
    }
  );

  if (error) {
    console.error(
      "RPC create_inquiry_with_items error:",
      error
    );

    throw error;
  }

  return data as {
    id: string;
    status: string;
    patient_name: string;
  };
}

// ─────────────────────────────────────────────
// GET ALL INQUIRIES
// ─────────────────────────────────────────────

export async function getInquiries(): Promise<Inquiry[]> {
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error("Get inquiries error:", error);
    throw error;
  }

  return data ?? [];
}

// ─────────────────────────────────────────────
// GET INQUIRY BY ID
// Used by appointment details to show the
// originating inquiry for an appointment.
// ─────────────────────────────────────────────

export async function getInquiryById(
  id: string
): Promise<Inquiry | null> {
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Get inquiry by ID error:", error);
    throw error;
  }

  return data as Inquiry | null;
}

// ─────────────────────────────────────────────
// GET INQUIRY ITEMS
// Used by InquiryDetails
// ─────────────────────────────────────────────

export async function getInquiryItems(
  inquiryId: string
): Promise<InquiryItem[]> {
  const { data, error } = await supabase
    .from("inquiry_items")
    .select("*")
    .eq("inquiry_id", inquiryId)
    .order("id", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Get inquiry items error:",
      error
    );

    throw error;
  }

  return data ?? [];
}

// ─────────────────────────────────────────────
// UPDATE INQUIRY STATUS
// ─────────────────────────────────────────────

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus
): Promise<Inquiry> {
  const { data, error } = await supabase
    .from("inquiries")
    .update({
      status,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error(
      "Update inquiry status error:",
      error
    );

    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────
// DELETE INQUIRY
// Requires authenticated admin session
// ─────────────────────────────────────────────

export async function deleteInquiry(
  id: string
): Promise<void> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    throw new Error(
      "You must be signed in to delete an inquiry."
    );
  }

  const { data, error } = await supabase
    .from("inquiries")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "Delete inquiry error:",
      error
    );

    throw error;
  }

  if (!data) {
    throw new Error(
      "The inquiry was not deleted. Your account may not have permission."
    );
  }
}

// ─────────────────────────────────────────────
// GET PENDING INQUIRIES AVAILABLE FOR SCHEDULING
// Appointments are created exclusively through the
// confirm_inquiry_and_schedule RPC, which requires a
// pending inquiry with a resolved patient. The scheduling
// form therefore lists only inquiries that can actually
// be scheduled.
//
// Item snapshots are embedded so the form can show what
// will be copied onto the appointment.
// ─────────────────────────────────────────────

export type SchedulableInquiry = Inquiry & {
  inquiry_items: InquiryItem[];
};

export async function getSchedulableInquiries(): Promise<
  SchedulableInquiry[]
> {
  const { data, error } = await supabase
    .from("inquiries")
    .select(
      `
      *,
      inquiry_items(id, inquiry_id, procedure_id, add_on_id, item_name, item_price)
    `
    )
    .eq("status", "pending")
    .order("preferred_date", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error(
      "Get schedulable inquiries error:",
      error
    );
    throw error;
  }

  return (data ?? []) as SchedulableInquiry[];
}

// ─────────────────────────────────────────────
// CONFIRM INQUIRY & SCHEDULE APPOINTMENT
// Atomic server-side operation: locks the
// inquiry, creates the appointment + items,
// and marks the inquiry as confirmed.
// ─────────────────────────────────────────────

export async function confirmInquiryAndSchedule(
  inquiryId: string,
  appointmentDate: string,
  appointmentStart: string,
  appointmentEnd: string,
  notes?: string
): Promise<ConfirmScheduleResult> {
  if (!appointmentDate || !appointmentStart || !appointmentEnd) {
    throw new Error(
      "Please choose a date, a start time, and an end time."
    );
  }

  // Frontend guard for immediate feedback. The RPC performs the
  // same validation authoritatively inside the transaction.
  if (appointmentEnd <= appointmentStart) {
    throw new Error("End time must be after the start time.");
  }

  const trimmedNotes = notes?.trim();

  const { data, error } = await supabase.rpc(
    "confirm_inquiry_and_schedule",
    {
      p_inquiry_id: inquiryId,
      p_appointment_date: appointmentDate,
      p_appointment_start: appointmentStart,
      p_appointment_end: appointmentEnd,
      p_notes: trimmedNotes ? trimmedNotes : null,
    }
  );

  if (error) {
    console.error(
      "RPC confirm_inquiry_and_schedule error:",
      error
    );

    throw translateScheduleError(error);
  }

  return data as ConfirmScheduleResult;
}

// Converts a database rejection into guidance an admin can act
// on, without exposing raw SQL text.
function translateScheduleError(
  error: { message?: string; code?: string }
): Error {
  const raw = (error.message ?? "").toLowerCase();

  if (
    error.code === "42501" ||
    raw.includes("authorization denied") ||
    raw.includes("row-level security")
  ) {
    return new Error(
      "Permission denied. Your account cannot schedule appointments."
    );
  }

  if (raw.includes("in the past")) {
    return new Error(
      "Appointments cannot be scheduled in the past. Please choose today or a future date."
    );
  }

  if (raw.includes("end time")) {
    return new Error(
      "End time must be after the start time. Please check your selection."
    );
  }

  if (raw.includes("cannot be confirmed")) {
    return new Error(
      "This inquiry is no longer pending, so it can no longer be scheduled."
    );
  }

  if (
    raw.includes("no linked patient") ||
    raw.includes("patient resolution")
  ) {
    return new Error(
      "This inquiry is not linked to a patient record yet, so it cannot be scheduled."
    );
  }

  if (raw.includes("patient record not found")) {
    return new Error(
      "The patient linked to this inquiry no longer exists."
    );
  }

  // Duplicate key: the one-appointment-per-inquiry index rejected it.
  if (error.code === "23505") {
    return new Error(
      "This inquiry already has an appointment. Refresh to see the latest schedule."
    );
  }

  if (raw.includes("appointment_end_time") || raw.includes("check")) {
    return new Error(
      "The selected time is not valid. End time must be after the start time."
    );
  }

  return new Error(
    "The appointment could not be scheduled. Please try again."
  );
}