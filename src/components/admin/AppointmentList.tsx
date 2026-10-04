import type { AppointmentWithDetails } from "../../types/appointment";
import { Button, DataTable } from "../ui";
import { PatientAvatar } from "./patientPrimitives";
import { AppointmentStatusBadge } from "./appointmentPrimitives";
import {
  appointmentDurationMinutes,
  appointmentRef,
  appointmentStatusDotClass,
  appointmentTreatmentLabel,
  durationLabel,
  formatClockTime,
} from "../../lib/appointmentFilters";
import { formatLongDate } from "../../lib/patientDisplay";

type AppointmentListProps = {
  appointments: AppointmentWithDetails[];
  onSelect: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  isFiltered: boolean;
  onResetFilters?: () => void;
  emptyAction?: React.ReactNode;
};

function TreatmentCell({
  appointment,
}: {
  appointment: AppointmentWithDetails;
}) {
  const items = appointment.appointment_items ?? [];

  if (items.length === 0) {
    return (
      <span className="text-sm text-slate-400">
        General appointment
      </span>
    );
  }

  const addOnCount = items.filter(
    (item) => item.add_on_id
  ).length;

  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-ink">
        {appointmentTreatmentLabel(appointment)}
      </p>

      {addOnCount > 0 && (
        <p className="text-xs text-slate-500">
          +{addOnCount} add-on{addOnCount === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}

// Table on desktop, stacked cards on small screens, so the row
// content stays readable without horizontal page scrolling.
export function AppointmentList({
  appointments,
  onSelect,
  loading = false,
  error = null,
  isFiltered,
  onResetFilters,
  emptyAction,
}: AppointmentListProps) {
  return (
    <>
      {/* DESKTOP TABLE */}
      <div className="hidden md:block">
        <DataTable
          ariaLabel="Appointments"
          loading={loading}
          loadingLabel="Loading appointments..."
          error={error}
          rows={appointments}
          getRowId={(appointment) => appointment.id}
          onRowClick={(appointment) =>
            onSelect(appointment.id)
          }
          emptyTitle={
            isFiltered
              ? "No appointments match your filters."
              : "No appointments scheduled yet."
          }
          emptyDescription={
            isFiltered
              ? "Try a different search term, or reset the filters to see the full schedule."
              : "Appointments created from a pending inquiry will appear here."
          }
          emptyAction={
            isFiltered && onResetFilters ? (
              <Button
                type="button"
                variant="secondary"
                onClick={onResetFilters}
              >
                Reset filters
              </Button>
            ) : (
              emptyAction
            )
          }
          columns={[
            {
              key: "patient",
              header: "Patient",
              render: (appointment) => (
                <div className="flex items-center gap-3">
                  <PatientAvatar
                    name={
                      appointment.patient?.full_name ?? "—"
                    }
                    className="h-9 w-9 text-xs"
                  />

                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {appointment.patient?.full_name ??
                        "Unknown patient"}
                    </p>

                    <p className="text-xs text-slate-500">
                      {appointment.patient?.phone ?? "—"}
                    </p>

                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      {appointmentRef(appointment.id)}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              key: "treatment",
              header: "Treatment",
              render: (appointment) => (
                <TreatmentCell
                  appointment={appointment}
                />
              ),
            },
            {
              key: "date",
              header: "Date",
              render: (appointment) => (
                <span className="whitespace-nowrap text-sm text-ink">
                  {formatLongDate(
                    appointment.appointment_date
                  )}
                </span>
              ),
            },
            {
              key: "time",
              header: "Time",
              render: (appointment) => (
                <span className="whitespace-nowrap text-sm text-slate-600">
                  {formatClockTime(
                    appointment.appointment_start_time
                  )}
                  {" – "}
                  {formatClockTime(
                    appointment.appointment_end_time
                  )}
                </span>
              ),
            },
            {
              key: "duration",
              header: "Duration",
              render: (appointment) => (
                <span className="whitespace-nowrap text-sm text-slate-500">
                  {durationLabel(
                    appointmentDurationMinutes(appointment)
                  )}
                </span>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (appointment) => (
                <AppointmentStatusBadge
                  status={appointment.status}
                />
              ),
            },
            {
              key: "actions",
              header: "Actions",
              align: "right",
              render: (appointment) => (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelect(appointment.id);
                  }}
                  className="whitespace-nowrap rounded-control border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:border-accent/40 hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  View
                </button>
              ),
            },
          ]}
        />
      </div>

      {/* MOBILE CARDS */}
      <div className="space-y-3 md:hidden">
        {loading && (
          <p
            className="rounded-card border border-border bg-surface p-6 text-center text-sm text-slate-500"
            role="status"
          >
            Loading appointments...
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-card border border-error-border bg-error-bg p-6 text-center text-sm font-medium text-error"
          >
            {error}
          </p>
        )}

        {!loading && !error && appointments.length === 0 && (
          <div className="rounded-card border border-border bg-surface p-6 text-center">
            <p className="font-semibold text-ink">
              {isFiltered
                ? "No appointments match your filters."
                : "No appointments scheduled yet."}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {isFiltered
                ? "Try a different search term, or reset the filters to see the full schedule."
                : "Appointments created from a pending inquiry will appear here."}
            </p>

            {isFiltered && onResetFilters && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="rounded-control border border-border bg-surface px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Reset filters
                </button>
              </div>
            )}

            {!isFiltered && emptyAction && (
              <div className="mt-4">{emptyAction}</div>
            )}
          </div>
        )}

        {!loading &&
          !error &&
          appointments.map((appointment) => (
            <button
              key={appointment.id}
              type="button"
              onClick={() => onSelect(appointment.id)}
              className="w-full rounded-card border border-border bg-surface p-4 text-left shadow-card transition-colors hover:border-accent/40 hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">
                    {appointment.patient?.full_name ??
                      "Unknown patient"}
                  </p>

                  <p className="mt-0.5 text-xs uppercase tracking-wide text-slate-400">
                    {appointmentRef(appointment.id)}
                  </p>
                </div>

                <AppointmentStatusBadge
                  status={appointment.status}
                  className="shrink-0"
                />
              </div>

              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-pill ${appointmentStatusDotClass[appointment.status]}`}
                  />
                  {formatLongDate(appointment.appointment_date)}
                  {" · "}
                  {formatClockTime(
                    appointment.appointment_start_time
                  )}
                  {" – "}
                  {formatClockTime(
                    appointment.appointment_end_time
                  )}
                </p>

                <p className="truncate text-slate-500">
                  {appointmentTreatmentLabel(appointment)}
                </p>

                <p className="text-xs text-slate-400">
                  {durationLabel(
                    appointmentDurationMinutes(appointment)
                  )}
                </p>
              </div>
            </button>
          ))}
      </div>
    </>
  );
}

export default AppointmentList;