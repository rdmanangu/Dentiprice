import type { AppointmentStatus } from "../../types/appointment";
import type {
  AppointmentFilters,
  AppointmentSummary,
} from "../../lib/appointmentFilters";
import { appointmentStatusLabel } from "../../lib/appointmentFilters";
import {
  IconBan,
  IconCalendarDay,
  IconCalendarFuture,
  IconCheckCircle,
  IconClock,
} from "./icons";

type MetricKey =
  | "today"
  | "upcoming"
  | "completed"
  | "pending"
  | "cancelled";

type MetricDefinition = {
  key: MetricKey;
  label: string;
  hint: string;
  icon: (props: { className?: string }) => React.JSX.Element;
  iconBoxClass: string;
  iconClass: string;
  valueClass: string;
  /** Filters applied when the card is used as a shortcut. */
  target: {
    status: AppointmentFilters["status"];
    datePreset: AppointmentFilters["datePreset"];
  };
};

// Counts come from the loaded appointment rows (see
// summarizeAppointments), never from hardcoded numbers.
const metrics: MetricDefinition[] = [
  {
    key: "today",
    label: "Today's Appointments",
    hint: "All statuses",
    icon: IconCalendarDay,
    iconBoxClass: "bg-primary/10",
    iconClass: "text-primary",
    valueClass: "text-ink",
    target: { status: "all", datePreset: "today" },
  },
  {
    key: "upcoming",
    label: "Upcoming Appointments",
    hint: "Today onward · active",
    icon: IconCalendarFuture,
    iconBoxClass: "bg-info-bg",
    iconClass: "text-info",
    valueClass: "text-info",
    target: { status: "all", datePreset: "upcoming" },
  },
  {
    key: "pending",
    label: "Pending Appointments",
    hint: `${appointmentStatusLabel(
      "scheduled"
    )} · awaiting confirmation`,
    icon: IconClock,
    iconBoxClass: "bg-warning-bg",
    iconClass: "text-warning",
    valueClass: "text-warning",
    target: { status: "scheduled", datePreset: "all" },
  },
  {
    key: "completed",
    label: "Completed Appointments",
    hint: "All time",
    icon: IconCheckCircle,
    iconBoxClass: "bg-success-bg",
    iconClass: "text-success",
    valueClass: "text-success",
    target: { status: "completed", datePreset: "all" },
  },
  {
    key: "cancelled",
    label: "Cancelled Appointments",
    hint: "All time",
    icon: IconBan,
    iconBoxClass: "bg-error-bg",
    iconClass: "text-error",
    valueClass: "text-error",
    target: { status: "cancelled", datePreset: "all" },
  },
];

type SchedulingSummaryCardsProps = {
  summary: AppointmentSummary;
  filters: AppointmentFilters;
  onApplyFilters: (
    status: AppointmentFilters["status"],
    datePreset: AppointmentFilters["datePreset"]
  ) => void;
};

export function SchedulingSummaryCards({
  summary,
  filters,
  onApplyFilters,
}: SchedulingSummaryCardsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        const value = summary[metric.key];

        const isActive =
          filters.status === metric.target.status &&
          filters.datePreset === metric.target.datePreset &&
          filters.treatment === "all" &&
          filters.search.trim() === "";

        return (
          <button
            key={metric.key}
            type="button"
            onClick={() =>
              onApplyFilters(
                metric.target.status,
                metric.target.datePreset
              )
            }
            aria-pressed={isActive}
            className={`group rounded-card border bg-surface p-4 text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isActive
                ? "border-accent/50 ring-1 ring-accent/40"
                : "border-border hover:border-accent/30"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm font-medium text-slate-500">
                {metric.label}
              </p>

              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-control ${metric.iconBoxClass}`}
              >
                <Icon className={`h-[18px] w-[18px] ${metric.iconClass}`} />
              </span>
            </div>

            <p
              className={`mt-2 text-3xl font-bold ${metric.valueClass}`}
            >
              {value}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {metric.hint}
            </p>
          </button>
        );
      })}
    </div>
  );
}

type AppointmentFilterBarProps = {
  filters: AppointmentFilters;
  treatments: string[];
  resultCount: number;
  totalCount: number;
  onChange: (next: AppointmentFilters) => void;
  onReset: () => void;
};

