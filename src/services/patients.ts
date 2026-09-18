import { supabase } from "../lib/supabase";
import { todayLocalString } from "../lib/dates";
import type {
  Patient,
  PatientListItem,
  PatientListResult,
  PatientHistory,
  InquiryWithItems,
  AppointmentWithItems,
  PatientHistoryEntry,
  InquiryItemSnapshot,
  AppointmentItemSnapshot,
  CreatePatientInput,
  UpdatePatientInput,
  UpcomingAppointment,
  LatestInquirySummary,
} from "../types/patient";
import type { Inquiry, InquiryStatus } from "../types/inquiry";
import type {
  Appointment,
  AppointmentStatus,
} from "../types/appointment";

// ─────────────────────────────────────────────
// PHONE NORMALIZATION
// Keeps only digits, matching the database-level
// unique/history normalization
// (regexp_replace(phone, '[^0-9]', '', 'g')). A
// leading "+" is NOT preserved — otherwise a
// "+639..." value stored today would never match a
// "639..." lookup because the DB comparison happens
// on the already-normalized value.
// ─────────────────────────────────────────────

function normalizePhone(phone: string): string {
  return phone.trim().replace(/\D/g, "");
}

// ─────────────────────────────────────────────
// EMAIL NORMALIZATION
// Lowercases and trims.
// ─────────────────────────────────────────────

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// ─────────────────────────────────────────────
// LIKE ESCAPING
// Prevents user-supplied search text from being
// interpreted as LIKE wildcard characters.
// ─────────────────────────────────────────────

function escapeLike(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_");
}

// ─────────────────────────────────────────────
// PATIENT SEARCH FILTER
// Builds a database-side filter across full name,
// email, and phone. Phone matching uses the same
// normalization as patient resolution (non-digit
// characters are ignored), so formatted numbers
// still match stored records.
// ─────────────────────────────────────────────

