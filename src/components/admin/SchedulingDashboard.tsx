import type { AppointmentWithDetails } from "../../types/appointment";
import { Card } from "../ui";
import { Button } from "../ui";
import { AppointmentStatusBadge } from "./appointmentPrimitives";

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${suffix}`;
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type SchedulingDashboardProps = {
  appointments: AppointmentWithDetails[];
  onSelectAppointment: (id: string) => void;
};

export function SchedulingDashboard({
  appointments,
  onSelectAppointment,
}: SchedulingDashboardProps) {
  const today = todayDateString();

  const todayAppts = appointments.filter(
    (a) => a.appointment_date === today
  );

  const upcomingAppts = appointments.filter(
    (a) => a.appointment_date > today
  );

  const todayScheduled = todayAppts.filter(
    (a) => a.status === "scheduled" || a.status === "confirmed"
  ).length;

  const todayCompleted = todayAppts.filter(
    (a) => a.status === "completed"
  ).length;

  const todayCancelled = todayAppts.filter(
    (a) => a.status === "cancelled" || a.status === "no_show"
  ).length;

  const nextUpcoming = upcomingAppts.slice(0, 7);

  return (
    <div className="space-y-6">
      {/* STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">
            Today&apos;s Appointments
          </p>
          <p className="mt-2 text-3xl font-bold text-ink">
            {todayAppts.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">
            Scheduled / Confirmed
          </p>
          <p className="mt-2 text-3xl font-bold text-info">
            {todayScheduled}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">
            Completed Today
          </p>
          <p className="mt-2 text-3xl font-bold text-success">
            {todayCompleted}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-slate-500">
            Cancelled / No Show
          </p>
          <p className="mt-2 text-3xl font-bold text-error">
            {todayCancelled}
          </p>
        </Card>
      </div>

      {/* TODAY'S APPOINTMENTS */}
      <section>
        <h3 className="text-lg font-bold text-ink">
          Today&apos;s schedule
        </h3>

        {todayAppts.length === 0 ? (
          <p className="mt-3 rounded-card border border-border bg-surface p-6 text-sm text-slate-500">
            No appointments scheduled for today.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {todayAppts.map((appt) => (
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
                </div>
                <AppointmentStatusBadge status={appt.status} />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* UPCOMING APPOINTMENTS */}
      <section>
        <h3 className="text-lg font-bold text-ink">
          Upcoming appointments
        </h3>

        {nextUpcoming.length === 0 ? (
          <p className="mt-3 rounded-card border border-border bg-surface p-6 text-sm text-slate-500">
            No upcoming appointments.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {nextUpcoming.map((appt) => (
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
                    {formatShortDate(appt.appointment_date)} ·{" "}
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
                </div>
                <AppointmentStatusBadge status={appt.status} />
              </button>
            ))}
          </div>
        )}

        {upcomingAppts.length > 7 && (
          <div className="mt-3 text-center">
            <Button
              variant="ghost"
              onClick={() => {}}
              className="text-sm text-slate-500"
            >
              {upcomingAppts.length - 7} more upcoming
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
