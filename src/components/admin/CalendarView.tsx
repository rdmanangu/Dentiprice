import { useEffect, useMemo, useRef, useState } from "react";
import type { AppointmentStatus, AppointmentWithDetails } from "../../types/appointment";
import { Button } from "../ui";
import { AppointmentStatusBadge } from "./appointmentPrimitives";

// ─────────────────────────────────────────────
// DATE HELPERS (local timezone, no UTC tricks)
// ─────────────────────────────────────────────

function todayString(): string {
  const now = new Date();
  return formatDateStr(now);
}

function formatDateStr(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function startOfWeek(d: Date): Date {
  const result = new Date(d);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  return result;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatMonthYear(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatWeekRange(start: Date): string {
  const end = addDays(start, 6);
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { day: "numeric", year: "numeric" })}`;
  }

  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function formatDayFull(d: Date): string {
  return d.toLocaleDateString("en-US", {
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

// ─────────────────────────────────────────────
// STATUS DOT COLORS
// ─────────────────────────────────────────────

const statusDotColor: Record<AppointmentStatus, string> = {
  scheduled: "bg-info",
  confirmed: "bg-success",
  completed: "bg-success",
  cancelled: "bg-slate-400",
  no_show: "bg-error",
};

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type CalendarViewMode = "month" | "week" | "day";

type CalendarViewProps = {
  appointments: AppointmentWithDetails[];
  onSelectAppointment: (id: string) => void;
  onRefreshRange?: (startDate: string, endDate: string) => void;
};

// ─────────────────────────────────────────────
// CALENDAR VIEW
// ─────────────────────────────────────────────

export function CalendarView({
  appointments,
  onSelectAppointment,
  onRefreshRange,
}: CalendarViewProps) {
  const today = useMemo(() => parseDate(todayString()), []);

  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Group appointments by date for fast lookup
  const byDate = useMemo(() => {
    const map = new Map<string, AppointmentWithDetails[]>();
    for (const appt of appointments) {
      const list = map.get(appt.appointment_date) ?? [];
      list.push(appt);
      map.set(appt.appointment_date, list);
    }
    return map;
  }, [appointments]);

  // When navigation changes, optionally refresh data from server
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!onRefreshRange) return;

    if (viewMode === "month") {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const start = formatDateStr(new Date(year, month, 1));
      const end = formatDateStr(new Date(year, month + 1, 0));
      onRefreshRange(start, end);
    } else if (viewMode === "week") {
      const ws = startOfWeek(currentDate);
      const start = formatDateStr(ws);
      const end = formatDateStr(addDays(ws, 6));
      onRefreshRange(start, end);
    } else {
      const d = formatDateStr(selectedDate);
      onRefreshRange(d, d);
    }
  }, [viewMode, currentDate, selectedDate, onRefreshRange]);

  function goToToday() {
    const t = parseDate(todayString());
    setCurrentDate(t);
    setSelectedDate(t);
  }

  function goPrev() {
    if (viewMode === "month") {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate((d) => addDays(d, -7));
    } else {
      setCurrentDate((d) => addDays(d, -1));
    }
  }

  function goNext() {
    if (viewMode === "month") {
      setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    } else if (viewMode === "week") {
      setCurrentDate((d) => addDays(d, 7));
    } else {
      setCurrentDate((d) => addDays(d, 1));
    }
  }

  function handleDayClick(date: Date) {
    setSelectedDate(date);
    if (viewMode === "month") {
      setViewMode("day");
      setCurrentDate(date);
    }
  }

  function handleWeekDayClick(date: Date) {
    setSelectedDate(date);
    setViewMode("day");
    setCurrentDate(date);
  }

  // Heading
  let heading: string;
  if (viewMode === "month") {
    heading = formatMonthYear(currentDate);
  } else if (viewMode === "week") {
    heading = formatWeekRange(startOfWeek(currentDate));
  } else {
    heading = formatDayFull(currentDate);
  }

  return (
    <div className="space-y-4">
      {/* NAVIGATION */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={goPrev} aria-label="Previous">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </Button>

          <h3 className="min-w-[180px] text-center text-lg font-bold text-ink sm:min-w-0">
            {heading}
          </h3>

          <Button variant="ghost" onClick={goNext} aria-label="Next">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </Button>
        </div>

        <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={goToToday}>
              Today
            </Button>

          <div className="flex rounded-control border border-border">
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setViewMode(mode);
                  if (mode === "day") {
                    setSelectedDate(currentDate);
                  }
                }}
                className={`px-3 py-1.5 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                  viewMode === mode
                    ? "bg-primary text-white"
                    : "bg-surface text-slate-600 hover:bg-bg"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* VIEWS */}
      {viewMode === "month" && (
        <MonthView
          currentDate={currentDate}
          selectedDate={selectedDate}
          today={today}
          byDate={byDate}
          onDayClick={handleDayClick}
        />
      )}

      {viewMode === "week" && (
        <WeekView
          currentDate={currentDate}
          today={today}
          byDate={byDate}
          onDayClick={handleWeekDayClick}
          onSelectAppointment={onSelectAppointment}
        />
      )}

      {viewMode === "day" && (
        <DayView
          date={selectedDate}
          appointments={byDate.get(formatDateStr(selectedDate)) ?? []}
          onSelectAppointment={onSelectAppointment}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MONTH VIEW
// ─────────────────────────────────────────────

function MonthView({
  currentDate,
  selectedDate,
  today,
  byDate,
  onDayClick,
}: {
  currentDate: Date;
  selectedDate: Date;
  today: Date;
  byDate: Map<string, AppointmentWithDetails[]>;
  onDayClick: (date: Date) => void;
}) {
  const weeks = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);

    const startDow = firstDay.getDay();
    const startDate = addDays(firstDay, -startDow);

    const result: Date[][] = [];
    let current = startDate;

    for (let w = 0; w < 6; w++) {
      const week: Date[] = [];
      for (let d = 0; d < 7; d++) {
        week.push(current);
        current = addDays(current, 1);
      }
      result.push(week);
    }

    return result;
  }, [currentDate]);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const month = currentDate.getMonth();

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 border-b border-border bg-bg">
        {dayLabels.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Week rows */}
      {weeks.map((week, wi) => (
        <div
          key={wi}
          className={`grid grid-cols-7 ${wi < weeks.length - 1 ? "border-b border-border" : ""}`}
        >
          {week.map((date) => {
            const dateStr = formatDateStr(date);
            const isCurrentMonth = date.getMonth() === month;
            const isToday = sameDay(date, today);
            const isSelected = sameDay(date, selectedDate);
            const dayAppts = byDate.get(dateStr) ?? [];

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onDayClick(date)}
                className={`relative flex min-h-[80px] flex-col p-1.5 text-left transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:min-h-[100px] sm:p-2 ${
                  !isCurrentMonth ? "text-slate-300" : ""
                } ${isSelected ? "bg-accent/5" : ""}`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    isToday
                      ? "bg-primary text-white"
                      : "text-slate-700"
                  }`}
                >
                  {date.getDate()}
                </span>

                {dayAppts.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {dayAppts.slice(0, 3).map((appt) => (
                      <div
                        key={appt.id}
                        className="flex items-center gap-1"
                      >
                        <span
                          className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${statusDotColor[appt.status]}`}
                        />
                        <span className="hidden truncate text-[10px] leading-tight text-slate-600 sm:inline">
                          {appt.patient?.full_name ?? "—"}
                        </span>
                      </div>
                    ))}
                    {dayAppts.length > 3 && (
                      <span className="block text-[10px] text-slate-400">
                        +{dayAppts.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// WEEK VIEW
// ─────────────────────────────────────────────

function WeekView({
  currentDate,
  today,
  byDate,
  onDayClick,
  onSelectAppointment,
}: {
  currentDate: Date;
  today: Date;
  byDate: Map<string, AppointmentWithDetails[]>;
  onDayClick: (date: Date) => void;
  onSelectAppointment: (id: string) => void;
}) {
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-2">
      {days.map((date) => {
        const dateStr = formatDateStr(date);
        const isToday = sameDay(date, today);
        const dayAppts = byDate.get(dateStr) ?? [];
        const dayLabel = date.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });

        return (
          <div
            key={dateStr}
            className={`rounded-card border bg-surface shadow-card ${
              isToday ? "border-accent" : "border-border"
            }`}
          >
            <button
              type="button"
              onClick={() => onDayClick(date)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                isToday ? "bg-accent/5" : ""
              }`}
            >
              <span className="text-sm font-semibold text-ink">
                {dayLabel}
                {isToday && (
                  <span className="ml-2 text-xs font-medium text-accent">
                    (Today)
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-500">
                {dayAppts.length === 0
                  ? "No appointments"
                  : `${dayAppts.length} appointment${dayAppts.length === 1 ? "" : "s"}`}
              </span>
            </button>

            {dayAppts.length > 0 && (
              <div className="divide-y divide-border border-t border-border">
                {dayAppts.map((appt) => (
                  <button
                    key={appt.id}
                    type="button"
                    onClick={() => onSelectAppointment(appt.id)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        {formatTime(appt.appointment_start_time)} –{" "}
                        {formatTime(appt.appointment_end_time)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {appt.patient?.full_name ?? "Unknown patient"}
                      </p>
                      {(appt.appointment_items ?? []).length > 0 && (
                        <p className="mt-0.5 text-xs text-slate-400">
                          {appt.appointment_items[0].item_name}
                          {(appt.appointment_items?.length ?? 0) > 1 &&
                            ` +${(appt.appointment_items?.length ?? 0) - 1} more`}
                        </p>
                      )}
                    </div>
                    <AppointmentStatusBadge status={appt.status} />
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// DAY VIEW
// ─────────────────────────────────────────────

function DayView({
  date,
  appointments,
  onSelectAppointment,
}: {
  date: Date;
  appointments: AppointmentWithDetails[];
  onSelectAppointment: (id: string) => void;
}) {
  if (appointments.length === 0) {
    const label = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    return (
      <div className="rounded-card border border-border bg-surface p-8 text-center">
        <p className="font-semibold text-ink">
          No appointments
        </p>
        <p className="mt-1 text-sm text-slate-500">
          No appointments scheduled for {label}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {appointments.map((appt) => (
        <button
          key={appt.id}
          type="button"
          onClick={() => onSelectAppointment(appt.id)}
          className="flex w-full items-center justify-between gap-4 rounded-card border border-border bg-surface p-4 text-left transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <div className="min-w-0">
            <p className="font-medium text-ink">
              {appt.patient?.full_name ?? "Unknown patient"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {formatTime(appt.appointment_start_time)} –{" "}
              {formatTime(appt.appointment_end_time)}
            </p>
            {(appt.appointment_items ?? []).length > 0 && (
              <p className="mt-1 text-xs text-slate-400">
                {appt.appointment_items[0].item_name}
                {(appt.appointment_items?.length ?? 0) > 1 &&
                  ` +${(appt.appointment_items?.length ?? 0) - 1} more`}
              </p>
            )}
            {appt.notes && (
              <p className="mt-1 text-xs text-slate-400 italic">
                {appt.notes.length > 60
                  ? appt.notes.slice(0, 60) + "…"
                  : appt.notes}
              </p>
            )}
          </div>
          <AppointmentStatusBadge status={appt.status} />
        </button>
      ))}
    </div>
  );
}
