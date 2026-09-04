import { supabase } from "../lib/supabase";
import type {
  Patient,
  PatientListItem,
  PatientHistory,
  InquiryWithItems,
  AppointmentWithItems,
  PatientHistoryEntry,
  InquiryItemSnapshot,
  AppointmentItemSnapshot,
  CreatePatientInput,
} from "../types/patient";
import type { Inquiry } from "../types/inquiry";
import type { Appointment } from "../types/appointment";

// ─────────────────────────────────────────────
// PHONE NORMALIZATION
// Strips non-digit characters, preserves
// leading + if present.
// ─────────────────────────────────────────────

function normalizePhone(phone: string): string {
  const trimmed = phone.trim();

  if (trimmed.startsWith("+")) {
    return "+" + trimmed.slice(1).replace(/\D/g, "");
  }

  return trimmed.replace(/\D/g, "");
}

// ─────────────────────────────────────────────
// EMAIL NORMALIZATION
// Lowercases and trims.
// ─────────────────────────────────────────────

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ─────────────────────────────────────────────
// GET PATIENT BY ID
// ─────────────────────────────────────────────

export async function getPatientById(
  id: string
): Promise<Patient | null> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Get patient by ID error:", error);
    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────
// FIND PATIENT BY CONTACT
// Matching strategy:
//   1. normalized email AND phone
//   2. normalized phone only
//   3. normalized email only
// Returns the first match found, or null.
// ─────────────────────────────────────────────

export async function findPatientByContact(
  phone: string,
  email: string
): Promise<Patient | null> {
  const normPhone = normalizePhone(phone);
  const normEmail = normalizeEmail(email);

  // Strategy 1: match both email AND phone
  const { data: byBoth, error: errBoth } = await supabase
    .from("patients")
    .select("*")
    .eq("phone", normPhone)
    .eq("email", normEmail)
    .limit(1)
    .maybeSingle();

  if (errBoth) {
    console.error(
      "Find patient by contact (email+phone) error:",
      errBoth
    );
    throw errBoth;
  }

  if (byBoth) {
    return byBoth;
  }

  // Strategy 2: match phone only
  const { data: byPhone, error: errPhone } = await supabase
    .from("patients")
    .select("*")
    .eq("phone", normPhone)
    .limit(1)
    .maybeSingle();

  if (errPhone) {
    console.error(
      "Find patient by contact (phone) error:",
      errPhone
    );
    throw errPhone;
  }

  if (byPhone) {
    return byPhone;
  }

  // Strategy 3: match email only
  const { data: byEmail, error: errEmail } = await supabase
    .from("patients")
    .select("*")
    .eq("email", normEmail)
    .limit(1)
    .maybeSingle();

  if (errEmail) {
    console.error(
      "Find patient by contact (email) error:",
      errEmail
    );
    throw errEmail;
  }

  return byEmail;
}

// ─────────────────────────────────────────────
// CREATE PATIENT
// ─────────────────────────────────────────────