function buildPatientSearchFilter(rawQuery: string): string | null {
  const term = rawQuery.trim();

  if (!term) {
    return null;
  }

  const conditions: string[] = [
    `full_name.ilike.%${escapeLike(term)}%`,
    `email.ilike.%${escapeLike(term)}%`,
  ];

  const phoneDigits = term.replace(/\D/g, "");

  if (phoneDigits) {
    conditions.push(`phone.ilike.%${escapeLike(phoneDigits)}%`);
  }

  return conditions.join(",");
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
// LIST PATIENTS (admin)
// Single entry point for the patient list and
// patient search. Search is applied database-side
// (never loaded into the browser for filtering)
// and results are paginated so only the current
// page's patient rows and their aggregate stats
// are transferred.
//
// Stats (inquiry count, appointment count, latest
// activity, upcoming appointment) are computed
// from grouped/bounded database queries rather
// than per-patient requests, avoiding N+1 access.
// ─────────────────────────────────────────────

export type ListPatientsParams = {
  query?: string;
  page?: number;
  pageSize?: number;
};

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type UpcomingAppointmentRow = {
  id: string;
  patient_id: string;
  appointment_date: string;
  appointment_start_time: string;
  appointment_end_time: string;
  status: AppointmentStatus;
};

type LatestInquiryRow = {
  id: string;
  patient_id: string;
  calculated_total_price: number;
  status: InquiryStatus;
  created_at: string;
  inquiry_items?: InquiryItemSnapshot[] | null;
};

export async function listPatients(
  params: ListPatientsParams = {}
): Promise<PatientListResult> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE)
  );
  const filter = params.query
    ? buildPatientSearchFilter(params.query)
    : null;

  let builder = supabase
    .from("patients")
    .select("*", { count: "exact" });

  if (filter) {
    builder = builder.or(filter);
  }

  const { data, count, error } = await builder
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("List patients error:", error);
    throw error;
  }

  const patients = (data ?? []) as Patient[];

  if (patients.length === 0) {
    return { patients: [], total: count ?? 0 };
  }

  const patientIds = patients.map((p) => p.id);
  const today = todayLocalString();

  const [
    inquiryIdRows,
    appointmentIdRows,
    inquiryRows,
    appointmentRows,
    upcomingRows,
    latestInquiryRows,
  ] = await Promise.all([
    // Raw inquiry patient_id rows for the visible patients. Counts are
    // computed in TypeScript below; plain column fetches avoid the
    // PostgREST embed/count ambiguity that exists between the multiple
    // relationships involving inquiries and appointments.
    supabase
      .from("inquiries")
      .select("patient_id")
      .in("patient_id", patientIds)
      .returns<{ patient_id: string }[]>(),
    supabase
      .from("appointments")
      .select("patient_id")
      .in("patient_id", patientIds)
      .returns<{ patient_id: string }[]>(),
    // Latest inquiry creation timestamp per patient.
    supabase
      .from("inquiries")
      .select("patient_id, created_at")
      .in("patient_id", patientIds)
      .returns<{ patient_id: string; created_at: string }[]>(),
    // Latest scheduled appointment date per patient.
    supabase
      .from("appointments")
      .select("patient_id, appointment_date")
      .in("patient_id", patientIds)
      .returns<{ patient_id: string; appointment_date: string }[]>(),
    // Next active upcoming appointment per patient. Status and date are
    // filtered in the database; ordered ascending so the first row per
    // patient is the earliest.
    supabase
      .from("appointments")
      .select(
        "id, patient_id, appointment_date, appointment_start_time, appointment_end_time, status"
      )
      .in("patient_id", patientIds)
      .gte("appointment_date", today)
      .in("status", ["scheduled", "confirmed"])
      .order("appointment_date", { ascending: true })
      .order("appointment_start_time", { ascending: true })
      .returns<UpcomingAppointmentRow[]>(),
    // Latest inquiry per patient (with item snapshots). Ordered by creation
    // timestamp descending so the first row encountered per patient is the
    // most recent inquiry.
    supabase
      .from("inquiries")
      .select(
        `id, patient_id, calculated_total_price, status, created_at,
         inquiry_items(id, procedure_id, add_on_id, item_name, item_price)`
      )
      .in("patient_id", patientIds)
      .order("created_at", { ascending: false })
      .returns<LatestInquiryRow[]>(),
  ]);

  for (const result of [
    inquiryIdRows,
    appointmentIdRows,
    inquiryRows,
    appointmentRows,
    upcomingRows,
    latestInquiryRows,
  ]) {
    if (result.error) {
      console.error("List patients stats error:", result.error);
      throw result.error;
    }
  }

  // Count inquiries and appointments per patient in TypeScript instead of
  // relying on ambiguous PostgREST aggregate queries.
  const inquiryCountMap = new Map<string, number>();
  for (const row of inquiryIdRows.data ?? []) {
    inquiryCountMap.set(
      row.patient_id,
      (inquiryCountMap.get(row.patient_id) ?? 0) + 1
    );
  }

  const appointmentCountMap = new Map<string, number>();
  for (const row of appointmentIdRows.data ?? []) {
    appointmentCountMap.set(
      row.patient_id,
      (appointmentCountMap.get(row.patient_id) ?? 0) + 1
    );
  }

  // Latest inquiry creation timestamp per patient.
  const inquiryLatestMap = new Map<string, string>();
  for (const row of inquiryRows.data ?? []) {
    const prev = inquiryLatestMap.get(row.patient_id);
    if (!prev || row.created_at > prev) {
      inquiryLatestMap.set(row.patient_id, row.created_at);
    }
  }

  // Latest appointment calendar date per patient.
  const appointmentLatestMap = new Map<string, string>();
  for (const row of appointmentRows.data ?? []) {
    const prev = appointmentLatestMap.get(row.patient_id);
    if (!prev || row.appointment_date > prev) {
      appointmentLatestMap.set(row.patient_id, row.appointment_date);
    }
  }

  // First row encountered per patient is the earliest upcoming appointment
  // because the query is ordered by date then start time ascending.
  const upcomingMap = new Map<string, UpcomingAppointment>();
  for (const row of upcomingRows.data ?? []) {
    if (!upcomingMap.has(row.patient_id)) {
      upcomingMap.set(row.patient_id, {
        id: row.id,
        appointment_date: row.appointment_date,
        appointment_start_time: row.appointment_start_time,
        appointment_end_time: row.appointment_end_time,
        status: row.status,
      });
    }
  }

  // First row encountered per patient is the latest inquiry because the
  // query is ordered by creation timestamp descending.
  const latestInquiryMap = new Map<string, LatestInquirySummary>();
  for (const row of latestInquiryRows.data ?? []) {
    if (!latestInquiryMap.has(row.patient_id)) {
      latestInquiryMap.set(row.patient_id, {
        id: row.id,
        calculated_total_price: row.calculated_total_price,
        status: row.status,
        created_at: row.created_at,
        items: row.inquiry_items ?? [],
      });
    }
  }

  const list: PatientListItem[] = patients.map((patient) => {
    const inquiryLatest = inquiryLatestMap.get(patient.id) ?? null;
    const appointmentLatest = appointmentLatestMap.get(patient.id) ?? null;

    // Latest activity: the more recent of latest inquiry creation and latest
    // scheduled appointment date. Appointment dates are calendar dates;
    // inquiry latest is a timestamp string — compare day-level only.
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
      upcoming_appointment: upcomingMap.get(patient.id) ?? null,
      latest_inquiry: latestInquiryMap.get(patient.id) ?? null,
    };
  });

  return {
    patients: list,
    total: count ?? list.length,
  };
}

