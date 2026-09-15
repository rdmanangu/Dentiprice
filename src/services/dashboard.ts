import { supabase } from "../lib/supabase";
import type { AppointmentWithDetails } from "../types/appointment";
import type { Inquiry } from "../types/inquiry";

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

export type DashboardData = {
  summary: DashboardSummary;
  upcomingAppointments: AppointmentWithDetails[];
  pendingInquiries: Inquiry[];
  recentInquiries: Inquiry[];
  procedureNameMap: Record<string, string>;
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

  const upcomingFrom = new Date(today);
  upcomingFrom.setDate(upcomingFrom.getDate() + 1);
  const upcomingFromStr = `${upcomingFrom.getFullYear()}-${String(
    upcomingFrom.getMonth() + 1
  ).padStart(2, "0")}-${String(upcomingFrom.getDate()).padStart(2, "0")}`;

  const upcomingTo = new Date(today);
  upcomingTo.setDate(upcomingTo.getDate() + 7);
  const upcomingToStr = `${upcomingTo.getFullYear()}-${String(
    upcomingTo.getMonth() + 1
  ).padStart(2, "0")}-${String(upcomingTo.getDate()).padStart(2, "0")}`;

  const [
    upcomingRes,
    pendingRes,
    recentRes,
    patientCountRes,
    procedureCountRes,
  ] = await Promise.all([
    // Upcoming appointments within the next 7 days (exclude cancelled / completed)
    supabase
      .from("appointments")
      .select(appointmentSelect)
      .gte("appointment_date", upcomingFromStr)
      .lte("appointment_date", upcomingToStr)
      .not("status", "in", "('cancelled','completed')")
      .order("appointment_date", { ascending: true })
      .order("appointment_start_time", { ascending: true })
      .limit(10),
    // Pending inquiries: latest first
    supabase
      .from("inquiries")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    // Recent inquiries: all statuses, latest first
    supabase
      .from("inquiries")
      .select("*")
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
  ]);

  for (const res of [
    upcomingRes,
    pendingRes,
    recentRes,
    patientCountRes,
    procedureCountRes,
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
  const pendingInquiries = (pendingRes.data ?? []) as Inquiry[];
  const recentInquiries = (recentRes.data ?? []) as Inquiry[];

  const totalPatients = patientCountRes.count ?? 0;
  const totalTreatments = procedureCountRes.count ?? 0;

  // Build a procedure ID → name map for the recent inquiries table.
  const procedureIds = Array.from(
    new Set(
      recentInquiries.flatMap((inquiry) => inquiry.selected_procedure_ids ?? [])
    )
  );

  let procedureNameMap: Record<string, string> = {};

  if (procedureIds.length > 0) {
    const { data: procedureRows } = await supabase
      .from("procedures")
      .select("id, name")
      .in("id", procedureIds);

    if (procedureRows) {
      procedureNameMap = Object.fromEntries(
        procedureRows.map((row) => [row.id, row.name])
      );
    }
  }

  return {
    summary: {
      pendingInquiries: pendingInquiries.length,
      upcomingAppointments: upcomingAppointments.length,
      totalPatients,
      totalTreatments,
    },
    upcomingAppointments,
    pendingInquiries,
    recentInquiries,
    procedureNameMap,
  };
}
