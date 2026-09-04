import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  AppointmentStatus,
  AppointmentWithDetails,
} from "../types/appointment";
import {
  getAppointments,
  getAppointmentsByDateRange,
} from "../services/appointments";
import { DataTable, SectionHeader } from "../components/ui";
import { AppointmentStatusBadge } from "../components/admin/appointmentPrimitives";
import { SchedulingDashboard } from "../components/admin/SchedulingDashboard";
import { CalendarView } from "../components/admin/CalendarView";
import AppointmentDetails from "../components/admin/AppointmentDetails";

// ─────────────────────────────────────────────
// VIEW MODE
// ─────────────────────────────────────────────

type ViewMode = "dashboard" | "calendar" | "list";

const viewOptions: { label: string; value: ViewMode }[] = [
  { label: "Dashboard", value: "dashboard" },
  { label: "Calendar", value: "calendar" },
  { label: "List", value: "list" },
];

// ─────────────────────────────────────────────
// FILTERS (for List view)
// ─────────────────────────────────────────────

type StatusFilter = "all" | AppointmentStatus;

type DateFilter = "all" | "today" | "future" | "past";

const statusFilters: { label: string; value: StatusFilter }[] = [
  { label: "All", value: "all" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "No Show", value: "no_show" },
];

const dateFilters: { label: string; value: DateFilter }[] = [
  { label: "All dates", value: "all" },
  { label: "Today", value: "today" },
  { label: "Future", value: "future" },
  { label: "Past", value: "past" },
];

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ─────────────────────────────────────────────
// SCHEDULING PAGE
// ─────────────────────────────────────────────

