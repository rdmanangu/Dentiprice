// Local-timezone date string (YYYY-MM-DD) for today.
// Never use toISOString() here, which can shift the
// day due to UTC conversion.
export function todayLocalString(): string {
  return toDateString(new Date());
}

// Serializes a Date to a local YYYY-MM-DD string.
export function toDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Parses a YYYY-MM-DD string into a local Date.
// new Date("YYYY-MM-DD") parses as UTC midnight and can
// land on the previous day in timezones behind UTC, so
// an explicit local time is always appended.
export function parseDateString(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addDaysToString(value: string, days: number): string {
  return toDateString(addDays(parseDateString(value), days));
}

// Sunday-based week start, matching the calendar layout.
export function startOfWeek(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - result.getDay());
  return result;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// Normalizes a Postgres `time` value ("HH:MM:SS") to
// "HH:MM" so values can be compared as plain strings.
export function normalizeTime(value: string): string {
  return value.slice(0, 5);
}

// Full weekday/date label used by the scheduling header.
export function formatTodayLabel(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDisplayDate(
  value: string | null | undefined
): string {
  if (!value) {
    return "—";
  }

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T00:00:00` : value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString();
}