import { useEffect, useMemo, useRef, useState } from "react";
import type {
  AppointmentStatus,
  AppointmentWithDetails,
} from "../../types/appointment";
import { Button } from "../ui";
import { AppointmentStatusBadge } from "./appointmentPrimitives";
import {
  IconCalendarDay,
  IconChevronLeft,
  IconPlus,
} from "./icons";
import {
  addDays,
  isSameDay,
  parseDateString,
  startOfWeek,
  toDateString,
  todayLocalString,
} from "../../lib/dates";
import {
  APPOINTMENT_STATUS_LABELS,
  appointmentStatusDotClass,
  appointmentTreatmentLabel,
  formatClockTime,
} from "../../lib/appointmentFilters";

// ─────────────────────────────────────────────
// CALENDAR RANGE HELPERS
// Month/week/day navigation requests the exact date
// range it renders so the page can refresh only the
// rows that are about to become visible.
// ─────────────────────────────────────────────

type CalendarMode = "month" | "week" | "day";

function monthRange(date: Date): { start: string; end: string } {
  return {
    start: toDateString(
      new Date(date.getFullYear(), date.getMonth(), 1)
    ),
    end: toDateString(
      new Date(date.getFullYear(), date.getMonth() + 1, 0)
    ),
  };
}

function weekRange(date: Date): { start: string; end: string } {
  const start = startOfWeek(date);

  return {
    start: toDateString(start),
    end: toDateString(addDays(start, 6)),
  };
}

function dayRange(date: Date): { start: string; end: string } {
  const day = toDateString(date);

  return { start: day, end: day };
}