export async function createPatient(
  input: CreatePatientInput
): Promise<Patient> {
  const { data, error } = await supabase
    .from("patients")
    .insert({
      full_name: input.full_name.trim(),
      phone: normalizePhone(input.phone),
      email: normalizeEmail(input.email),
      date_of_birth: input.date_of_birth ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) {
    console.error("Create patient error:", error);
    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────
// FIND OR CREATE PATIENT
// Uses the matching strategy to find an existing
// patient. Creates one if none found.
// ─────────────────────────────────────────────

export async function findOrCreatePatient(
  fullName: string,
  phone: string,
  email: string
): Promise<Patient> {
  const existing = await findPatientByContact(
    phone,
    email
  );

  if (existing) {
    return existing;
  }

  return createPatient({
    full_name: fullName,
    phone,
    email,
  });
}

// ─────────────────────────────────────────────
// GET PATIENTS (admin list)
// ─────────────────────────────────────────────

export async function getPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get patients error:", error);
    throw error;
  }

  return data ?? [];
}

// ─────────────────────────────────────────────
// SEARCH PATIENTS
// Server-side filter across name, phone, email.
// ─────────────────────────────────────────────

export async function searchPatients(
  query: string
): Promise<Patient[]> {
  const term = query.trim();

  if (!term) {
    return [];
  }

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .or(`full_name.ilike.%${term}%,phone.ilike.%${term}%,email.ilike.%${term}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Search patients error:", error);
    throw error;
  }

  return data ?? [];
}

// ─────────────────────────────────────────────
// GET PATIENT LIST (with counts + latest activity)
// Uses efficient grouped aggregates to avoid
// per-patient requests.
// ─────────────────────────────────────────────

export async function getPatientsList(): Promise<PatientListItem[]> {
  const { data: patients, error: patientsError } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (patientsError) {
    console.error("Get patients list error:", patientsError);
    throw patientsError;
  }

  const list = (patients ?? []) as Patient[];

  if (list.length === 0) {
    return [];
  }

  const patientIds = list.map((p) => p.id);

  const [inquiryCounts, appointmentCounts, inquiryRows, appointmentRows] =
    await Promise.all([
      supabase
        .from("inquiries")
        .select("patient_id, id(count)")
        .in("patient_id", patientIds)
        .returns<{ patient_id: string; count: number }[]>(),
      supabase
        .from("appointments")
        .select("patient_id, id(count)")
        .in("patient_id", patientIds)
        .returns<{ patient_id: string; count: number }[]>(),
      supabase
        .from("inquiries")
        .select("patient_id, created_at")
        .in("patient_id", patientIds)
        .returns<{ patient_id: string; created_at: string }[]>(),
      supabase
        .from("appointments")
        .select("patient_id, appointment_date")
        .in("patient_id", patientIds)
        .returns<{ patient_id: string; appointment_date: string }[]>(),
    ]);

  const inquiryCountMap = new Map(
    (inquiryCounts.data ?? []).map((r) => [r.patient_id, r.count])
  );
  const appointmentCountMap = new Map(
    (appointmentCounts.data ?? []).map((r) => [r.patient_id, r.count])
  );

  // Latest inquiry creation timestamp per patient.
  const inquiryLatestMap = new Map<string, string>();
  for (const r of inquiryRows.data ?? []) {
    const prev = inquiryLatestMap.get(r.patient_id);
    if (!prev || r.created_at > prev) {
      inquiryLatestMap.set(r.patient_id, r.created_at);
    }
  }

  // Latest appointment date (calendar date string) per patient.
  const appointmentLatestMap = new Map<string, string>();
  for (const r of appointmentRows.data ?? []) {
    const prev = appointmentLatestMap.get(r.patient_id);
    if (!prev || r.appointment_date > prev) {
      appointmentLatestMap.set(r.patient_id, r.appointment_date);
    }
  }

  return list.map((patient) => {
    const inquiryLatest = inquiryLatestMap.get(patient.id) ?? null;
    const appointmentLatest = appointmentLatestMap.get(patient.id) ?? null;

    // Latest activity: the more recent of latest inquiry creation
    // and latest scheduled appointment date. Appointment dates are
    // calendar dates; inquiry latest is a timestamp string.
    let latestActivity: string | null = null;
    if (inquiryLatest && appointmentLatest) {
      latestActivity =
        appointmentLatest > inquiryLatest.slice(0, 10)
          ? appointmentLatest
          : inquiryLatest;
    } else if (inquiryLatest) {
      latestActivity = inquiryLatest;
    } else if (appointmentLatest) {
      latestActivity = appointmentLatest;
    }

    return {
      ...patient,
      inquiry_count: inquiryCountMap.get(patient.id) ?? 0,
      appointment_count: appointmentCountMap.get(patient.id) ?? 0,
      latest_activity: latestActivity,
    };
  });
}

// ─────────────────────────────────────────────
// GET PATIENT HISTORY
// Fetches the patient plus all inquiries and
// appointments (with their item snapshots) using
// embedded relational selects. Returns a unified
// chronological timeline (newest first).
// ─────────────────────────────────────────────

export async function getPatientHistory(
  patientId: string
): Promise<PatientHistory | null> {
  const [patientRes, inquiriesRes, appointmentsRes] = await Promise.all([
    supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .maybeSingle(),
    supabase
      .from("inquiries")
      .select(
        `
        *,
        inquiry_items(
          id, inquiry_id, procedure_id, add_on_id,
          item_name, item_price
        )
      `
      )
      .eq("patient_id", patientId)
      .order("created_at", { ascending: true }),
    supabase
      .from("appointments")
      .select(
        `
        *,
        appointment_items!appointment_items_appointment_id_fkey(
          id, appointment_id, procedure_id, add_on_id,
          item_name, item_price, created_at
        )
      `
      )
      .eq("patient_id", patientId)
      .order("appointment_date", { ascending: true })
      .order("appointment_start_time", { ascending: true }),
  ]);

  if (patientRes.error) {
    console.error("Get patient history error:", patientRes.error);
    throw patientRes.error;
  }

  if (inquiriesRes.error) {
    console.error("Get patient history inquiries error:", inquiriesRes.error);
    throw inquiriesRes.error;
  }

  if (appointmentsRes.error) {
    console.error(
      "Get patient history appointments error:",
      appointmentsRes.error
    );
    throw appointmentsRes.error;
  }

  const patient = patientRes.data as Patient | null;

  if (!patient) {
    return null;
  }

  const inquiryRows = (inquiriesRes.data ?? []) as (Inquiry & {
    inquiry_items: InquiryItemSnapshot[];
  })[];

  const appointmentRows = (appointmentsRes.data ?? []) as (Appointment & {
    appointment_items: AppointmentItemSnapshot[];
  })[];

  const inquiries: InquiryWithItems[] = inquiryRows.map(({ inquiry_items, ...inquiry }) => ({
    inquiry,
    items: inquiry_items ?? [],
  }));

  const appointments: AppointmentWithItems[] = appointmentRows.map(
    ({ appointment_items, ...appointment }) => ({
      appointment,
      items: appointment_items ?? [],
    })
  );

  const entries: PatientHistoryEntry[] = [
    ...inquiries.map(({ inquiry, items }) => ({
      key: `inquiry:${inquiry.id}`,
      type: "inquiry" as const,
      date: inquiry.created_at,
      inquiry,
      items,
    })),
    ...appointments.map(({ appointment, items }) => ({
      key: `appointment:${appointment.id}`,
      type: "appointment" as const,
      date: appointment.appointment_date,
      appointment,
      items,
    })),
  ].sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0));

  return {
    patient,
    inquiries,
    appointments,
    entries,
  };
}
