import { Badge } from "../ui";
import type { AppointmentStatus } from "../../types/appointment";
import { appointmentStatusLabel } from "../../lib/appointmentFilters";

const statusTones: Record<
  AppointmentStatus,
  "warning" | "info" | "success" | "neutral" | "error"
> = {
  scheduled: "info",
  confirmed: "success",
  completed: "success",
  cancelled: "neutral",
  no_show: "error",
};

export function AppointmentStatusBadge({
  status,
  className = "",
}: {
  status: AppointmentStatus;
  className?: string;
}) {
  return (
    <Badge tone={statusTones[status]} className={className}>
      {appointmentStatusLabel(status)}
    </Badge>
  );
}