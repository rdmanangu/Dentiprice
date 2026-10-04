import type {
  AppointmentStatus,
  AppointmentWithDetails,
} from "../types/appointment";
import { addDaysToString, normalizeTime } from "./dates";

// ─────────────────────────────────────────────
// APPOINTMENT STATUS LABELS
// Single source of truth for display text. The
// application uses the five statuses supported by the
// appointments_status_check constraint, so no status is
// invented here.
// ─────────────────────────────────────────────

export const APPOINTMENT_STATUS_LABELS: Record<
  AppointmentStatus,
  string
> = {
  scheduled: "Scheduled",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No show",
};

export function appointmentStatusLabel(
  status: AppointmentStatus
): string {
  return APPOINTMENT_STATUS_LABELS[status];
}

// Statuses that still occupy a slot on the clinic calendar.
// Cancelled, completed and no-show appointments are history and
// must never block a new booking.
export const ACTIVE_APPOINTMENT_STATUSES: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
];

export function isActiveAppointment(status: AppointmentStatus): boolean {
  return (
    status === "scheduled" || status === "confirmed"
  );
}

// Status dot colors shared by the calendar and list views so a
// status always reads the same way across the scheduling page.
export const appointmentStatusDotClass: Record<
  AppointmentStatus,
  string
> = {
  scheduled: "bg-info",
  confirmed: "bg-success",
  completed: "bg-success",
  cancelled: "bg-slate-400",
  no_show: "bg-error",
};

// ─────────────────────────────────────────────
// DISPLAY HELPERS
// ─────────────────────────────────────────────

