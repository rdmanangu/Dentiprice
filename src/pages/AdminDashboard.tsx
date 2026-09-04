import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, SectionHeader, Button, EmptyState, LoadingState } from "../components/ui";
import { getDashboardData, type DashboardData } from "../services/dashboard";
import type { AppointmentWithDetails } from "../types/appointment";
import type { Inquiry } from "../types/inquiry";
import AppointmentDetails from "../components/admin/AppointmentDetails";
import InquiryDetails from "../components/admin/InquiryDetails";
import { AppointmentStatusBadge } from "../components/admin/appointmentPrimitives";
import { InquiryStatusBadge } from "../components/admin/primitives";
import { formatPrice } from "../lib/formatPrice";

// ─────────────────────────────────────────────
// LOCAL DATE / TIME HELPERS
// ─────────────────────────────────────────────

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${suffix}`;
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatCreatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
}

// ─────────────────────────────────────────────
// SUMMARY CARD
// ─────────────────────────────────────────────

type SummaryCardProps = {
  label: string;
  value: number;
  valueClassName?: string;
  to?: string;
  hint?: string;
};

function SummaryCard({
  label,
  value,
  valueClassName = "text-ink",
  to,
  hint,
}: SummaryCardProps) {
  const inner = (
    <>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClassName}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="block rounded-card border border-border bg-surface p-6 shadow-card transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {inner}
      </Link>
    );
  }

  return <Card className="p-6">{inner}</Card>;
}

// ─────────────────────────────────────────────
// APPOINTMENT ROW (button)
// ─────────────────────────────────────────────

function AppointmentRow({
  appointment,
  onSelect,
}: {
  appointment: AppointmentWithDetails;
  onSelect: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(appointment.id)}
      className="flex w-full items-center justify-between gap-4 rounded-control border border-border bg-surface p-4 text-left transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="min-w-0">
        <p className="font-medium text-ink">
          {appointment.patient?.full_name ?? "Unknown patient"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          {formatShortDate(appointment.appointment_date)} ·{" "}
          {formatTime(appointment.appointment_start_time)} –{" "}
          {formatTime(appointment.appointment_end_time)}
        </p>
        {(appointment.appointment_items ?? []).length > 0 && (
          <p className="mt-1 text-xs text-slate-400">
            {appointment.appointment_items[0].item_name}
            {(appointment.appointment_items?.length ?? 0) > 1 &&
              ` +${(appointment.appointment_items?.length ?? 0) - 1} more`}
          </p>
        )}
      </div>
      <AppointmentStatusBadge status={appointment.status} />
    </button>
  );
}

// ─────────────────────────────────────────────
// INQUIRY ROW (button)
// ─────────────────────────────────────────────

function InquiryRow({
  inquiry,
  onSelect,
}: {
  inquiry: Inquiry;
  onSelect: (inquiry: Inquiry) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(inquiry)}
      className="flex w-full items-center justify-between gap-4 rounded-control border border-border bg-surface p-4 text-left transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="min-w-0">
        <p className="font-medium text-ink">{inquiry.patient_name}</p>
        <p className="mt-1 text-sm text-slate-500">
          {inquiry.preferred_date} ·{" "}
          <span className="capitalize">{inquiry.preferred_time_slot}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {formatPrice(inquiry.calculated_total_price)} · Created{" "}
          {formatCreatedAt(inquiry.created_at)}
        </p>
      </div>
      <InquiryStatusBadge status={inquiry.status} />
    </button>
  );
}

// ─────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────

function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAppointment, setSelectedAppointment] =
    useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] =
    useState<Inquiry | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);

    getDashboardData()
      .then((result) => {
        setData(result);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load dashboard data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh after a modal mutation so counts/lists stay accurate
  function handleAppointmentUpdated() {
    load();
  }

  function handleInquiryUpdated() {
    load();
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="Operational dashboard"
        subtitle={`Overview of your clinic's current state · ${todayLabel()}`}
      />

      {/* LOADING */}
      {loading && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="p-6">
                <LoadingState label="" className="h-4 w-24 rounded bg-slate-200" />
                <LoadingState label="" className="mt-3 h-8 w-16 rounded bg-slate-200" />
              </Card>
            ))}
          </div>
          <LoadingState label="Loading dashboard data..." />
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="rounded-card border border-error-border bg-error-bg p-8 text-center">
          <p className="text-sm font-medium text-error">
            Unable to load dashboard data.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Please try again.
          </p>
          <div className="mt-4">
            <Button type="button" variant="secondary" onClick={load}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* DATA */}
      {!loading && !error && data && (
        <>
          {/* SUMMARY CARDS */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <SummaryCard
              label="Pending inquiries"
              value={data.summary.pendingInquiries}
              valueClassName="text-warning"
              to="/admin/inquiries?filter=pending"
            />
            <SummaryCard
              label="Today's appointments"
              value={data.summary.todayAppointments}
              valueClassName="text-info"
              to="/admin/scheduling?view=list&date=today"
            />
            <SummaryCard
              label="Upcoming appointments"
              value={data.summary.upcomingAppointments}
              valueClassName="text-success"
              to="/admin/scheduling?view=list&date=future"
            />
            <SummaryCard
              label="Completed today"
              value={data.summary.completedToday}
              valueClassName="text-success"
              to="/admin/scheduling?view=list&date=today"
            />
            <SummaryCard
              label="Cancelled / no show today"
              value={data.summary.cancelledNoShowToday}
              valueClassName="text-error"
              to="/admin/scheduling?view=list&date=today"
            />
          </div>

          {/* QUICK ACTIONS */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Quick actions
            </h3>
            <div className="mt-3 flex flex-wrap gap-3">
              <Link
                to="/admin/inquiries"
                className="inline-flex items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                View inquiries
              </Link>
              <Link
                to="/admin/inquiries?filter=pending"
                className="inline-flex items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                View pending inquiries
              </Link>
              <Link
                to="/admin/scheduling"
                className="inline-flex items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                View scheduling
              </Link>
              <Link
                to="/admin/scheduling?view=list&date=today"
                className="inline-flex items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Today&apos;s schedule
              </Link>
              <Link
                to="/admin/patients"
                className="inline-flex items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                View patients
              </Link>
            </div>
          </section>

          {/* TODAY'S APPOINTMENTS */}
          <section>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-bold text-ink">
                Today&apos;s appointments
              </h3>
              <Link
                to="/admin/scheduling?view=list&date=today"
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                View all
              </Link>
            </div>

            {data.todayAppointments.length === 0 ? (
              <EmptyState
                title="No appointments scheduled for today."
                description="Newly scheduled appointments will appear here."
                className="mt-3"
              />
            ) : (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {data.todayAppointments.map((appt) => (
                  <AppointmentRow
                    key={appt.id}
                    appointment={appt}
                    onSelect={setSelectedAppointment}
                  />
                ))}
              </div>
            )}
          </section>

          {/* UPCOMING APPOINTMENTS */}
          <section>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-bold text-ink">
                Upcoming appointments
              </h3>
              <Link
                to="/admin/scheduling?view=list&date=future"
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                View all appointments
              </Link>
            </div>

            {data.upcomingAppointments.length === 0 ? (
              <EmptyState
                title="No upcoming appointments."
                description="Confirmed future appointments will appear here."
                className="mt-3"
              />
            ) : (
              <div className="mt-3 space-y-2">
                {data.upcomingAppointments.map((appt) => (
                  <AppointmentRow
                    key={appt.id}
                    appointment={appt}
                    onSelect={setSelectedAppointment}
                  />
                ))}
              </div>
            )}
          </section>

          {/* PENDING INQUIRIES */}
          <section>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-bold text-ink">
                Pending inquiries
              </h3>
              <Link
                to="/admin/inquiries?filter=pending"
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                View all
              </Link>
            </div>

            {data.pendingInquiries.length === 0 ? (
              <EmptyState
                title="No pending inquiries."
                description="Newly submitted consultation requests will appear here."
                className="mt-3"
              />
            ) : (
              <div className="mt-3 space-y-2">
                {data.pendingInquiries.map((inquiry) => (
                  <InquiryRow
                    key={inquiry.id}
                    inquiry={inquiry}
                    onSelect={setSelectedInquiry}
                  />
                ))}
              </div>
            )}
          </section>

          {/* RECENT INQUIRIES */}
          <section>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-lg font-bold text-ink">
                Recent inquiries
              </h3>
              <Link
                to="/admin/inquiries"
                className="text-sm font-medium text-primary underline-offset-2 hover:underline"
              >
                View all
              </Link>
            </div>

            {data.recentInquiries.length === 0 ? (
              <EmptyState
                title="No recent inquiries."
                description="Consultation requests will appear here once submitted."
                className="mt-3"
              />
            ) : (
              <div className="mt-3 space-y-2">
                {data.recentInquiries.map((inquiry) => (
                  <InquiryRow
                    key={inquiry.id}
                    inquiry={inquiry}
                    onSelect={setSelectedInquiry}
                  />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* APPOINTMENT DETAILS MODAL */}
      {selectedAppointment && (
        <AppointmentDetails
          appointmentId={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onStatusUpdated={() => {}}
          onAppointmentUpdated={handleAppointmentUpdated}
        />
      )}

      {/* INQUIRY DETAILS MODAL */}
      {selectedInquiry && (
        <InquiryDetails
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onStatusUpdated={handleInquiryUpdated}
        />
      )}
    </div>
  );
}

export default AdminDashboard;
