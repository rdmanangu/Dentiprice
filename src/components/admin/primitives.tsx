import { Badge, ErrorState } from "../ui";
import type { InquiryStatus } from "../../types/inquiry";

// ─────────────────────────────────────────────
// SHARED ADMIN UI PRIMITIVES
// Small building blocks reused by admin
// components to avoid duplicated UI logic.
// These reuse the shared design-system UI.
// ─────────────────────────────────────────────

const statusTones: Record<
  InquiryStatus,
  "warning" | "info" | "success" | "neutral"
> = {
  pending: "warning",
  confirmed: "info",
  completed: "success",
  cancelled: "neutral",
};

export function InquiryStatusBadge({
  status,
}: {
  status: InquiryStatus;
}) {
  const label =
    status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge tone={statusTones[status]}>{label}</Badge>
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
  return <ErrorState className={className}>{children}</ErrorState>;
}