// Short, human-friendly reference for support conversations.
export function appointmentRef(id: string): string {
  return `APT-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

// Duration is derived from the stored start/end times because the
// appointments table has no duration column.
export function appointmentDurationMinutes(
  appointment: Pick<
    AppointmentWithDetails,
    "appointment_start_time" | "appointment_end_time"
  >
): number {
  const start = normalizeTime(appointment.appointment_start_time);
  const end = normalizeTime(appointment.appointment_end_time);

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return 0;
  }

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  return endMinutes > startMinutes ? endMinutes - startMinutes : 0;
}

export function durationLabel(minutes: number): string {
  if (minutes <= 0) {
    return "—";
  }

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return rest === 0
    ? `${hours} hr${hours === 1 ? "" : "s"}`
    : `${hours} hr ${rest} min`;
}

// The primary treatment is the procedure item; the summary label
// falls back to the first item so add-on-only appointments are
// still identifiable.
export function appointmentTreatmentNames(
  appointment: AppointmentWithDetails
): string[] {
  return (appointment.appointment_items ?? []).map(
    (item) => item.item_name
  );
}

export function appointmentTreatmentLabel(
  appointment: AppointmentWithDetails
): string {
  const items = appointment.appointment_items ?? [];
  const primary =
    items.find((item) => item.procedure_id)?.item_name ??
    items[0]?.item_name;

  return primary ?? "General appointment";
}

// Every distinct treatment name present in the loaded
// appointments. Populated from live data only.
export function collectTreatmentNames(
  appointments: AppointmentWithDetails[]
): string[] {
  const names = new Set<string>();

  for (const appointment of appointments) {
    for (const item of appointment.appointment_items ?? []) {
      if (item.item_name) {
        names.add(item.item_name);
      }
    }
  }

  return Array.from(names).sort((a, b) =>
    a.localeCompare(b)
  );
}

// ─────────────────────────────────────────────
// SUMMARY COUNTS
// Derived entirely from the supplied appointment
// rows so the cards always match what is on screen.
// ─────────────────────────────────────────────

export type AppointmentSummary = {
  today: number;
  upcoming: number;
  completed: number;
  pending: number;
  cancelled: number;
};

// The summary counts stay aligned with what a card click can actually
// show in the filtered list, so "cancelled" means cancelled only.
export function summarizeAppointments(
  appointments: AppointmentWithDetails[],
  today: string
): AppointmentSummary {
  let todayCount = 0;
  let upcoming = 0;
  let completed = 0;
  let pending = 0;
  let cancelled = 0;

  for (const appointment of appointments) {
    if (appointment.appointment_date === today) {
      todayCount += 1;
    }

    if (appointment.status === "completed") {
      completed += 1;
    } else if (appointment.status === "cancelled") {
      cancelled += 1;
    } else if (appointment.status === "scheduled") {
      pending += 1;
    }

    if (
      appointment.appointment_date >= today &&
      isActiveAppointment(appointment.status)
    ) {
      upcoming += 1;
    }
  }

  return {
    today: todayCount,
    upcoming,
    completed,
    pending,
    cancelled,
  };
}

// ─────────────────────────────────────────────
// FILTER / SORT MODEL
// ─────────────────────────────────────────────

export type AppointmentStatusFilter = "all" | AppointmentStatus;

export type AppointmentDatePreset =
  | "all"
  | "today"
  | "upcoming"
  | "week"
  | "past"
  | "custom";

export type AppointmentSort =
  | "date-asc"
  | "date-desc"
  | "patient-asc"
  | "status-asc";

export type AppointmentFilters = {
  search: string;
  status: AppointmentStatusFilter;
  datePreset: AppointmentDatePreset;
  from: string;
  to: string;
  treatment: string;
  sort: AppointmentSort;
};

export const DEFAULT_APPOINTMENT_FILTERS: AppointmentFilters = {
  search: "",
  status: "all",
  datePreset: "all",
  from: "",
  to: "",
  treatment: "all",
  sort: "date-asc",
};

export const APPOINTMENT_DATE_PRESET_LABELS: Record<
  AppointmentDatePreset,
  string
> = {
  all: "All dates",
  today: "Today",
  upcoming: "Today & future",
  week: "Next 7 days",
  past: "Past",
  custom: "Custom range",
};

export const APPOINTMENT_SORT_LABELS: Record<
  AppointmentSort,
  string
> = {
  "date-asc": "Date & time (earliest first)",
  "date-desc": "Date & time (latest first)",
  "patient-asc": "Patient name (A–Z)",
  "status-asc": "Status",
};

export function hasActiveAppointmentFilters(
  filters: AppointmentFilters
): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.status !== "all" ||
    filters.datePreset !== "all" ||
    filters.from !== "" ||
    filters.to !== "" ||
    filters.treatment !== "all" ||
    filters.sort !== DEFAULT_APPOINTMENT_FILTERS.sort
  );
}

function matchesSearch(
  appointment: AppointmentWithDetails,
  term: string
): boolean {
  if (!term) {
    return true;
  }

  const patientName =
    appointment.patient?.full_name?.toLowerCase() ?? "";
  const phone = appointment.patient?.phone ?? "";
  const ref = appointmentRef(appointment.id).toLowerCase();
  const id = appointment.id.toLowerCase();

  return (
    patientName.includes(term) ||
    (phone !== "" && phone.includes(term)) ||
    ref.includes(term) ||
    id.startsWith(term)
  );
}

function matchesDateFilter(
  appointment: AppointmentWithDetails,
  filters: AppointmentFilters,
  today: string
): boolean {
  const date = appointment.appointment_date;

  if (filters.from && date < filters.from) {
    return false;
  }

  if (filters.to && date > filters.to) {
    return false;
  }

  switch (filters.datePreset) {
    case "today":
      return date === today;
    case "upcoming":
      return date >= today;
    case "week":
      return date >= today && date <= addDaysToString(today, 6);
    case "past":
      return date < today;
    case "custom":
      // The explicit from/to bounds above are the whole rule here.
      return true;
    case "all":
    default:
      return true;
  }
}

function compareByDate(
  a: AppointmentWithDetails,
  b: AppointmentWithDetails
): number {
  if (a.appointment_date !== b.appointment_date) {
    return a.appointment_date < b.appointment_date ? -1 : 1;
  }

  return (
    normalizeTime(a.appointment_start_time).localeCompare(
      normalizeTime(b.appointment_start_time)
    ) ||
    a.id.localeCompare(b.id)
  );
}

function sortAppointments(
  appointments: AppointmentWithDetails[],
  sort: AppointmentSort
): AppointmentWithDetails[] {
  const list = [...appointments];

  switch (sort) {
    case "date-desc":
      return list.sort((a, b) => compareByDate(b, a));
    case "patient-asc":
      return list.sort(
        (a, b) =>
          (a.patient?.full_name ?? "").localeCompare(
            b.patient?.full_name ?? ""
          ) || compareByDate(a, b)
      );
    case "status-asc":
      return list.sort(
        (a, b) =>
          a.status.localeCompare(b.status) || compareByDate(a, b)
      );
    case "date-asc":
    default:
      return list.sort(compareByDate);
  }
}

// Applies every active filter together, then sorts. Filters are
// intentionally combined rather than mutually exclusive so a
// search term narrows the result set of the other controls.
export function filterAppointments(
  appointments: AppointmentWithDetails[],
  filters: AppointmentFilters,
  today: string
): AppointmentWithDetails[] {
  const term = filters.search.trim().toLowerCase();
  const treatment = filters.treatment;

  const matched = appointments.filter((appointment) => {
    if (
      filters.status !== "all" &&
      appointment.status !== filters.status
    ) {
      return false;
    }

    if (
      treatment !== "all" &&
      !appointmentTreatmentNames(appointment).includes(
        treatment
      )
    ) {
      return false;
    }

    if (!matchesDateFilter(appointment, filters, today)) {
      return false;
    }

    return matchesSearch(appointment, term);
  });

  return sortAppointments(matched, filters.sort);
}

// ─────────────────────────────────────────────
// CONFLICT DETECTION
// The appointments table has no database constraint that
// rejects overlapping bookings, so the UI checks the loaded
// rows before submitting. The database remains the authority
// for its own rules (end > start, one appointment per
// inquiry) and any rejection from it is surfaced verbatim
// as a friendly message.
// ─────────────────────────────────────────────

export type AppointmentSlot = {
  date: string;
  start: string;
  end: string;
};

export function findConflictingAppointments(
  appointments: AppointmentWithDetails[],
  slot: AppointmentSlot,
  excludeId?: string
): AppointmentWithDetails[] {
  const start = normalizeTime(slot.start);
  const end = normalizeTime(slot.end);

  if (!slot.date || !start || !end || end <= start) {
    return [];
  }

  return appointments.filter((appointment) => {
    if (appointment.id === excludeId) {
      return false;
    }

    if (appointment.appointment_date !== slot.date) {
      return false;
    }

    if (!isActiveAppointment(appointment.status)) {
      return false;
    }

    const existingStart = normalizeTime(
      appointment.appointment_start_time
    );
    const existingEnd = normalizeTime(
      appointment.appointment_end_time
    );

    // Half-open interval overlap: touching slots are allowed.
    return existingStart < end && start < existingEnd;
  });
}

export function conflictMessage(
  conflicts: AppointmentWithDetails[]
): string {
  if (conflicts.length === 0) {
    return "";
  }

  const first = conflicts[0];
  const patient =
    first.patient?.full_name ?? "another patient";
  const time = `${formatClockTime(
    first.appointment_start_time
  )} – ${formatClockTime(first.appointment_end_time)}`;

  if (conflicts.length === 1) {
    return `This time overlaps an existing appointment for ${patient} (${time}). Choose a different time.`;
  }

  return `This time overlaps ${conflicts.length} existing appointments, starting with ${patient} (${time}). Choose a different time.`;
}

export function formatClockTime(value: string): string {
  const normalized = normalizeTime(value);
  const [rawHour, minute] = normalized.split(":");
  const hour = Number(rawHour);

  if (Number.isNaN(hour) || !minute) {
    return value;
  }

  const suffix = hour >= 12 ? "PM" : "AM";
  const display =
    hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${display}:${minute} ${suffix}`;
}

// ─────────────────────────────────────────────
// SLOT BUILDING
// Shared by the schedule and reschedule forms so both
// produce identical start/end values.
// ─────────────────────────────────────────────

export const APPOINTMENT_DURATION_OPTIONS = [
  30, 45, 60, 90, 120,
] as const;

export function addMinutesToTime(
  value: string,
  minutes: number
): string {
  const normalized = normalizeTime(value);
  const [rawHour, rawMinute] = normalized.split(":").map(Number);

  if (Number.isNaN(rawHour) || Number.isNaN(rawMinute)) {
    return "";
  }

  const total = rawHour * 60 + rawMinute + minutes;
  const hour = Math.floor(total / 60) % 24;
  const minute = total % 60;

  // Bookings cannot cross midnight: the database stores
  // start/end on the same calendar day.
  if (total >= 24 * 60) {
    return "";
  }

  return `${String(hour).padStart(2, "0")}:${String(
    minute
  ).padStart(2, "0")}`;
}