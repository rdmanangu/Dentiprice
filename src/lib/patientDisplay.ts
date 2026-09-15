import type { PatientListItem } from "../types/patient";

export type PatientRowStatus =
  | "pending"
  | "confirmed"
  | "scheduled"
  | "completed"
  | "cancelled";

export function derivePatientStatus(
  patient: Pick<
    PatientListItem,
    "upcoming_appointment" | "latest_inquiry"
  >
): PatientRowStatus | null {
  const upcoming = patient.upcoming_appointment;

  if (upcoming) {
    return upcoming.status === "scheduled" ? "scheduled" : "confirmed";
  }

  const inquiry = patient.latest_inquiry;

  if (inquiry) {
    if (inquiry.status === "pending") {
      return "pending";
    }
    if (inquiry.status === "confirmed") {
      return "confirmed";
    }
    if (inquiry.status === "completed") {
      return "completed";
    }
    if (inquiry.status === "cancelled") {
      return "cancelled";
    }
  }

  return null;
}

export function inquiryRef(id: string): string {
  return `INQ-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function patientRef(id: string): string {
  return `PAT-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function relativeTime(
  value: string | null | undefined
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const diffMs = Date.now() - date.getTime();

  if (diffMs < 60_000) {
    return "just now";
  }

  const minutes = Math.floor(diffMs / 60_000);

  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }

  const weeks = Math.floor(days / 7);

  if (weeks < 5) {
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }

  return date.toLocaleDateString();
}

export function formatLongDate(
  value: string | null | undefined
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatShortDate(
  value: string | null | undefined
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatTime12(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const [h, m] = value.split(":");

  if (!h || !m) {
    return value;
  }

  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${suffix}`;
}

export function formatDateTime(
  value: string | null | undefined
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatPatientSince(
  value: string | null | undefined
): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}