// Search, filters and sorting combined in one panel. Every
// control narrows the same result set, so they compose rather than
// compete for space.
export function AppointmentFilterBar({
  filters,
  treatments,
  resultCount,
  totalCount,
  onChange,
  onReset,
}: AppointmentFilterBarProps) {
  const hasFilters =
    filters.search.trim() !== "" ||
    filters.status !== "all" ||
    filters.datePreset !== "all" ||
    filters.treatment !== "all";

  const isCustomRange =
    filters.datePreset === "custom" ||
    filters.from !== "" ||
    filters.to !== "";

  function update(patch: Partial<AppointmentFilters>) {
    onChange({ ...filters, ...patch });
  }

  return (
    <div className="rounded-card border border-border bg-surface p-4 shadow-card">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative">
          <label
            htmlFor="appointment-search"
            className="sr-only"
          >
            Search appointments by patient, reference, or phone
          </label>

          <input
            id="appointment-search"
            type="search"
            value={filters.search}
            placeholder="Search patient, phone, or APT ref..."
            onChange={(event) =>
              update({ search: event.target.value })
            }
            className="w-full rounded-control border border-border bg-surface py-2 pl-3 pr-3 text-sm text-ink outline-none transition-colors placeholder:text-slate-400 focus:border-accent focus:ring-2 focus:ring-accent/30"
          />
        </div>

        <div>
          <label
            htmlFor="appointment-status-filter"
            className="sr-only"
          >
            Filter by status
          </label>

          <select
            id="appointment-status-filter"
            value={filters.status}
            onChange={(event) =>
              update({
                status: event.target
                  .value as AppointmentFilters["status"],
              })
            }
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
          >
            <option value="all">Status: All</option>

            {(
              [
                "scheduled",
                "confirmed",
                "completed",
                "cancelled",
                "no_show",
              ] as AppointmentStatus[]
            ).map((status) => (
              <option key={status} value={status}>
                {appointmentStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="appointment-date-filter"
            className="sr-only"
          >
            Filter by date
          </label>

          <select
            id="appointment-date-filter"
            value={filters.datePreset}
            onChange={(event) =>
              update({
                datePreset: event.target
                  .value as AppointmentFilters["datePreset"],
              })
            }
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
          >
            <option value="all">Date: All</option>
            <option value="today">Date: Today</option>
            <option value="upcoming">
              Date: Today &amp; future
            </option>
            <option value="week">Date: Next 7 days</option>
            <option value="past">Date: Past</option>
            <option value="custom">Date: Custom range</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="appointment-treatment-filter"
            className="sr-only"
          >
            Filter by treatment
          </label>

          <select
            id="appointment-treatment-filter"
            value={filters.treatment}
            onChange={(event) =>
              update({ treatment: event.target.value })
            }
            className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:border-accent/30"
          >
            <option value="all">Treatment: All</option>

            {treatments.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isCustomRange && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:max-w-md">
          <div>
            <label
              htmlFor="appointment-date-from"
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              From
            </label>

            <input
              id="appointment-date-from"
              type="date"
              value={filters.from}
              onChange={(event) =>
                update({
                  from: event.target.value,
                  datePreset: "custom",
                })
              }
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>

          <div>
            <label
              htmlFor="appointment-date-to"
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              To
            </label>

            <input
              id="appointment-date-to"
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={(event) =>
                update({
                  to: event.target.value,
                  datePreset: "custom",
                })
              }
              className="w-full rounded-control border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
            />
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <p className="text-xs text-slate-500" aria-live="polite">
          {hasFilters || resultCount !== totalCount
            ? `Showing ${resultCount} of ${totalCount} ${
                totalCount === 1
                  ? "appointment"
                  : "appointments"
              }`
            : `${totalCount} ${
                totalCount === 1
                  ? "appointment"
                  : "appointments"
              } on the schedule`}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label
              htmlFor="appointment-sort"
              className="text-xs font-medium text-slate-500"
            >
              Sort
            </label>

            <select
              id="appointment-sort"
              value={filters.sort}
              onChange={(event) =>
                update({
                  sort: event.target
                    .value as AppointmentFilters["sort"],
                })
              }
              className="rounded-control border border-border bg-surface px-3 py-1.5 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/30"
            >
              <option value="date-asc">Date &amp; time ↑</option>
              <option value="date-desc">Date &amp; time ↓</option>
              <option value="patient-asc">Patient A–Z</option>
              <option value="status-asc">Status</option>
            </select>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={onReset}
              className="rounded-control px-3 py-1.5 text-sm font-medium text-accent underline-offset-2 transition-colors hover:bg-accent/5 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default SchedulingSummaryCards;