import { useEffect, useState } from "react";
import type { AppointmentStatus } from "../../types/appointment";
import type { AppointmentWithDetails } from "../../types/appointment";
import type { Inquiry } from "../../types/inquiry";
import {
  getAppointmentById,
  updateAppointmentStatus,
  rescheduleAppointment,
  updateAppointmentNotes,
} from "../../services/appointments";
import { getInquiryById } from "../../services/inquiries";
import { Button, Field, Input, Modal, Select, Textarea } from "../ui";
import { formatPrice } from "../../lib/formatPrice";
import {
  ALLOWED_APPOINTMENT_TRANSITIONS,
  canTransitionAppointment,
} from "../../lib/workflow";
import { AppointmentStatusBadge } from "./appointmentPrimitives";
import InquiryDetails from "./InquiryDetails";

const appointmentStatuses: AppointmentStatus[] = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

function isAppointmentStatus(
  value: string
): value is AppointmentStatus {
  return appointmentStatuses.includes(value as AppointmentStatus);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

type AppointmentDetailsProps = {
  appointmentId: string;
  onClose: () => void;
  onStatusUpdated: (appointment: AppointmentWithDetails) => void;
  onAppointmentUpdated?: () => void;
};

function AppointmentDetails({
  appointmentId,
  onClose,
  onStatusUpdated,
  onAppointmentUpdated,
}: AppointmentDetailsProps) {
  const [appointment, setAppointment] =
    useState<AppointmentWithDetails | null>(null);
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [showInquiryDetails, setShowInquiryDetails] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status
  const [status, setStatus] = useState<AppointmentStatus>("scheduled");
  const [updating, setUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState(false);

  // Reschedule
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleStart, setRescheduleStart] = useState("");
  const [rescheduleEnd, setRescheduleEnd] = useState("");
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);

  // Notes
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState<string | null>(null);
  const [notesSuccess, setNotesSuccess] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  const canReschedule =
    appointment?.status === "scheduled" ||
    appointment?.status === "confirmed";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const data = await getAppointmentById(appointmentId);

        if (!cancelled) {
          setAppointment(data);
          setStatus(data?.status ?? "scheduled");
          setRescheduleDate(data?.appointment_date ?? "");
          setRescheduleStart(data?.appointment_start_time ?? "");
          setRescheduleEnd(data?.appointment_end_time ?? "");
          setNotes(data?.notes ?? "");

          if (!cancelled && data?.inquiry_id) {
            const related = await getInquiryById(data.inquiry_id);
            if (!cancelled) {
              setInquiry(related);
            }
          }
        }
      } catch (err) {
        console.error("Unable to load appointment details:", err);
        if (!cancelled) {
          setError("Unable to load appointment details.");
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
  }, [appointmentId]);

  // ─────────────────────────────────────────────
  // STATUS
  // ─────────────────────────────────────────────

  async function handleStatusChange(
    newStatus: AppointmentStatus
  ) {
    if (newStatus === status || !appointment) {
      return;
    }

    if (!canTransitionAppointment(status, newStatus)) {
      setStatusError(
        `This appointment cannot be changed from ${status.replace("_", " ")} to ${newStatus.replace("_", " ")}.`
      );
      return;
    }

    try {
      setUpdating(true);
      setStatusError(null);
      setStatusSuccess(false);

      const updated = await updateAppointmentStatus(
        appointment.id,
        newStatus
      );

      const updatedAppointment: AppointmentWithDetails = {
        ...appointment,
        ...updated,
        patient: appointment.patient,
        appointment_items: appointment.appointment_items ?? [],
      };

      setStatus(updatedAppointment.status);
      setAppointment(updatedAppointment);
      setStatusSuccess(true);
      onStatusUpdated(updatedAppointment);
      onAppointmentUpdated?.();
    } catch (err) {
      console.error("Unable to update appointment status:", err);

      let message = "Unable to update the appointment status. Please try again.";

      if (err instanceof Error) {
        const msg = err.message.toLowerCase();

        if (msg.includes("already") && msg.includes("cannot be changed")) {
          message = "This appointment has already reached a final status and cannot be changed.";
        } else if (msg.includes("invalid appointment status transition")) {
          message = `This appointment cannot be changed from ${status.replace("_", " ")} to ${newStatus.replace("_", " ")}.`;
        } else if (msg.includes("permission denied")) {
          message = "Permission denied. Your account cannot update this appointment.";
        }
      }

      setStatusError(message);
      setStatus(appointment.status);
    } finally {
      setUpdating(false);
    }
  }

  // ─────────────────────────────────────────────
  // RESCHEDULE
  // ─────────────────────────────────────────────

  async function handleReschedule(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!appointment) {
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

    if (!rescheduleEnd) {
      setRescheduleError("Please select an end time.");
      return;
    }

    if (rescheduleEnd <= rescheduleStart) {
      setRescheduleError("End time must be after start time.");
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

      const updatedAppointment: AppointmentWithDetails = {
        ...appointment,
        ...updated,
        patient: appointment.patient,
        appointment_items: appointment.appointment_items ?? [],
      };

      setAppointment(updatedAppointment);
      setStatus(updatedAppointment.status);
      setRescheduleSuccess(true);
      onStatusUpdated(updatedAppointment);
      onAppointmentUpdated?.();
    } catch (err) {
      console.error("Unable to reschedule appointment:", err);

      let message = "Unable to reschedule the appointment. Please try again.";

      if (err instanceof Error) {
        const msg = err.message.toLowerCase();

        if (msg.includes("end time") || msg.includes("check")) {
          message = "End time must be after start time. Please check your selection.";
        } else if (msg.includes("past")) {
          message = "Cannot schedule an appointment in the past. Please select a future date.";
        } else {
          message = err.message;
        }
      }

      setRescheduleError(message);
    } finally {
      setRescheduling(false);
    }
  }

  // ─────────────────────────────────────────────
  // NOTES
  // ─────────────────────────────────────────────

  async function handleSaveNotes() {
    if (!appointment) {
      return;
    }

    setNotesError(null);
    setNotesSuccess(false);

    const trimmed = notes.trim();

    try {
      setSavingNotes(true);

      const updated = await updateAppointmentNotes(
        appointment.id,
        trimmed || null
      );

      const updatedAppointment: AppointmentWithDetails = {
        ...appointment,
        ...updated,
        patient: appointment.patient,
        appointment_items: appointment.appointment_items ?? [],
      };

      setAppointment(updatedAppointment);
      setNotes(updatedAppointment.notes ?? "");
      setNotesSuccess(true);
      onAppointmentUpdated?.();
    } catch (err) {
      console.error("Unable to update appointment notes:", err);
      setNotesError(
        "Unable to save notes. Please try again."
      );
    } finally {
      setSavingNotes(false);
    }
  }

  return (
    <Modal
      title="Appointment details"
      subtitle="Scheduled appointment"
      onClose={onClose}
      maxWidth="xl"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {loading && (
        <p className="text-sm text-slate-500" role="status">
          Loading appointment details...
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-control border border-error-border bg-error-bg p-4 text-sm font-medium text-error"
        >
          {error}
        </p>
      )}

      {!loading && !error && appointment && (
        <div className="space-y-6">
          {/* PATIENT */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Patient
            </h3>

            <div className="mt-3 rounded-control border border-border bg-bg p-4">
              <p className="font-semibold text-ink">
                {appointment.patient?.full_name ?? "Unknown patient"}
              </p>

              <p className="mt-2 text-sm text-slate-600">
                {appointment.patient?.phone ?? "—"}
              </p>

              <p className="text-sm text-slate-600">
                {appointment.patient?.email ?? "—"}
              </p>
            </div>
          </section>

          {/* APPOINTMENT */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Appointment
            </h3>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="rounded-control border border-border bg-bg p-4">
                <p className="text-xs text-slate-500">Date</p>
                <p className="mt-1 font-medium text-ink">
                  {appointment.appointment_date}
                </p>
              </div>

              <div className="rounded-control border border-border bg-bg p-4">
                <p className="text-xs text-slate-500">Time</p>
                <p className="mt-1 font-medium text-ink">
                  {appointment.appointment_start_time} –{" "}
                  {appointment.appointment_end_time}
                </p>
              </div>

              <div className="rounded-control border border-border bg-bg p-4">
                <p className="text-xs text-slate-500">Status</p>
                <p className="mt-1 font-medium text-ink capitalize">
                  {appointment.status.replace("_", " ")}
                </p>
              </div>

              {appointment.notes && (
                <div className="rounded-control border border-border bg-bg p-4">
                  <p className="text-xs text-slate-500">Notes</p>
                  <p className="mt-1 text-sm text-ink">
                    {appointment.notes}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* TREATMENT ITEMS */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Treatment and add-ons
            </h3>

            {(appointment.appointment_items ?? []).length === 0 ? (
              <p className="mt-3 rounded-control border border-border bg-bg p-4 text-sm text-slate-500">
                No items were scheduled with this appointment.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-border rounded-control border border-border">
                {(appointment.appointment_items ?? []).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-4"
                  >
                    <div>
                      <p className="font-medium text-ink">
                        {item.item_name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.procedure_id ? "Treatment" : "Add-on"}
                      </p>
                    </div>
                    <p className="font-semibold text-ink">
                      {formatPrice(item.item_price)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* RELATED INQUIRY */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Related inquiry
            </h3>

            {inquiry ? (
              <div className="mt-3 rounded-control border border-border bg-bg p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-medium text-ink capitalize">
                    {inquiry.status}
                  </p>

                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-primary">
                      {formatPrice(inquiry.calculated_total_price)}
                    </p>

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowInquiryDetails(true)}
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
                No related inquiry for this appointment.
              </p>
            )}
          </section>

          {/* STATUS */}
          <section>
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Status
              </h3>

              <AppointmentStatusBadge status={status} />
            </div>

            {status === "completed" ||
            status === "cancelled" ||
            status === "no_show" ? (
              <p className="mt-2 text-sm text-slate-500">
                This appointment is{" "}
                <span className="capitalize">
                  {status.replace("_", " ")}
                </span>{" "}
                and is final. It cannot be changed.
              </p>
            ) : (
              <Select
                value={status}
                disabled={updating}
                onChange={(event) => {
                  const newStatus = event.target.value;
                  if (isAppointmentStatus(newStatus)) {
                    handleStatusChange(newStatus);
                  }
                }}
                aria-label="Update appointment status"
                className="mt-2 font-medium capitalize"
              >
                <option value={status}>
                  {status.charAt(0).toUpperCase() +
                    status.slice(1).replace("_", " ")}
                </option>
                {ALLOWED_APPOINTMENT_TRANSITIONS[status].map((next) => (
                  <option key={next} value={next}>
                    {next.charAt(0).toUpperCase() +
                      next.slice(1).replace("_", " ")}
                  </option>
                ))}
              </Select>
            )}

            {updating && (
              <p className="mt-2 text-sm text-slate-500" role="status">
                Updating status...
              </p>
            )}

            {statusSuccess && (
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

              <p className="mt-2 text-sm text-slate-600">
                Change the date and time of this appointment.
              </p>

              <form
                onSubmit={handleReschedule}
                className="mt-4 space-y-4"
              >
                <Field
                  label="Appointment date"
                  htmlFor="reschedule-date"
                  required
                >
                  <Input
                    id="reschedule-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(event) =>
                      setRescheduleDate(event.target.value)
                    }
                    disabled={rescheduling}
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Start time"
                    htmlFor="reschedule-start"
                    required
                  >
                    <Input
                      id="reschedule-start"
                      type="time"
                      value={rescheduleStart}
                      onChange={(event) =>
                        setRescheduleStart(event.target.value)
                      }
                      disabled={rescheduling}
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
                      value={rescheduleEnd}
                      onChange={(event) =>
                        setRescheduleEnd(event.target.value)
                      }
                      disabled={rescheduling}
                    />
                  </Field>
                </div>

                {rescheduleError && (
                  <p
                    role="alert"
                    className="rounded-control border border-error-border bg-error-bg p-3 text-sm font-medium text-error"
                  >
                    {rescheduleError}
                  </p>
                )}

                {rescheduleSuccess && (
                  <p className="rounded-control border border-success-border bg-success-bg p-3 text-sm font-medium text-success">
                    Appointment rescheduled successfully.
                  </p>
                )}

                <Button type="submit" disabled={rescheduling}>
                  {rescheduling ? "Saving..." : "Save new time"}
                </Button>
              </form>
            </section>
          )}

          {/* NOTES */}
          <section className="rounded-card border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Administrative notes
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Add or edit scheduling notes for this appointment.
            </p>

            <div className="mt-4">
              <Textarea
                id="appointment-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add scheduling notes..."
                rows={4}
                disabled={savingNotes}
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
              <p className="mt-2 rounded-control border border-success-border bg-success-bg p-3 text-sm font-medium text-success">
                Notes saved successfully.
              </p>
            )}

            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSaveNotes}
                disabled={savingNotes}
              >
                {savingNotes ? "Saving..." : "Save notes"}
              </Button>
            </div>
          </section>

          {/* CREATED / UPDATED */}
          <section className="border-t border-border pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
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
            </div>
          </section>
        </div>
      )}

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

export default AppointmentDetails;
