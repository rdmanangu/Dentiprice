import { Badge } from "../ui";
import type { PatientRowStatus } from "../../lib/patientDisplay";

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "—";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function PatientAvatar({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-primary text-sm font-bold text-white ${className}`}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}

const statusTones: Partial<
  Record<PatientRowStatus, "warning" | "info" | "success" | "neutral">
> = {
  pending: "warning",
  confirmed: "info",
  completed: "success",
  cancelled: "neutral",
};

export function PatientStatusBadge({
  status,
}: {
  status: PatientRowStatus;
}) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  if (status === "scheduled") {
    return (
      <Badge className="border border-primary/20 bg-primary/10 text-primary">
        {label}
      </Badge>
    );
  }

  return <Badge tone={statusTones[status]}>{label}</Badge>;
}