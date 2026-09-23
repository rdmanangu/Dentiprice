import { supabase } from "../lib/supabase";
import type { AppointmentWithDetails } from "../types/appointment";
import type { Inquiry } from "../types/inquiry";
import type { InquiryItemSnapshot } from "../types/patient";

// ─────────────────────────────────────────────
// LOCAL DATE HELPERS
// These produce date-only strings (YYYY-MM-DD)
// using the user's local timezone, consistent
// with the scheduling implementation. Never use
// toISOString here, which can shift a date to
// the wrong calendar day due to UTC conversion.
// ─────────────────────────────────────────────

function todayLocalString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Adds a number of days to a YYYY-MM-DD string using LOCAL time.
// new Date("YYYY-MM-DD") in JS parses as UTC midnight, which can land on the
// previous calendar day in timezones behind UTC. Appending "T00:00:00" keeps
// the arithmetic in the user's local timezone.
function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ─────────────────────────────────────────────
// AUTHENTICATION GUARD
// The dashboard must never query PostgREST without a live session.
// getSession() does NOT revalidate token expiry, so an expired JWT can
// otherwise be attached to every query and produce HTTP 401 responses.
// ─────────────────────────────────────────────

export class DashboardAuthError extends Error {
  constructor(
    message = "Your admin session is unavailable or has expired."
  ) {
    super(message);
    this.name = "DashboardAuthError";
  }
}

export function isDashboardAuthError(
  error: unknown
): error is DashboardAuthError {
  return error instanceof DashboardAuthError;
}

export async function ensureAdminSession(): Promise<void> {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("Unable to read admin session:", error);
    throw new DashboardAuthError();
  }

  const session = data.session;

  if (!session) {
    throw new DashboardAuthError();
  }

  if (session.user.app_metadata.role !== "admin") {
    throw new DashboardAuthError("Admin access is required.");
  }

  // getSession() returns the stored session even when the access token has
  // already expired. Refresh before querying so we never send an expired
  // JWT to PostgREST. If the refresh token is also invalid, the session is
  // cleared and we exit to the login state instead of looping on 401s.
  const expiresAt = session.expires_at;
  if (expiresAt && expiresAt <= Math.floor(Date.now() / 1000)) {
    const refresh = await supabase.auth.refreshSession({
      refresh_token: session.refresh_token,
    });

    if (refresh.error || !refresh.data.session) {
      console.error("Admin session refresh failed:", refresh.error);
      throw new DashboardAuthError();
    }
  }
}

// ─────────────────────────────────────────────
// DASHBOARD DATA
// ─────────────────────────────────────────────

export type DashboardSummary = {
  pendingInquiries: number;
  upcomingAppointments: number;
  totalPatients: number;
  totalTreatments: number;
};

// A recent inquiry as shown on the dashboard, including its line-item
// snapshots so the treatment column reflects the actual consultation
// contents rather than relying on a non-schema column.
export type RecentInquiry = Inquiry & {
  inquiry_items: InquiryItemSnapshot[];
};

export type DashboardData = {
  summary: DashboardSummary;
  upcomingAppointments: AppointmentWithDetails[];
  recentInquiries: RecentInquiry[];
};

// ─────────────────────────────────────────────
// GET DASHBOARD DATA
// Runs efficient, bounded Supabase queries in
// parallel to avoid N+1 and to avoid loading the
// entire patient/inquiry/appointment database.
// All queries respect the existing admin RLS.
// ─────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
  // Never query before a live admin session exists (prevents the dashboard
  // from firing requests with a missing or expired JWT → HTTP 401).
  await ensureAdminSession();

  const today = todayLocalString();

  const appointmentSelect = `
    *,
    patient:patients!appointments_patient_id_fkey(
      id, full_name, phone, email
    ),
    appointment_items!appointment_items_appointment_id_fkey(
      id, appointment_id, procedure_id, add_on_id,
      item_name, item_price, created_at
    )
  `;

  const upcomingFromStr = addDays(today, 1);
  const upcomingToStr = addDays(today, 7);

  const [
    upcomingRes,
    recentRes,
    patientCountRes,
    procedureCountRes,
    pendingCountRes,
    upcomingCountRes,
  ] = await Promise.all([
    // Upcoming appointments within the next 7 days (active statuses only —
    // scheduled and confirmed; cancelled, completed, and no_show are not
    // upcoming).
    supabase
      .from("appointments")
      .select(appointmentSelect)
      .gte("appointment_date", upcomingFromStr)
      .lte("appointment_date", upcomingToStr)
      .in("status", ["scheduled", "confirmed"])
      .order("appointment_date", { ascending: true })
      .order("appointment_start_time", { ascending: true })
      .limit(10),
    // Recent inquiries: all statuses, latest first, with their item snapshots.
    supabase
      .from("inquiries")
      .select(
        `*,
         inquiry_items(id, procedure_id, add_on_id, item_name, item_price)`
      )
      .order("created_at", { ascending: false })
      .limit(8),
    // Total patients count
    supabase
      .from("patients")
      .select("id", { count: "exact", head: true }),
    // Total treatments count
    supabase
      .from("procedures")
      .select("id", { count: "exact", head: true }),
    // Pending inquiries count (head-only, EXACT — not derived from a limited list)
    supabase
      .from("inquiries")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    // Upcoming appointments count (head-only, EXACT — not derived from a limited list)
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .gte("appointment_date", upcomingFromStr)
      .lte("appointment_date", upcomingToStr)
      .in("status", ["scheduled", "confirmed"]),
  ]);

  for (const res of [
    upcomingRes,
    recentRes,
    patientCountRes,
    procedureCountRes,
    pendingCountRes,
    upcomingCountRes,
  ]) {
    if (res.error) {
      // A 401 here means the JWT attached to the request was rejected mid-flight
      // (e.g. it expired after the guard above ran). Re-check the session so
      // authentication failures are distinguishable from data/RLS/query errors.
      const sessionCheck = await supabase.auth.getSession();

      if (sessionCheck.error || !sessionCheck.data.session) {
        console.error(
          "Dashboard query failed because the admin session was lost:",
          res.error
        );
        throw new DashboardAuthError();
      }

      console.error("Get dashboard data error:", res.error);
      throw res.error;
    }
  }

  const upcomingAppointments = (upcomingRes.data ?? []) as AppointmentWithDetails[];
  const recentInquiries = (recentRes.data ?? []) as RecentInquiry[];

  const totalPatients = patientCountRes.count ?? 0;
  const totalTreatments = procedureCountRes.count ?? 0;
  const pendingInquiries = pendingCountRes.count ?? 0;
  const upcomingCount = upcomingCountRes.count ?? 0;

  return {
    summary: {
      pendingInquiries,
      upcomingAppointments: upcomingCount,
      totalPatients,
      totalTreatments,
    },
    upcomingAppointments,
    recentInquiries,
  };
}
