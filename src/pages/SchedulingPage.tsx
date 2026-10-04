import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type {
  AppointmentWithDetails,
  ConfirmScheduleResult,
} from "../types/appointment";
import {
  getAppointments,
  getAppointmentsByDateRange,
} from "../services/appointments";
import { Button } from "../components/ui";
import {
  DEFAULT_APPOINTMENT_FILTERS,
  collectTreatmentNames,
  filterAppointments,
  hasActiveAppointmentFilters,
  summarizeAppointments,
  type AppointmentFilters,
} from "../lib/appointmentFilters";
import {
  formatTodayLabel,
  todayLocalString,
} from "../lib/dates";
import { AppointmentScheduleModal } from "../components/admin/AppointmentScheduleModal";
import {
  AppointmentFilterBar,
  SchedulingSummaryCards,
} from "../components/admin/SchedulingSummaryCards";
import { SchedulingDashboard } from "../components/admin/SchedulingDashboard";
import { CalendarView } from "../components/admin/CalendarView";
import { AppointmentList } from "../components/admin/AppointmentList";
import AppointmentDetails from "../components/admin/AppointmentDetails";
import {
  IconCalendarDay,
  IconCheckCircle,
  IconGrid,
  IconList,
  IconRefresh,
} from "../components/admin/icons";

// ─────────────────────────────────────────────
// VIEW MODE
// ─────────────────────────────────────────────

type ViewMode = "overview" | "calendar" | "list";

const viewOptions: {
  label: string;
  value: ViewMode;
  icon: (props: { className?: string }) => React.JSX.Element;
}[] = [
  { label: "Overview", value: "overview", icon: IconGrid },
  { label: "Calendar", value: "calendar", icon: IconCalendarDay },
  { label: "List", value: "list", icon: IconList },
];

function isViewMode(value: string | null): value is ViewMode {
  return (
    value === "overview" ||
    value === "calendar" ||
    value === "list"
  );
}

// Dashboard links use `date=future`, so that alias has to keep working
// for existing bookmarks and in-app navigation.
function parseDatePreset(
  value: string | null
): AppointmentFilters["datePreset"] {
  if (value === "future") {
    return "upcoming";
  }

  if (
    value === "today" ||
    value === "upcoming" ||
    value === "week" ||
    value === "past"
  ) {
    return value;
  }

  return "all";
}

function parseStatusFilter(
  value: string | null
): AppointmentFilters["status"] {
  if (
    value === "scheduled" ||
    value === "confirmed" ||
    value === "completed" ||
    value === "cancelled" ||
    value === "no_show"
  ) {
    return value;
  }

  return "all";
}

// ─────────────────────────────────────────────
// SCHEDULING PAGE
// ─────────────────────────────────────────────

function SchedulingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const today = todayLocalString();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const requested = searchParams.get("view");
    return isViewMode(requested) ? requested : "overview";
  });

  const [filters, setFilters] = useState<AppointmentFilters>(() => {
    const params = new URLSearchParams(searchParams);

    return {
      ...DEFAULT_APPOINTMENT_FILTERS,
      datePreset: parseDatePreset(params.get("date")),
      status: parseStatusFilter(params.get("status")),
      search: params.get("search") ?? "",
    };
  });

  const [appointments, setAppointments] =
    useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [selectedAppointment, setSelectedAppointment] =
    useState<string | null>(null);

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string | undefined>();
  const [calendarFocusDate, setCalendarFocusDate] = useState<
    string | undefined
  >(undefined);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);

  // ─────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────

  // One request per load. State is only updated from the promise
  // callbacks so the effect never cascades a synchronous render.
  useEffect(() => {
    let cancelled = false;

    getAppointments()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setAppointments(data);
        setError(null);
        setLastUpdated(new Date());
      })
      .catch((err) => {
        console.error("Unable to load appointments:", err);

        if (!cancelled) {
          setError(
            "We could not load the appointment schedule. Please check your connection and try again."
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  // Calendar navigation loads only the range being displayed. Rows are
  // merged so switching views never drops an appointment that was
  // already on screen.
  const handleRefreshCalendar = useCallback(
    (startDate: string, endDate: string) => {
      getAppointmentsByDateRange(startDate, endDate)
        .then((data) => {
          setAppointments((current) => {
            const merged = new Map(
              current.map((appointment) => [
                appointment.id,
                appointment,
              ])
            );

            for (const appointment of data) {
              merged.set(appointment.id, appointment);
            }

            return Array.from(merged.values()).sort(
              (a, b) =>
                a.appointment_date === b.appointment_date
                  ? a.appointment_start_time.localeCompare(
                      b.appointment_start_time
                    )
                  : a.appointment_date.localeCompare(
                      b.appointment_date
                    )
            );
          });
          setError(null);
        })
        .catch((err) => {
          console.error(
            "Unable to refresh the visible date range:",
            err
          );
        });
    },
    []
  );

  // ─────────────────────────────────────────────
  // DERIVED DATA
  // ─────────────────────────────────────────────

  const filteredAppointments = useMemo(
    () => filterAppointments(appointments, filters, today),
    [appointments, filters, today]
  );

  const summary = useMemo(
    () => summarizeAppointments(appointments, today),
    [appointments, today]
  );

  const treatments = useMemo(
    () => collectTreatmentNames(appointments),
    [appointments]
  );

  const filtersActive = hasActiveAppointmentFilters(filters);

  // ─────────────────────────────────────────────
  // URL SYNC
  // Keeps dashboard deep links such as
  // /admin/scheduling?view=list&date=future working, and makes the
  // current view shareable.
  // ─────────────────────────────────────────────

  useEffect(() => {
    const next = new URLSearchParams();
    next.set("view", viewMode);

    if (filters.datePreset !== "all") {
      next.set("date", filters.datePreset);
    }

    if (filters.status !== "all") {
      next.set("status", filters.status);
    }

    if (filters.search.trim()) {
      next.set("search", filters.search.trim());
    }

    setSearchParams(next, { replace: true });
  }, [
    viewMode,
    filters.datePreset,
    filters.status,
    filters.search,
    setSearchParams,
  ]);

  // ─────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────

  function handleResetFilters() {
    setFilters(DEFAULT_APPOINTMENT_FILTERS);
  }

  function handleApplyMetric(
    status: AppointmentFilters["status"],
    datePreset: AppointmentFilters["datePreset"]
  ) {
    setFilters((current) => {
      const alreadyActive =
        current.status === status &&
        current.datePreset === datePreset;

      if (alreadyActive) {
        return DEFAULT_APPOINTMENT_FILTERS;
      }

      return {
        ...DEFAULT_APPOINTMENT_FILTERS,
        status,
        datePreset,
      };
    });

    setViewMode("list");
  }

  function handleRefresh() {
    setRefreshing(true);
    setReloadToken((token) => token + 1);
  }

  function handleRetry() {
    setError(null);
    setLoading(true);
    setReloadToken((token) => token + 1);
  }

  function openScheduleFor(date?: string) {
    setScheduleDate(date);
    setScheduleOpen(true);
  }

  // The overview hands over a date so the calendar opens on that day
  // instead of always snapping back to today.
  function handleViewCalendar(date?: string) {
    setCalendarFocusDate(date ?? today);
    setViewMode("calendar");
  }

  // Leaving the calendar drops any pending jump so coming back later
  // opens on the current month instead of an old focus.
  function handleSelectView(mode: ViewMode) {
    if (mode !== "calendar") {
      setCalendarFocusDate(undefined);
    }

    setViewMode(mode);
  }

  function handleScheduled(result: ConfirmScheduleResult) {
    setScheduleOpen(false);
    setScheduleDate(undefined);

    setNotice({
      tone: "success",
      message: `Appointment scheduled for ${result.appointment_date}. The inquiry is now confirmed.`,
    });

    // The inquiry status changed too, so a full refresh keeps every
    // count and view consistent.
    setRefreshing(true);
    setReloadToken((token) => token + 1);
  }

  function handleStatusUpdated(
    updated: AppointmentWithDetails
  ) {
    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === updated.id ? updated : appointment
      )
    );

    setNotice({
      tone: "success",
      message: `Appointment status updated to ${updated.status.replace(
        "_",
        " "
      )}.`,
    });
  }

  function handleAppointmentUpdated() {
    setRefreshing(true);
    setReloadToken((token) => token + 1);
  }

  function dismissNotice() {
    setNotice(null);
  }

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  const showFilters =
    viewMode === "list" || viewMode === "calendar";

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-ink sm:text-3xl">
            Appointment Scheduling
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage and organize your dental appointments.
          </p>

          <p className="mt-2 inline-flex items-center gap-2 rounded-pill bg-surface px-3 py-1 text-xs font-medium text-slate-500 shadow-card">
            <IconCalendarDay className="h-3.5 w-3.5 text-primary" />
            {formatTodayLabel()}

            {lastUpdated && !loading && (
              <span className="hidden text-slate-400 sm:inline">
                · Updated{" "}
                {lastUpdated.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </span>
            )}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 lg:w-auto">
          <Button
            type="button"
            variant="secondary"
            onClick={handleRefresh}
            disabled={refreshing}
            aria-label="Refresh appointments"
          >
            <IconRefresh
              className={`h-4 w-4 ${
                refreshing ? "animate-spin" : ""
              }`}
            />
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>

          <Button
            type="button"
            onClick={() => openScheduleFor()}
          >
            Schedule Appointment
          </Button>
        </div>
      </header>

      {/* FEEDBACK */}
      {notice && (
        <div
          role="status"
          className={`flex flex-wrap items-center justify-between gap-3 rounded-card border p-4 text-sm font-medium ${
            notice.tone === "success"
              ? "border-success-border bg-success-bg text-success"
              : "border-error-border bg-error-bg text-error"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {notice.tone === "success" && (
              <IconCheckCircle className="h-4 w-4" />
            )}
            {notice.message}
          </span>

          <button
            type="button"
            onClick={dismissNotice}
            className="text-xs font-semibold underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="rounded-card border border-border bg-surface p-4 shadow-card"
              >
                <div className="h-3 w-24 rounded bg-slate-200" />
                <div className="mt-3 h-8 w-12 rounded bg-slate-200" />
                <div className="mt-3 h-2.5 w-20 rounded bg-slate-100" />
              </div>
            ))}
          </div>

          <div
            className="rounded-card border border-border bg-surface p-10 text-center shadow-card"
            role="status"
          >
            <p className="text-sm text-slate-500">
              Loading appointments...
            </p>
          </div>
        </div>
      )}

      {/* ERROR */}
      {!loading && error && (
        <div className="rounded-card border border-error-border bg-error-bg p-8 text-center">
          <p
            role="alert"
            className="text-sm font-medium text-error"
          >
            Unable to load the appointment schedule
          </p>

          <p className="mt-1 text-sm text-slate-600">
            The clinic schedule could not be fetched. Nothing has been
            changed — you can safely retry.
          </p>

          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleRetry}
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* SUMMARY CARDS */}
          <SchedulingSummaryCards
            summary={summary}
            filters={filters}
            onApplyFilters={handleApplyMetric}
          />

          {/* VIEW SWITCHER */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              className="flex rounded-control border border-border bg-surface p-1 shadow-card"
              role="group"
              aria-label="Scheduling view"
            >
              {viewOptions.map((option) => {
                const Icon = option.icon;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      handleSelectView(option.value)
                    }
                    aria-pressed={viewMode === option.value}
                    className={`inline-flex items-center gap-2 rounded-control px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:px-4 ${
                      viewMode === option.value
                        ? "bg-primary text-white"
                        : "text-slate-600 hover:bg-bg"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            {viewMode === "overview" && filtersActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-sm font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Reset filters
              </button>
            )}
          </div>

          {/* FILTERS */}
          {showFilters && (
            <AppointmentFilterBar
              filters={filters}
              treatments={treatments}
              resultCount={filteredAppointments.length}
              totalCount={appointments.length}
              onChange={setFilters}
              onReset={handleResetFilters}
            />
          )}

          {/* VIEWS */}
          {viewMode === "overview" && (
<SchedulingDashboard
              appointments={filteredAppointments}
              onSelectAppointment={setSelectedAppointment}
              onViewCalendar={handleViewCalendar}
              onScheduleForDate={openScheduleFor}
            />
          )}

          {viewMode === "calendar" && (
            <CalendarView
              appointments={filteredAppointments}
              onSelectAppointment={setSelectedAppointment}
              onRefreshRange={handleRefreshCalendar}
              onScheduleForDate={openScheduleFor}
              focusDate={calendarFocusDate}
            />
          )}

          {viewMode === "list" && (
            <AppointmentList
              appointments={filteredAppointments}
              onSelect={setSelectedAppointment}
              isFiltered={filtersActive}
              onResetFilters={handleResetFilters}
              emptyAction={
                <Button
                  type="button"
                  onClick={() => openScheduleFor()}
                >
                  Schedule Appointment
                </Button>
              }
            />
          )}
        </>
      )}

      {/* SCHEDULE MODAL */}
      <AppointmentScheduleModal
        open={scheduleOpen}
        appointments={appointments}
        initialDate={scheduleDate}
        onClose={() => {
          setScheduleOpen(false);
          setScheduleDate(undefined);
        }}
        onScheduled={handleScheduled}
      />

      {/* APPOINTMENT DETAILS */}
      {selectedAppointment && (
        <AppointmentDetails
          appointmentId={selectedAppointment}
          schedule={appointments}
          onClose={() => setSelectedAppointment(null)}
          onStatusUpdated={handleStatusUpdated}
          onAppointmentUpdated={handleAppointmentUpdated}
        />
      )}
    </div>
  );
}

export default SchedulingPage;