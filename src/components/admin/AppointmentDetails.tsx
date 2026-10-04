import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type {
  AppointmentStatus,
  AppointmentWithDetails,
} from "../../types/appointment";
import type { Inquiry } from "../../types/inquiry";
import {
  getAppointmentById,
  updateAppointmentStatus,
  rescheduleAppointment,
  updateAppointmentNotes,
} from "../../services/appointments";
import { getInquiryById } from "../../services/inquiries";
import {
  Button,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
} from "../ui";
import { formatPrice } from "../../lib/formatPrice";
import { todayLocalString } from "../../lib/dates";
import { formatDateTime } from "../../lib/patientDisplay";
import {
  ALLOWED_APPOINTMENT_TRANSITIONS,
  canTransitionAppointment,
} from "../../lib/workflow";
import {
  APPOINTMENT_DURATION_OPTIONS,
  addMinutesToTime,
  appointmentRef,
  conflictMessage,
  durationLabel,
  findConflictingAppointments,
  formatClockTime,
} from "../../lib/appointmentFilters";
import { AppointmentStatusBadge } from "./appointmentPrimitives";
import { IconAlert, IconPhone } from "./icons";
import InquiryDetails from "./InquiryDetails";

// Actions that need an explicit confirmation step because they end
// the appointment lifecycle and cannot be undone.
const statusActionLabels: Record<
  AppointmentStatus,
  string
> = {
  scheduled: "Move to Scheduled",
  confirmed: "Confirm",
  completed: "Mark completed",
  cancelled: "Cancel appointment",
  no_show: "Mark no show",
};

const statusActionVariants: Record<
  AppointmentStatus,
  "primary" | "secondary" | "success" | "danger"
> = {
  scheduled: "secondary",
  confirmed: "primary",
  completed: "success",
  cancelled: "danger",
  no_show: "secondary",
};

type AppointmentDetailsProps = {
  appointmentId: string;
  onClose: () => void;
  onStatusUpdated: (appointment: AppointmentWithDetails) => void;
  onAppointmentUpdated?: () => void;
  /**
   * Other appointments currently on the schedule. Used for the
   * reschedule conflict check only; the database stays authoritative.
   */
  schedule?: AppointmentWithDetails[];
};