function SchedulingPage() {
  const [searchParams] = useSearchParams();
  const requestedView = searchParams.get("view");
  const requestedDateFilter = searchParams.get("date");

  const [viewMode, setViewMode] = useState<ViewMode>(
    requestedView === "calendar" || requestedView === "list"
      ? requestedView
      : "dashboard"
  );
  const [appointments, setAppointments] = useState<
    AppointmentWithDetails[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // List view filters
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>(
    requestedDateFilter === "today" ||
      requestedDateFilter === "future" ||
      requestedDateFilter === "past"
      ? requestedDateFilter
      : "all"
  );

  // Appointment details modal
  const [selectedAppointment, setSelectedAppointment] =
    useState<string | null>(null);

  // ─────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────

  const loadAllAppointments = useCallback(() => {
    setLoading(true);
    setError(null);

    getAppointments()
      .then((data) => {
        setAppointments(data);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load appointments.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    loadAllAppointments();
  }, [loadAllAppointments]);

  function handleStatusUpdated(
    updated: AppointmentWithDetails
  ) {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === updated.id ? updated : appointment
      )
    );
  }

  function handleAppointmentUpdated() {
    loadAllAppointments();
  }

  function handleRefreshCalendar(startDate: string, endDate: string) {
    getAppointmentsByDateRange(startDate, endDate)
      .then((data) => {
        setAppointments((current) => {
          const existing = new Map(current.map((a) => [a.id, a]));
          for (const appt of data) {
            existing.set(appt.id, appt);
          }
          return Array.from(existing.values()).sort((a, b) =>
            a.appointment_date === b.appointment_date
              ? a.appointment_start_time.localeCompare(b.appointment_start_time)
              : a.appointment_date.localeCompare(b.appointment_date)
          );
        });
      })
      .catch((err) => {
        console.error(err);
      });
  }

  // ─────────────────────────────────────────────
  // LIST VIEW FILTERING
  // ─────────────────────────────────────────────

  const today = todayDateString();

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      const matchesStatus =
        statusFilter === "all" ||
        appointment.status === statusFilter;

      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate = appointment.appointment_date === today;
      } else if (dateFilter === "future") {
        matchesDate = appointment.appointment_date > today;
      } else if (dateFilter === "past") {
        matchesDate = appointment.appointment_date < today;
      }

      return matchesStatus && matchesDate;
    });
  }, [appointments, statusFilter, dateFilter, today]);

  return (
    <section>
      <SectionHeader
        title="Scheduling"
        subtitle="View and manage appointments."
        actions={
          <div className="flex rounded-control border border-border">
            {viewOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setViewMode(option.value)}
                className={`px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                  viewMode === option.value
                    ? "bg-primary text-white"
                    : "bg-surface text-slate-600 hover:bg-bg"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      />

      {/* ERROR */}
      {error && (
        <p
          role="alert"
          className="mt-4 rounded-control border border-error-border bg-error-bg p-4 text-sm font-medium text-error"
        >
          {error}
        </p>
      )}

      {/* DASHBOARD VIEW */}
      {viewMode === "dashboard" && (
        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-slate-500" role="status">
              Loading appointments...
            </p>
          ) : (
            <SchedulingDashboard
              appointments={appointments}
              onSelectAppointment={setSelectedAppointment}
            />
          )}
        </div>
      )}

      {/* CALENDAR VIEW */}
      {viewMode === "calendar" && (
        <div className="mt-6">
          {loading ? (
            <p className="text-sm text-slate-500" role="status">
              Loading appointments...
            </p>
          ) : (
            <CalendarView
              appointments={appointments}
              onSelectAppointment={setSelectedAppointment}
              onRefreshRange={handleRefreshCalendar}
            />
          )}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div className="mt-6">
          <p className="mb-4 text-sm text-slate-500" aria-live="polite">
            {filteredAppointments.length}{" "}
            {filteredAppointments.length === 1
              ? "appointment"
              : "appointments"}
          </p>

          <div className="mb-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  aria-pressed={statusFilter === filter.value}
                  className={`rounded-control px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    statusFilter === filter.value
                      ? "bg-primary text-white"
                      : "bg-surface text-slate-700 hover:bg-bg border border-border"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {dateFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setDateFilter(filter.value)}
                  aria-pressed={dateFilter === filter.value}
                  className={`rounded-control px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    dateFilter === filter.value
                      ? "bg-primary text-white"
                      : "bg-surface text-slate-700 hover:bg-bg border border-border"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <DataTable
            ariaLabel="Appointments"
            loading={loading}
            loadingLabel="Loading appointments..."
            error={null}
            emptyTitle="No appointments found."
            emptyDescription={
              statusFilter === "all" && dateFilter === "all"
                ? "Appointments created from the Confirm & Schedule workflow will appear here."
                : "No appointments match the current filters."
            }
            rows={filteredAppointments}
            getRowId={(appointment) => appointment.id}
            onRowClick={(appointment) =>
              setSelectedAppointment(appointment.id)
            }
            columns={[
              {
                key: "patient",
                header: "Patient",
                render: (appointment) => (
                  <p className="font-medium text-ink">
                    {appointment.patient?.full_name ?? "Unknown patient"}
                  </p>
                ),
              },
              {
                key: "date",
                header: "Date",
                render: (appointment) => (
                  <span className="text-sm">
                    {appointment.appointment_date}
                  </span>
                ),
              },
              {
                key: "time",
                header: "Time",
                render: (appointment) => (
                  <span className="text-sm">
                    {appointment.appointment_start_time} –{" "}
                    {appointment.appointment_end_time}
                  </span>
                ),
              },
              {
                key: "treatment",
                header: "Treatment",
                render: (appointment) => {
                  const items = appointment.appointment_items ?? [];
                  if (items.length === 0) {
                    return (
                      <span className="text-sm text-slate-400">—</span>
                    );
                  }
                  const primary = items[0].item_name;
                  const remaining = items.length - 1;
                  return (
                    <span className="text-sm">
                      {primary}
                      {remaining > 0 && (
                        <span className="text-slate-500">
                          {" "}
                          +{remaining} more
                        </span>
                      )}
                    </span>
                  );
                },
              },
              {
                key: "status",
                header: "Status",
                render: (appointment) => (
                  <AppointmentStatusBadge
                    status={appointment.status}
                  />
                ),
              },
            ]}
          />
        </div>
      )}

      {/* APPOINTMENT DETAILS MODAL */}
      {selectedAppointment && (
        <AppointmentDetails
          appointmentId={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onStatusUpdated={handleStatusUpdated}
          onAppointmentUpdated={handleAppointmentUpdated}
        />
      )}
    </section>
  );
}

export default SchedulingPage;
