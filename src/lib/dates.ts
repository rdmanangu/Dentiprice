// Local-timezone date string (YYYY-MM-DD) for today.
// Never use toISOString() here, which can shift the
// day due to UTC conversion.
export function todayLocalString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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