function AppointmentDetails({
  appointmentId,
  onClose,
  onStatusUpdated,
  onAppointmentUpdated,
  schedule = [],
}: AppointmentDetailsProps) {
  const [appointment, setAppointment] =
    useState<AppointmentWithDetails | null>(null);
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [showInquiryDetails, setShowInquiryDetails] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [status, setStatus] = useState<AppointmentStatus>(
    "scheduled"
  );
  const [pendingStatus, setPendingStatus] =
    useState<AppointmentStatus | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(
    null
  );
  const [statusSuccess, setStatusSuccess] = useState(false);

  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleDuration, setRescheduleDuration] = useState(60);
  const [rescheduleEnd, setRescheduleEnd] = useState("");
  const [rescheduleError, setRescheduleError] =
    useState<string | null>(null);
  const [rescheduleSuccess, setRescheduleSuccess] =
    useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState<string | null>(
    null
  );
  const [notesSuccess, setNotesSuccess] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  // ─────────────────────────────────────────────
  // LOAD
  // ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setLoadError(null);

        const data = await getAppointmentById(appointmentId);

        if (cancelled) {
          return;
        }

        if (!data) {
          setLoadError(
            "This appointment no longer exists. It may have been removed."
          );
          return;
        }

        setAppointment(data);
        setStatus(data.status);
        setRescheduleDate(data.appointment_date);
        setRescheduleStart(data.appointment_start_time.slice(0, 5));
        setRescheduleEnd(data.appointment_end_time.slice(0, 5));

        const minutes = timeDifferenceMinutes(
          data.appointment_start_time,
          data.appointment_end_time
        );
        setRescheduleDuration(
          APPOINTMENT_DURATION_OPTIONS.includes(
            minutes as (typeof APPOINTMENT_DURATION_OPTIONS)[number]
          )
            ? minutes
            : 60
        );

        setNotes(data.notes ?? "");

        if (data.inquiry_id) {
          const related = await getInquiryById(data.inquiry_id);

          if (!cancelled) {
            setInquiry(related);
          }
        } else if (!cancelled) {
          setInquiry(null);
        }
      } catch (err) {
        console.error(
          "Unable to load appointment details:",
          err
        );

        if (!cancelled) {
          setLoadError(
            "Unable to load this appointment. Check your connection and try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [appointmentId, reloadToken]);

  // ─────────────────────────────────────────────
  // DERIVED
  // ─────────────────────────────────────────────

  const allowedTransitions = appointment
    ? ALLOWED_APPOINTMENT_TRANSITIONS[appointment.status]
    : [];

  const isTerminal = allowedTransitions.length === 0;

  const canReschedule =
    appointment?.status === "scheduled" ||
    appointment?.status === "confirmed";

  // Exclude this appointment's own slot so re-saving the same time is
  // not reported as a conflict with itself.
  const conflicts = useMemo(() => {
    if (
      !rescheduleDate ||
      !rescheduleStart ||
      !rescheduleEnd ||
      rescheduleEnd <= rescheduleStart
    ) {
      return [];
    }

    return findConflictingAppointments(
      schedule,
      {
        date: rescheduleDate,
        start: rescheduleStart,
        end: rescheduleEnd,
      },
      appointmentId
    );
  }, [
    schedule,
    rescheduleDate,
    rescheduleStart,
    rescheduleEnd,
    appointmentId,
  ]);

  // ─────────────────────────────────────────────
  // STATUS
  // ─────────────────────────────────────────────

  function requestStatusChange(next: AppointmentStatus) {
    if (!appointment || next === status || savingStatus) {
      return;
    }

    if (!canTransitionAppointment(status, next)) {
      setStatusError(
        `This appointment cannot be changed from ${status.replace(
          "_",
          " "
        )} to ${next.replace("_", " ")}.`
      );
      return;
    }

    setStatusError(null);
    setStatusSuccess(false);
    setPendingStatus(next);
  }

  async function confirmStatusChange() {
    const next = pendingStatus;

    if (!appointment || !next || savingStatus) {
      return;
    }

    setSavingStatus(true);
    setStatusError(null);

    try {
      const updated = await updateAppointmentStatus(
        appointment.id,
        next
      );

      const merged: AppointmentWithDetails = {
        ...appointment,
        ...updated,
        patient: appointment.patient,
        appointment_items: appointment.appointment_items ?? [],
      };

      setAppointment(merged);
      setStatus(merged.status);
      setStatusSuccess(true);
      setPendingStatus(null);
      onStatusUpdated(merged);
      onAppointmentUpdated?.();
    } catch (err) {
      console.error(
        "Unable to update appointment status:",
        err
      );

      setStatusError(
        err instanceof Error
          ? err.message
          : "Unable to update the appointment status. Please try again."
      );
    } finally {
      setSavingStatus(false);
    }
  }

  // ─────────────────────────────────────────────
  // RESCHEDULE
  // ─────────────────────────────────────────────

  function handleRescheduleStartChange(value: string) {
    setRescheduleStart(value);
    setRescheduleError(null);
    setRescheduleSuccess(false);

    const computed = addMinutesToTime(
      value,
      rescheduleDuration
    );

    if (computed) {
      setRescheduleEnd(computed);
    }
  }

  function handleRescheduleDurationChange(value: string) {
    const minutes = Number(value);
    setRescheduleDuration(minutes);

    const computed = addMinutesToTime(
      rescheduleStart,
      minutes
    );

    if (computed) {
      setRescheduleEnd(computed);
    }
  }

  async function handleReschedule(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!appointment || rescheduling) {
      return;
    }

    setRescheduleError(null);
    setRescheduleSuccess(false);

    if (!rescheduleDate) {
      setRescheduleError("Please select an appointment date.");
      return;
    }

    if (!rescheduleStart) {
      setRescheduleError("Please select a start time.");
      return;
    }

    if (rescheduleDate < todayLocalString()) {
      setRescheduleError(
        "Appointments cannot be moved into the past."
      );
      return;
    }

    if (!rescheduleEnd) {
      setRescheduleError("Please select an end time.");
      return;
    }

    if (rescheduleEnd <= rescheduleStart) {
      setRescheduleError(
        "End time must be after the start time."
      );
      return;
    }

    if (conflicts.length > 0) {
      setRescheduleError(conflictMessage(conflicts));
      return;
    }

    try {
      setRescheduling(true);

      const updated = await rescheduleAppointment(
        appointment.id,
        rescheduleDate,
        rescheduleStart,
        rescheduleEnd
      );

      const merged: AppointmentWithDetails = {
        ...appointment,
        ...updated,
        patient: appointment.patient,
        appointment_items: appointment.appointment_items ?? [],
      };

      setAppointment(merged);
      setRescheduleSuccess(true);
      onStatusUpdated(merged);
      onAppointmentUpdated?.();
    } catch (err) {
      console.error(
        "Unable to reschedule appointment:",
        err
      );

      setRescheduleError(
        err instanceof Error
          ? err.message
          : "Unable to reschedule the appointment. Please try again."
      );
    } finally {
      setRescheduling(false);
    }
  }

  // ─────────────────────────────────────────────
  // NOTES
  // ─────────────────────────────────────────────

  async function handleSaveNotes() {
    if (!appointment || savingNotes) {
      return;
    }

    setNotesError(null);
    setNotesSuccess(false);

    try {
      setSavingNotes(true);

      const updated = await updateAppointmentNotes(
        appointment.id,
        notes.trim() || null
      );

      const merged: AppointmentWithDetails = {
        ...appointment,
        ...updated,
        patient: appointment.patient,
        appointment_items: appointment.appointment_items ?? [],
      };

      setAppointment(merged);
      setNotes(merged.notes ?? "");
      setNotesSuccess(true);
      onAppointmentUpdated?.();
    } catch (err) {
      console.error("Unable to save notes:", err);
      setNotesError(
        "Unable to save notes. Please try again."
      );
    } finally {
      setSavingNotes(false);
    }
  }

  const pendingNeedsConfirmation =
    pendingStatus === "cancelled" || pendingStatus === "no_show";

  return (
    <Modal
      title="Appointment details"
      subtitle={
        appointment
          ? `${appointment.patient?.full_name ?? "Patient"} · ${appointmentRef(
              appointment.id
            )}`
          : "Scheduled appointment"
      }
      onClose={onClose}
      maxWidth="xl"
      footer={
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
        >
          Close
        </Button>
      }
    >
      {loading && (
        <p className="text-sm text-slate-500" role="status">
          Loading appointment details...
        </p>
      )}

      {!loading && loadError && (
        <div className="rounded-card border border-error-border bg-error-bg p-5 text-center">
          <p
            role="alert"
            className="text-sm font-medium text-error"
          >
            {loadError}
          </p>

          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setReloadToken((n) => n + 1)}
            >
              Try again
            </Button>
          </div>
        </div>
      )}

      {!loading && !loadError && appointment && (
        <div className="space-y-6">
          {/* OVERVIEW */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-control border border-border bg-bg p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Date
              </p>
              <p className="mt-1 font-semibold text-ink">
                {formatDateTime(
                  `${appointment.appointment_date}T00:00:00`
                )}
              </p>
            </div>

            <div className="rounded-control border border-border bg-bg p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Time
              </p>
              <p className="mt-1 font-semibold text-ink">
                {formatClockTime(
                  appointment.appointment_start_time
                )}
                {" – "}
                {formatClockTime(
                  appointment.appointment_end_time
                )}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {durationLabel(timeDifferenceMinutes(
                  appointment.appointment_start_time,
                  appointment.appointment_end_time
                ))}
              </p>
            </div>

            <div className="rounded-control border border-border bg-bg p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Status
              </p>
              <div className="mt-1">
                <AppointmentStatusBadge status={status} />
              </div>
            </div>

            <div className="rounded-control border border-border bg-bg p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Reference
              </p>
              <p className="mt-1 font-semibold uppercase tracking-wide text-ink">
                {appointmentRef(appointment.id)}
              </p>
            </div>
          </section>

          {/* PATIENT */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Patient
            </h3>

            <div className="mt-3 rounded-control border border-border bg-bg p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    {appointment.patient?.full_name ??
                      "Unknown patient"}
                  </p>

                  {appointment.patient?.phone && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600">
                      <IconPhone className="h-3.5 w-3.5 text-slate-400" />
                      {appointment.patient.phone}
                    </p>
                  )}

                  {appointment.patient?.email && (
                    <p className="text-sm text-slate-600">
                      {appointment.patient.email}
                    </p>
                  )}
                </div>

                {appointment.patient_id && (
                  <Link
                    to={`/admin/patients/${appointment.patient_id}`}
                    onClick={onClose}
                    className="shrink-0 rounded-control border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    View patient
                  </Link>
                )}
              </div>
            </div>
          </section>

          {/* TREATMENT ITEMS */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Treatment and add-ons
            </h3>

            {(appointment.appointment_items ?? []).length === 0 ? (
              <p className="mt-3 rounded-control border border-border bg-bg p-4 text-sm text-slate-500">
                No treatments were scheduled with this appointment.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-border overflow-hidden rounded-control border border-border">
                {appointment.appointment_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-ink">
                        {item.item_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.procedure_id
                          ? "Treatment"
                          : "Add-on"}
                      </p>
                    </div>

                    <p className="shrink-0 font-semibold text-ink">
                      {formatPrice(item.item_price)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RELATED INQUIRY */}
          {appointment.inquiry_id && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Related inquiry
              </h3>

              {inquiry ? (
                <div className="mt-3 rounded-control border border-border bg-bg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium capitalize text-ink">
                      {inquiry.status}
                    </p>

                    <div className="flex items-center gap-3">
                      <p className="text-sm font-semibold text-primary">
                        {formatPrice(
                          inquiry.calculated_total_price
                        )}
                      </p>

                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() =>
                          setShowInquiryDetails(true)
                        }
                      >
                        View inquiry
                      </Button>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    Preferred: {inquiry.preferred_date} ·{" "}
                    {inquiry.preferred_time_slot}
                  </p>
                </div>
              ) : (
                <p className="mt-3 rounded-control border border-border bg-bg p-4 text-sm text-slate-500">
                  The inquiry linked to this appointment is no longer
                  available.
                </p>
              )}
            </section>
          )}

          {/* STATUS ACTIONS */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Status
            </h3>

            {isTerminal ? (
              <p className="mt-2 text-sm text-slate-500">
                This appointment is{" "}
                <span className="capitalize">
                  {status.replace("_", " ")}
                </span>{" "}
                and is final. It can no longer be changed.
              </p>
            ) : (
              <>
                <p className="mt-1 text-sm text-slate-500">
                  Move this appointment along the workflow. Cancelling
                  and no-show are final.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {allowedTransitions.map((next) => (
                    <Button
                      key={next}
                      type="button"
                      variant={statusActionVariants[next]}
                      disabled={savingStatus}
                      onClick={() =>
                        requestStatusChange(next)
                      }
                    >
                      {statusActionLabels[next]}
                    </Button>
                  ))}
                </div>
              </>
            )}

            {savingStatus && (
              <p
                className="mt-2 text-sm text-slate-500"
                role="status"
              >
                Updating status...
              </p>
            )}

            {statusSuccess && !pendingNeedsConfirmation && (
              <p className="mt-2 rounded-control border border-success-border bg-success-bg p-3 text-sm font-medium text-success">
                Status updated successfully.
              </p>
            )}

            {statusError && (
              <p
                role="alert"
                className="mt-2 rounded-control border border-error-border bg-error-bg p-3 text-sm font-medium text-error"
              >
                {statusError}
              </p>
            )}
          </section>

          {/* RESCHEDULE */}
          {canReschedule && (
            <section className="rounded-card border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Reschedule appointment
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                Change the date and time. The status and scheduled
                treatments are kept.
              </p>

              <form
                onSubmit={handleReschedule}
                noValidate
                className="mt-4 space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Appointment date"
                    htmlFor="reschedule-date"
                    required
                  >
                    <Input
                      id="reschedule-date"
                      type="date"
                      value={rescheduleDate}
                      min={todayLocalString()}
                      disabled={rescheduling}
                      onChange={(event) =>
                        setRescheduleDate(event.target.value)
                      }
                    />
                  </Field>

                  <Field
                    label="Duration"
                    htmlFor="reschedule-duration"
                    hint="Used to calculate the end time."
                  >
                    <Select
                      id="reschedule-duration"
                      value={String(rescheduleDuration)}
                      disabled={rescheduling}
                      onChange={(event) =>
                        handleRescheduleDurationChange(
                          event.target.value
                        )
                      }
                    >
                      {APPOINTMENT_DURATION_OPTIONS.map(
                        (minutes) => (
                          <option
                            key={minutes}
                            value={String(minutes)}
                          >
                            {minutes} minutes
                          </option>
                        )
                      )}
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Start time"
                    htmlFor="reschedule-start"
                    required
                  >
                    <Input
                      id="reschedule-start"
                      type="time"
                      step={300}
                      value={rescheduleStart}
                      disabled={rescheduling}
                      onChange={(event) =>
                        handleRescheduleStartChange(
                          event.target.value
                        )
                      }
                    />
                  </Field>

                  <Field
                    label="End time"
                    htmlFor="reschedule-end"
                    required
                  >
                    <Input
                      id="reschedule-end"
                      type="time"
                      step={300}
                      value={rescheduleEnd}
                      disabled={rescheduling}
                      onChange={(event) =>
                        setRescheduleEnd(event.target.value)
                      }
                    />
                  </Field>
                </div>

                {conflicts.length > 0 && (
                  <p
                    role="status"
                    className="flex items-start gap-2 rounded-control border border-warning-border bg-warning-bg p-3 text-sm font-medium text-warning"
                  >
                    <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{conflictMessage(conflicts)}</span>
                  </p>
                )}

                {rescheduleError && (
                  <p
                    role="alert"
                    className="rounded-control border border-error-border bg-error-bg p-3 text-sm font-medium text-error"
                  >
                    {rescheduleError}
                  </p>
                )}

                {rescheduleSuccess && (
                  <p
                    role="status"
                    className="rounded-control border border-success-border bg-success-bg p-3 text-sm font-medium text-success"
                  >
                    Appointment rescheduled successfully.
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={rescheduling}
                >
                  {rescheduling
                    ? "Saving..."
                    : "Save new time"}
                </Button>
              </form>
            </section>
          )}

          {!canReschedule && (
            <p className="rounded-card border border-border bg-bg p-4 text-sm text-slate-500">
              {isTerminal
                ? "This appointment is final, so it can no longer be rescheduled."
                : "Only scheduled or confirmed appointments can be rescheduled."}
            </p>
          )}

          {/* NOTES */}
          <section className="rounded-card border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Administrative notes
            </h3>

            <div className="mt-3">
              <Textarea
                id="appointment-notes"
                rows={3}
                value={notes}
                disabled={savingNotes}
                placeholder="Preparation notes, seating needs, follow-ups..."
                onChange={(event) =>
                  setNotes(event.target.value)
                }
              />
            </div>

            {notesError && (
              <p
                role="alert"
                className="mt-2 rounded-control border border-error-border bg-error-bg p-3 text-sm font-medium text-error"
              >
                {notesError}
              </p>
            )}

            {notesSuccess && (
              <p
                role="status"
                className="mt-2 rounded-control border border-success-border bg-success-bg p-3 text-sm font-medium text-success"
              >
                Notes saved successfully.
              </p>
            )}

            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                disabled={savingNotes}
                onClick={handleSaveNotes}
              >
                {savingNotes ? "Saving..." : "Save notes"}
              </Button>
            </div>
          </section>

          {/* TIMESTAMPS */}
          <section className="grid gap-4 border-t border-border pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Created
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {formatDateTime(appointment.created_at)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last updated
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {formatDateTime(appointment.updated_at)}
              </p>
            </div>
          </section>
        </div>
      )}

      {/* STATUS CONFIRMATION */}
      <ConfirmDialog
        open={pendingNeedsConfirmation && pendingStatus !== null}
        title={
          pendingStatus === "cancelled"
            ? "Cancel this appointment?"
            : "Mark as no show?"
        }
        description={
          pendingStatus === "cancelled"
            ? "Cancelling is final. The appointment cannot be reopened or rescheduled afterwards."
            : "Marking a no show is final. The appointment cannot be reopened afterwards."
        }
        confirmLabel={
          pendingStatus === "cancelled"
            ? "Cancel appointment"
            : "Mark no show"
        }
        loading={savingStatus}
        onCancel={() => {
          if (!savingStatus) {
            setPendingStatus(null);
          }
        }}
        onConfirm={confirmStatusChange}
      />

      {showInquiryDetails && inquiry && (
        <InquiryDetails
          inquiry={inquiry}
          onClose={() => setShowInquiryDetails(false)}
          onStatusUpdated={() => {}}
        />
      )}
    </Modal>
  );
}

// Minutes between two Postgres `time` values.
function timeDifferenceMinutes(
  start: string,
  end: string
): number {
  const [startHour, startMinute] = start
    .slice(0, 5)
    .split(":")
    .map(Number);
  const [endHour, endMinute] = end
    .slice(0, 5)
    .split(":")
    .map(Number);

  if (
    Number.isNaN(startHour) ||
    Number.isNaN(startMinute) ||
    Number.isNaN(endHour) ||
    Number.isNaN(endMinute)
  ) {
    return 0;
  }

  return (
    endHour * 60 + endMinute - (startHour * 60 + startMinute)
  );
}

export default AppointmentDetails;