import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  Button,
  EmptyState,
  LoadingState,
  DataTable,
} from "../components/ui";
import {
  getDashboardData,
  isDashboardAuthError,
  type DashboardData,
  type RecentInquiry,
} from "../services/dashboard";
import type { AppointmentWithDetails } from "../types/appointment";
import type { Inquiry } from "../types/inquiry";
import AppointmentDetails from "../components/admin/AppointmentDetails";
import InquiryDetails from "../components/admin/InquiryDetails";
import { AppointmentStatusBadge } from "../components/admin/appointmentPrimitives";
import { InquiryStatusBadge } from "../components/admin/primitives";
import {
  IconNotifications,
  IconSearch,
  IconInquiries,
  IconCalendar,
  IconPatients,
  IconTreatments,
  IconChevronRight,
} from "../components/admin/icons";
import { formatPrice } from "../lib/formatPrice";
import { formatTime12, inquiryRef } from "../lib/patientDisplay";

// ─────────────────────────────────────────────
// LOCAL FORMATTING HELPERS
// ─────────────────────────────────────────────

function todayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatPreferredDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function dateChipParts(dateStr: string) {
  const date = new Date(dateStr + "T00:00:00");
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    day: date.getDate(),
    month: date.toLocaleDateString("en-US", { month: "short" }),
  };
}

function treatmentLabel(inquiry: RecentInquiry): string {
  const items = inquiry.inquiry_items ?? [];

  if (items.length === 0) {
    return "Consultation";
  }

  if (items.length === 1) {
    return items[0].item_name;
  }

  return `${items[0].item_name} +${items.length - 1} more`;
}

// ─────────────────────────────────────────────
// STATISTIC CARD
// ─────────────────────────────────────────────

type StatCardProps = {
  label: string;
  value: number;
  hint: string;
  to: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  iconBoxClass: string;
  iconClass: string;
};

function StatCard({
  label,
  value,
  hint,
  to,
  icon: Icon,
  iconBoxClass,
  iconClass,
}: StatCardProps) {
  return (
    <Link
      to={to}
      className="group rounded-card border border-border bg-surface p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-card ${iconBoxClass}`}
        >
          <Icon className={`h-5 w-5 ${iconClass}`} />
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-400">{hint}</p>
    </Link>
  );
}

// ─────────────────────────────────────────────
// UPCOMING APPOINTMENT CARD
// ─────────────────────────────────────────────

