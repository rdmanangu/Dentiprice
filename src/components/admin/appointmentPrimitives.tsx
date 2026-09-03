import { Badge } from "../ui";
import type { AppointmentStatus } from "../../types/appointment";

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
}: {
  status: AppointmentStatus;
}) {
  const label =
    status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <Badge tone={statusTones[status]}>{label}</Badge>
  );
}
