import type { InquiryStatus } from "../../types/inquiry";

// ─────────────────────────────────────────────
// SHARED ADMIN UI PRIMITIVES
// Small building blocks reused by admin
// components to avoid duplicated UI logic.
// ─────────────────────────────────────────────

const statusBadgeClasses: Record<InquiryStatus, string> = {
  pending: "border border-amber-200 bg-amber-50 text-amber-800",
  confirmed: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border border-slate-200 bg-slate-100 text-slate-600",
  completed: "border border-sky-200 bg-sky-50 text-sky-700",
};

export function InquiryStatusBadge({
  status,
}: {
  status: InquiryStatus;
}) {
  const label =
    status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClasses[status]}`}
    >
      {label}
    </span>
  );
}

type ErrorAlertProps = {
  children: React.ReactNode;
  className?: string;
};

export function ErrorAlert({
  children,
  className = "",
}: ErrorAlertProps) {
  return (
    <p
      role="alert"
      className={`rounded-xl bg-red-50 p-4 text-sm text-red-700 ${className}`}
    >
      {children}
    </p>
  );
}

type LoadingLineProps = {
  children: React.ReactNode;
  className?: string;
};

export function LoadingLine({
  children,
  className = "",
}: LoadingLineProps) {
  return (
    <p className={`text-slate-500 ${className}`}>
      {children}
    </p>
  );
}