const dayLabels = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", {
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
    return `${start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })} – ${end.toLocaleDateString("en-US", {
      day: "numeric",
      year: "numeric",
    })}`;
  }

  return `${start.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${end.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

function formatDayFull(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const statusLegend: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

type CalendarViewProps = {
  appointments: AppointmentWithDetails[];
  onSelectAppointment: (id: string) => void;
  onRefreshRange?: (startDate: string, endDate: string) => void;
  /** Opens the schedule form with the clicked date pre-filled. */
  onScheduleForDate?: (date: string) => void;
  /**
   * When this changes, the calendar jumps to that date and selects it,
   * so "view this day" actions land on the right month.
   */
  focusDate?: string;
};

export function CalendarView({
  appointments,
  onSelectAppointment,
  onRefreshRange,
  onScheduleForDate,
  focusDate,
}: CalendarViewProps) {
  const today = useMemo(() => parseDateString(todayLocalString()), []);

  const [mode, setMode] = useState<CalendarMode>("month");
  const [currentDate, setCurrentDate] = useState<Date>(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  // Adjust the cursor during render rather than in an effect so the
  // focused date is applied on the same paint.
  const [appliedFocusDate, setAppliedFocusDate] =
    useState<string | undefined>(undefined);

  if (focusDate && focusDate !== appliedFocusDate) {
    const parsed = parseDateString(focusDate);

    setAppliedFocusDate(focusDate);
    setCurrentDate(parsed);
    setSelectedDate(parsed);
  }

  const byDate = useMemo(() => {
    const map = new Map<string, AppointmentWithDetails[]>();

    for (const appointment of appointments) {
      const list = map.get(appointment.appointment_date) ?? [];
      list.push(appointment);
      map.set(
        appointment.appointment_date,
        [...list].sort((a, b) =>
          a.appointment_start_time.localeCompare(
            b.appointment_start_time
          )
        )
      );
    }

    return map;
  }, [appointments]);

  // Ask the page to load the range this view renders. Skipped on the
  // first render because the initial page load already fetched it.
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!onRefreshRange) {
      return;
    }

    const range =
      mode === "month"
        ? monthRange(currentDate)
        : mode === "week"
          ? weekRange(currentDate)
          : dayRange(selectedDate);

    onRefreshRange(range.start, range.end);
  }, [mode, currentDate, selectedDate, onRefreshRange]);

  function goToToday() {
    setCurrentDate(today);
    setSelectedDate(today);
  }

  function goPrev() {
    if (mode === "month") {
      setCurrentDate(
        (date) =>
          new Date(
            date.getFullYear(),
            date.getMonth() - 1,
            1
          )
      );
      return;
    }

    const step = mode === "week" ? -7 : -1;
    setCurrentDate((date) => addDays(date, step));
    setSelectedDate((date) => addDays(date, step));
  }

  function goNext() {
    if (mode === "month") {
      setCurrentDate(
        (date) =>
          new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            1
          )
      );
      return;
    }

    const step = mode === "week" ? 7 : 1;
    setCurrentDate((date) => addDays(date, step));
    setSelectedDate((date) => addDays(date, step));
  }

  // Drilling into a day keeps the selected date, so the day view and
  // the highlighted calendar cell always agree.
  function handleDayClick(date: Date) {
    setSelectedDate(date);
    setCurrentDate(date);
    setMode("day");
  }

  const heading =
    mode === "month"
      ? formatMonthYear(currentDate)
      : mode === "week"
        ? formatWeekRange(startOfWeek(currentDate))
        : formatDayFull(selectedDate);

  const visibleRangeLabel =
    mode === "month"
      ? "Month view"
      : mode === "week"
        ? "Week view"
        : "Day view";

  return (
    <div className="space-y-4">
      {/* NAVIGATION */}
      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-2 sm:justify-start">
          <Button
            variant="secondary"
            onClick={goPrev}
            aria-label={
              mode === "month"
                ? "Previous month"
                : mode === "week"
                  ? "Previous week"
                  : "Previous day"
            }
            className="px-3"
          >
            <IconChevronLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1 px-1 text-center sm:flex-none sm:text-left">
            <p className="truncate text-base font-bold text-ink sm:text-lg">
              {heading}
            </p>
            <p className="text-xs text-slate-400">
              {visibleRangeLabel}
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={goNext}
            aria-label={
              mode === "month"
                ? "Next month"
                : mode === "week"
                  ? "Next week"
                  : "Next day"
            }
            className="px-3"
          >
            <IconChevronLeft className="h-4 w-4 -scale-x-100" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={goToToday}>
            Today
          </Button>

          {onScheduleForDate && (
            <Button
              onClick={() =>
                onScheduleForDate(
                  toDateString(
                    mode === "day" ? selectedDate : today
                  )
                )
              }
            >
              <IconPlus className="h-4 w-4" />
              New appointment
            </Button>
          )}

          <div
            className="flex rounded-control border border-border"
            role="group"
            aria-label="Calendar view"
          >
            {(
              ["month", "week", "day"] as CalendarMode[]
            ).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                aria-pressed={mode === option}
                className={`px-3 py-2 text-sm font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                  mode === option
                    ? "bg-primary text-white"
                    : "bg-surface text-slate-600 hover:bg-bg"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STATUS LEGEND */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {statusLegend.map((status) => (
          <span
            key={status}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500"
          >
            <span
              className={`h-2 w-2 rounded-pill ${appointmentStatusDotClass[status]}`}
              aria-hidden="true"
            />
            {APPOINTMENT_STATUS_LABELS[status]}
          </span>
        ))}
      </div>

      {/* VIEWS */}
      {mode === "month" && (
        <MonthView
          currentDate={currentDate}
          selectedDate={selectedDate}
          today={today}
          byDate={byDate}
          onDayClick={handleDayClick}
        />
      )}

      {mode === "week" && (
        <WeekView
          weekStart={startOfWeek(currentDate)}
          today={today}
          byDate={byDate}
          onDayClick={handleDayClick}
          onSelectAppointment={onSelectAppointment}
        />
      )}

      {mode === "day" && (
        <DayView
          date={selectedDate}
          appointments={
            byDate.get(toDateString(selectedDate)) ?? []
          }
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
    const firstDay = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    const gridStart = addDays(
      firstDay,
      -firstDay.getDay()
    );

    const rows: Date[][] = [];
    let cursor = gridStart;

    // Six rows keep the month height stable while navigating, which
    // avoids the layout jumping between months.
    for (let week = 0; week < 6; week += 1) {
      const row: Date[] = [];

      for (let day = 0; day < 7; day += 1) {
        row.push(cursor);
        cursor = addDays(cursor, 1);
      }

      rows.push(row);
    }

    return rows;
  }, [currentDate]);

  const month = currentDate.getMonth();

  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-card">
      <div className="grid grid-cols-7 border-b border-border bg-bg">
        {dayLabels.map((label) => (
          <div
            key={label}
            className="px-1 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500"
          >
            {label}
          </div>
        ))}
      </div>

      {weeks.map((week, weekIndex) => (
        <div
          key={weekIndex}
          className={`grid grid-cols-7 ${
            weekIndex < weeks.length - 1
              ? "border-b border-border"
              : ""
          }`}
        >
          {week.map((date) => {
            const dateStr = toDateString(date);
            const isCurrentMonth = date.getMonth() === month;
            const isToday = isSameDay(date, today);
            const isSelected = isSameDay(date, selectedDate);
            const dayAppointments = byDate.get(dateStr) ?? [];

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onDayClick(date)}
                aria-label={`${formatDayFull(date)}, ${
                  dayAppointments.length
                } appointment${dayAppointments.length === 1 ? "" : "s"}`}
                className={`flex min-h-16 flex-col items-start gap-1 p-1 text-left transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:min-h-24 sm:p-2 ${
                  !isCurrentMonth
                    ? "bg-bg/40 text-slate-300"
                    : ""
                } ${isSelected ? "bg-accent/5" : ""}`}
              >
                <span
                  className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-pill text-xs font-semibold ${
                    isToday
                      ? "bg-primary text-white"
                      : isCurrentMonth
                        ? "text-slate-700"
                        : "text-slate-300"
                  }`}
                >
                  {date.getDate()}
                </span>

                {dayAppointments.length > 0 && (
                  <div className="w-full space-y-0.5">
                    {/* Dots on narrow screens, full detail from sm up. */}
                    <div className="flex flex-wrap gap-0.5 sm:hidden">
                      {dayAppointments
                        .slice(0, 4)
                        .map((appointment) => (
                          <span
                            key={appointment.id}
                            className={`h-1.5 w-1.5 rounded-pill ${appointmentStatusDotClass[appointment.status]}`}
                          />
                        ))}
                    </div>

                    <div className="hidden space-y-0.5 sm:block">
                      {dayAppointments.slice(0, 2).map((appointment) => (
                        <span
                          key={appointment.id}
                          className="flex items-center gap-1 text-[10px] leading-tight text-slate-600"
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-pill ${appointmentStatusDotClass[appointment.status]}`}
                          />
                          <span className="truncate">
                            {formatClockTime(
                              appointment.appointment_start_time
                            )}{" "}
                            {
                              appointment.patient
                                ?.full_name ?? "—"
                            }
                          </span>
                        </span>
                      ))}

                      {dayAppointments.length > 2 && (
                        <span className="block pl-2.5 text-[10px] text-slate-400">
                          +{dayAppointments.length - 2} more
                        </span>
                      )}
                    </div>

                    <span className="hidden text-[10px] text-slate-400 sm:inline">
                      {dayAppointments.length}{" "}
                      {dayAppointments.length === 1
                        ? "appointment"
                        : "appointments"}
                    </span>
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
  weekStart,
  today,
  byDate,
  onDayClick,
  onSelectAppointment,
}: {
  weekStart: Date;
  today: Date;
  byDate: Map<string, AppointmentWithDetails[]>;
  onDayClick: (date: Date) => void;
  onSelectAppointment: (id: string) => void;
}) {
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(weekStart, index)
  );

  return (
    <div className="space-y-2">
      {days.map((date) => {
        const dateStr = toDateString(date);
        const isToday = isSameDay(date, today);
        const dayAppointments = byDate.get(dateStr) ?? [];

        return (
          <section
            key={dateStr}
            className={`overflow-hidden rounded-card border bg-surface shadow-card ${
              isToday ? "border-accent" : "border-border"
            }`}
          >
            <button
              type="button"
              onClick={() => onDayClick(date)}
              className={`flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                isToday ? "bg-accent/5" : ""
              }`}
            >
              <span className="text-sm font-semibold text-ink">
                {date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}

                {isToday && (
                  <span className="ml-2 rounded-pill bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    Today
                  </span>
                )}
              </span>

              <span className="text-xs text-slate-500">
                {dayAppointments.length === 0
                  ? "No appointments"
                  : `${dayAppointments.length} appointment${
                      dayAppointments.length === 1 ? "" : "s"
                    }`}
              </span>
            </button>

            {dayAppointments.length > 0 && (
              <div className="divide-y divide-border border-t border-border">
                {dayAppointments.map((appointment) => (
                  <button
                    key={appointment.id}
                    type="button"
                    onClick={() =>
                      onSelectAppointment(appointment.id)
                    }
                    className="flex w-full flex-col gap-2 px-4 py-3 text-left transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        {formatClockTime(
                          appointment.appointment_start_time
                        )}{" "}
                        –{" "}
                        {formatClockTime(
                          appointment.appointment_end_time
                        )}
                      </p>

                      <p className="mt-0.5 truncate text-xs text-slate-600">
                        {appointment.patient?.full_name ??
                          "Unknown patient"}
                      </p>

                      <p className="truncate text-xs text-slate-400">
                        {appointmentTreatmentLabel(
                          appointment
                        )}
                      </p>
                    </div>

                    <AppointmentStatusBadge
                      status={appointment.status}
                      className="shrink-0 self-start sm:self-auto"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>
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
    return (
      <div className="rounded-card border border-border bg-surface p-8 text-center shadow-card">
        <IconCalendarDay className="mx-auto h-8 w-8 text-slate-300" />

        <p className="mt-3 font-semibold text-ink">
          No appointments
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Nothing is scheduled for{" "}
          {date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {appointments.map((appointment) => (
        <button
          key={appointment.id}
          type="button"
          onClick={() =>
            onSelectAppointment(appointment.id)
          }
          className="flex w-full flex-col gap-3 rounded-card border border-border bg-surface p-4 text-left shadow-card transition-colors hover:border-accent/40 hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 shrink-0 rounded-pill ${appointmentStatusDotClass[appointment.status]}`}
                aria-hidden="true"
              />

              <p className="font-semibold text-ink">
                {formatClockTime(
                  appointment.appointment_start_time
                )}{" "}
                –{" "}
                {formatClockTime(
                  appointment.appointment_end_time
                )}
              </p>
            </div>

            <p className="mt-1 truncate text-sm text-slate-700">
              {appointment.patient?.full_name ??
                "Unknown patient"}
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              {appointmentTreatmentLabel(appointment)}
            </p>

            {appointment.notes && (
              <p className="mt-1 line-clamp-2 text-xs italic text-slate-400">
                {appointment.notes}
              </p>
            )}
          </div>

          <AppointmentStatusBadge
            status={appointment.status}
            className="shrink-0 self-start"
          />
        </button>
      ))}
    </div>
  );
}

export default CalendarView;