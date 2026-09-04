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
// DASHBOARD DATA
// ─────────────────────────────────────────────

export type DashboardSummary = {
  pendingInquiries: number;
  todayAppointments: number;
  upcomingAppointments: number;
  completedToday: number;
  cancelledNoShowToday: number;
};

export type DashboardData = {
  summary: DashboardSummary;
  todayAppointments: AppointmentWithDetails[];
  upcomingAppointments: AppointmentWithDetails[];
  pendingInquiries: Inquiry[];
  recentInquiries: Inquiry[];
};

// ─────────────────────────────────────────────
// GET DASHBOARD DATA
// Runs efficient, bounded Supabase queries in
// parallel to avoid N+1 and to avoid loading the
// entire patient/inquiry/appointment database.
// All queries respect the existing admin RLS.
// ─────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
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

  const [apptsRes, upcomingRes, pendingRes, recentRes] = await Promise.all([
    // Today's appointments: appointment date == today
    supabase
      .from("appointments")
      .select(appointmentSelect)
      .eq("appointment_date", today)
      .order("appointment_start_time", { ascending: true }),
    // Upcoming operational appointments (exclude cancelled / completed)
    supabase
      .from("appointments")
      .select(appointmentSelect)
      .gt("appointment_date", today)
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
      .limit(6),
  ]);

  for (const res of [apptsRes, upcomingRes, pendingRes, recentRes]) {
    if (res.error) {
      console.error("Get dashboard data error:", res.error);
      throw res.error;
    }
  }

  const todayAppointments = (apptsRes.data ?? []) as AppointmentWithDetails[];
  const upcomingAppointments = (upcomingRes.data ?? []) as AppointmentWithDetails[];
  const pendingInquiries = (pendingRes.data ?? []) as Inquiry[];
  const recentInquiries = (recentRes.data ?? []) as Inquiry[];

  // Upcoming operational count: exclude cancelled / completed
  const upcomingOperational = upcomingAppointments.filter(
    (a) => a.status !== "cancelled" && a.status !== "completed"
  );

  const upcomingCount = upcomingOperational
    .filter((a) => a.status === "scheduled" || a.status === "confirmed")
    .length;

  const completedToday = todayAppointments.filter(
    (a) => a.status === "completed"
  ).length;

  const cancelledNoShowToday = todayAppointments.filter(
    (a) => a.status === "cancelled" || a.status === "no_show"
  ).length;

  return {
    summary: {
      pendingInquiries: pendingInquiries.length,
      todayAppointments: todayAppointments.length,
      upcomingAppointments: upcomingCount,
      completedToday,
      cancelledNoShowToday,
    },
    todayAppointments,
    upcomingAppointments,
    pendingInquiries,
    recentInquiries,
  };
}