// ─────────────────────────────────────────────
// UPDATE PATIENT (admin)
// Updates only basic administrative patient fields.
// Historical snapshots in inquiry_items and
// appointment_items are never modified by patient
// edits — they remain independent.
//
// Phone/email are normalized with the same rules
// used during patient creation, and conflicts are
// checked conservatively before updating. The
// unique normalized indexes remain the final
// authority under concurrency.
// ─────────────────────────────────────────────

async function assertPatientContactAvailable(
  patientId: string,
  phone: string,
  email: string
): Promise<void> {
  const existing = await findPatientByContact(phone, email);

  if (existing && existing.id !== patientId) {
    throw new Error(
      "Another patient already uses that phone number or email."
    );
  }
}

export async function updatePatient(
  id: string,
  input: UpdatePatientInput
): Promise<Patient> {
  const fullName = input.full_name.trim();
  const phone = normalizePhone(input.phone);
  const email = normalizeEmail(input.email);
  const dateOfBirth = input.date_of_birth || null;
  const notes = input.notes?.trim() || null;

  if (!fullName) {
    throw new Error("Patient name is required.");
  }

  if (!phone) {
    throw new Error("Phone number is required.");
  }

  if (!email) {
    throw new Error("Email address is required.");
  }

  await assertPatientContactAvailable(id, phone, email);

  const { data, error } = await supabase
    .from("patients")
    .update({
      full_name: fullName,
      phone,
      email,
      date_of_birth: dateOfBirth,
      notes,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Update patient error:", error);

    if (error.code === "23505") {
      throw new Error(
        "Another patient already uses that phone number or email."
      );
    }

    throw error;
  }

  return data as Patient;
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

  // Next active upcoming appointment. Completed, cancelled, and no_show
  // appointments are never treated as upcoming.
  const today = todayLocalString();

  const upcomingCandidates = appointments
    .map(({ appointment }) => appointment)
    .filter(
      (appointment) =>
        (appointment.status === "scheduled" ||
          appointment.status === "confirmed") &&
        appointment.appointment_date >= today
    )
    .sort((a, b) =>
      a.appointment_date === b.appointment_date
        ? a.appointment_start_time.localeCompare(
            b.appointment_start_time
          )
        : a.appointment_date < b.appointment_date
          ? -1
          : 1
    );

  const upcomingAppointment: UpcomingAppointment | null =
    upcomingCandidates.length > 0
      ? {
          id: upcomingCandidates[0].id,
          appointment_date: upcomingCandidates[0].appointment_date,
          appointment_start_time:
            upcomingCandidates[0].appointment_start_time,
          appointment_end_time:
            upcomingCandidates[0].appointment_end_time,
          status: upcomingCandidates[0].status,
        }
      : null;

  return {
    patient,
    inquiries,
    appointments,
    entries,
    upcoming_appointment: upcomingAppointment,
  };
}