function UpcomingAppointmentCard({
  appointment,
  onSelect,
}: {
  appointment: AppointmentWithDetails;
  onSelect: (id: string) => void;
}) {
  const parts = dateChipParts(appointment.appointment_date);
  const items = appointment.appointment_items ?? [];
  const patient = appointment.patient?.full_name ?? "Unknown patient";
  const primary = items[0]?.item_name;
  const extra = items.length > 1 ? ` +${items.length - 1} more` : "";

  return (
    <button
      type="button"
      onClick={() => onSelect(appointment.id)}
      className="w-full rounded-control border border-border bg-bg/60 p-3 text-left transition-colors hover:border-accent/50 hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="flex items-start gap-3">
        <div className="flex w-12 shrink-0 flex-col items-center rounded-control border border-border bg-surface py-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {parts.weekday}
          </span>
          <span className="text-base font-bold leading-tight text-ink">
            {parts.day}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
            {parts.month}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-ink">
              {patient}
            </p>
            <AppointmentStatusBadge status={appointment.status} />
          </div>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {primary ? `${primary}${extra}` : "General appointment"}
          </p>
          <p className="mt-1 text-xs font-medium text-primary">
            {formatTime12(appointment.appointment_start_time)} –{" "}
            {formatTime12(appointment.appointment_end_time)}
          </p>
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD CONTENT
// Renders once dashboard data has loaded.
// ─────────────────────────────────────────────

function DashboardContent({
  data,
  onViewAppointment,
  onViewInquiry,
}: {
  data: DashboardData;
  onViewAppointment: (id: string) => void;
  onViewInquiry: (inquiry: Inquiry) => void;
}) {
  const { summary, recentInquiries, upcomingAppointments } = data;

  return (
    <div className="space-y-6">
      {/* STATISTICS CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending Inquiries"
          value={summary.pendingInquiries}
          hint="Awaiting review"
          to="/admin/inquiries?filter=pending"
          icon={IconInquiries}
          iconBoxClass="bg-warning-bg"
          iconClass="text-warning"
        />
        <StatCard
          label="Upcoming Appointments"
          value={summary.upcomingAppointments}
          hint="Next 7 days"
          to="/admin/scheduling?view=list&date=future"
          icon={IconCalendar}
          iconBoxClass="bg-info-bg"
          iconClass="text-info"
        />
        <StatCard
          label="Total Patients"
          value={summary.totalPatients}
          hint="All registered patients"
          to="/admin/patients"
          icon={IconPatients}
          iconBoxClass="bg-primary/10"
          iconClass="text-primary"
        />
        <StatCard
          label="Treatments"
          value={summary.totalTreatments}
          hint="Available treatments"
          to="/admin/treatments"
          icon={IconTreatments}
          iconBoxClass="bg-accent/10"
          iconClass="text-accent"
        />
      </div>

      {/* RECENT INQUIRIES + UPCOMING APPOINTMENTS */}
      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Recent Inquiries */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Recent Inquiries</h2>
            <Link
              to="/admin/inquiries"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              View all <IconChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <DataTable
            className="mt-3"
            ariaLabel="Recent inquiries"
            rows={recentInquiries}
            getRowId={(inquiry) => inquiry.id}
            emptyTitle="No inquiries yet."
            emptyDescription="Consultation requests will appear here once submitted."
            columns={[
              {
                key: "ref",
                header: "Ref. No.",
                render: (inquiry) => (
                  <span className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {inquiryRef(inquiry.id)}
                  </span>
                ),
              },
              {
                key: "patient",
                header: "Patient",
                render: (inquiry) => (
                  <p className="whitespace-nowrap font-medium text-ink">
                    {inquiry.patient_name}
                  </p>
                ),
              },
              {
                key: "treatment",
                header: "Treatment",
                render: (inquiry) => (
                  <span className="whitespace-nowrap text-sm text-slate-600">
                    {treatmentLabel(inquiry)}
                  </span>
                ),
              },
              {
                key: "total",
                header: "Est. Total",
                render: (inquiry) => (
                  <span className="whitespace-nowrap text-sm font-semibold text-ink">
                    {formatPrice(inquiry.calculated_total_price)}
                  </span>
                ),
              },
              {
                key: "date",
                header: "Preferred Date",
                render: (inquiry) => (
                  <span className="whitespace-nowrap text-sm text-slate-500">
                    {formatPreferredDate(inquiry.preferred_date)}
                  </span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (inquiry) => (
                  <InquiryStatusBadge status={inquiry.status} />
                ),
              },
              {
                key: "action",
                header: "Action",
                align: "right",
                render: (inquiry) => (
                  <button
                    type="button"
                    onClick={() => onViewInquiry(inquiry)}
                    className="inline-flex items-center gap-1 whitespace-nowrap rounded-control border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-accent/40 hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    View <IconChevronRight className="h-3.5 w-3.5" />
                  </button>
                ),
              },
            ]}
          />
        </div>

        {/* Upcoming Appointments */}
        <div>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">
                Upcoming Appointments
              </h2>
              <Link
                to="/admin/scheduling?view=list&date=future"
                className="text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                View all
              </Link>
            </div>

            {upcomingAppointments.length === 0 ? (
              <EmptyState
                className="mt-4"
                title="No upcoming appointments."
                description="Confirmed appointments within the next 7 days will appear here."
              />
            ) : (
              <div className="mt-4 space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <UpcomingAppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onSelect={onViewAppointment}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────

function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [searchInput, setSearchInput] = useState("");

  const [selectedAppointment, setSelectedAppointment] =
    useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const loading = data === null && error === null;

  useEffect(() => {
    let cancelled = false;

    getDashboardData()
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
          setSessionError(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          if (isDashboardAuthError(err)) {
            // Session unavailable or expired: distinct state so the UI does
            // not keep retrying data queries that will never authorize.
            setSessionError(true);
            setError(null);
          } else {
            setSessionError(false);
            setError("Unable to load dashboard data.");
          }
        }
      });

    return () => {
      cancelled = true;
    };
  }, [refreshToken]);

  function handleAppointmentUpdated() {
    setRefreshToken((current) => current + 1);
  }

  function handleInquiryUpdated() {
    setRefreshToken((current) => current + 1);
  }

  function handleRetry() {
    setError(null);
    setSessionError(false);
    setRefreshToken((current) => current + 1);
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      const term = searchInput.trim();
      navigate(
        term
          ? `/admin/patients?search=${encodeURIComponent(term)}`
          : "/admin/patients"
      );
    }
  }

  return (
    <div>
      {/* TOP HEADER */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Overview of clinic activity · {todayLabel()}
          </p>
        </div>

        <div className="flex w-full items-center gap-3 xl:w-auto">
          <div className="relative w-full xl:w-72">
            <label htmlFor="dashboard-search" className="sr-only">
              Search patients, inquiries
            </label>
            <IconSearch
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <input
              id="dashboard-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search patients, inquiries..."
              className="w-full rounded-control border border-border bg-surface py-2.5 pl-9 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <Link
            to="/admin/inquiries"
            className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-control border border-border bg-surface text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="View recent inquiries"
          >
            <IconNotifications className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-pill bg-cta" />
          </Link>
        </div>
      </div>

      {/* SESSION EXPIRED */}
      {sessionError && (
        <div className="mt-6 rounded-card border border-warning-border bg-warning-bg p-8 text-center">
          <p className="text-sm font-medium text-warning">
            Your admin session has expired.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Please sign in again to continue.
          </p>
          <div className="mt-4">
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate("/admin/login")}
            >
              Sign in again
            </Button>
          </div>
        </div>
      )}

      {/* LOADING */}
      {!sessionError && loading && (
        <div className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <LoadingState
                      label=""
                      className="h-4 w-24 rounded bg-slate-200"
                    />
                    <LoadingState
                      label=""
                      className="h-8 w-14 rounded bg-slate-200"
                    />
                  </div>
                  <div className="h-11 w-11 rounded-card bg-slate-100" />
                </div>
                <LoadingState
                  label=""
                  className="mt-4 h-3 w-32 rounded bg-slate-200"
                />
              </Card>
            ))}
          </div>
          <Card className="p-0">
            <div className="h-72 rounded-card bg-slate-100" />
          </Card>
        </div>
      )}

      {/* ERROR */}
      {!sessionError && !loading && error && (
        <div className="mt-6 rounded-card border border-error-border bg-error-bg p-8 text-center">
          <p className="text-sm font-medium text-error">
            Unable to load dashboard data.
          </p>
          <p className="mt-1 text-sm text-slate-600">Please try again.</p>
          <div className="mt-4">
            <Button type="button" variant="secondary" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* DATA */}
      {!sessionError && !loading && !error && data && (
        <div className="mt-6">
          <DashboardContent
            data={data}
            onViewAppointment={setSelectedAppointment}
            onViewInquiry={setSelectedInquiry}
          />
        </div>
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