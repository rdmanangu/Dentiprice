import { useEffect, useState } from "react";
import type {
  Inquiry,
  InquiryStatus,
} from "../../types/inquiry";
import type { AppointmentWithDetails } from "../../types/appointment";

import {
  getInquiryById,
  getInquiryItems,
  updateInquiryStatus,
  confirmInquiryAndSchedule,
  type InquiryItem,
} from "../../services/inquiries";
import { getAppointmentByInquiryId } from "../../services/appointments";
import { Button, Field, Input, Modal, Select } from "../ui";
import { formatPrice } from "../../lib/formatPrice";
import {
  ALLOWED_INQUIRY_TRANSITIONS,
  canTransitionInquiry,
} from "../../lib/workflow";
import { InquiryStatusBadge } from "./primitives";
import { AppointmentStatusBadge } from "./appointmentPrimitives";
import AppointmentDetails from "./AppointmentDetails";

type InquiryDetailsProps = {
  inquiry: Inquiry;
  onClose: () => void;
  onStatusUpdated: (inquiry: Inquiry) => void;
};

function isInquiryStatus(value: string): value is InquiryStatus {
  return (
    value === "pending" ||
    value === "confirmed" ||
    value === "cancelled" ||
    value === "completed"
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

const statusSelectClasses: Record<InquiryStatus, string> = {
  pending: "text-warning",
  confirmed: "text-info",
  cancelled: "text-slate-600",
  completed: "text-success",
};

function InquiryDetails({
  inquiry,
  onClose,
  onStatusUpdated,
}: InquiryDetailsProps) {
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<InquiryStatus>(
    inquiry.status
  );

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [statusError, setStatusError] =
    useState<string | null>(null);

  const [scheduleDate, setScheduleDate] = useState(
    inquiry.preferred_date
  );
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [scheduleError, setScheduleError] =
    useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);
  const [confirmSuccess, setConfirmSuccess] =
    useState(false);

  // Related appointment (for confirmed inquiries)
  const [relatedAppointment, setRelatedAppointment] =
    useState<AppointmentWithDetails | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] =
    useState<string | null>(null);

  // ─────────────────────────────────────────────
  // LOAD INQUIRY ITEMS
  // ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadInquiryItems() {
      try {
        setLoading(true);
        setError(null);

        const data = await getInquiryItems(inquiry.id);

        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        console.error("Unable to load inquiry items:", err);

        if (!cancelled) {
          setError("Unable to load selected treatment and add-ons.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInquiryItems();

    return () => {
      cancelled = true;
    };
  }, [inquiry.id]);

  // ─────────────────────────────────────────────
  // LOAD RELATED APPOINTMENT (for confirmed)
  // ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    if (inquiry.status === "confirmed" || inquiry.status === "completed") {
      getAppointmentByInquiryId(inquiry.id)
        .then((data) => {
          if (!cancelled) {
            setRelatedAppointment(data);
          }
        })
        .catch(() => {
          // Silent — related appointment is optional display
        });
    }

    return () => {
      cancelled = true;
    };
  }, [inquiry.id, inquiry.status]);

  // ─────────────────────────────────────────────
  // UPDATE STATUS
  // ─────────────────────────────────────────────

  async function handleStatusChange(
    newStatus: InquiryStatus
  ) {
    if (newStatus === status) {
      return;
    }

    if (!canTransitionInquiry(status, newStatus)) {
      setStatusError(
        `This inquiry cannot be changed from ${status} to ${newStatus}.`
      );
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusError(null);

      const updated = await updateInquiryStatus(
        inquiry.id,
        newStatus
      );

      const updatedInquiry = {
        ...inquiry,
        ...updated,
        status: newStatus,
      };

      setStatus(updatedInquiry.status);
      onStatusUpdated(updatedInquiry);
    } catch (err) {
      console.error("Unable to update inquiry status:", err);

      let message =
        "Unable to update the inquiry status. Please try again.";

      if (err instanceof Error) {
        const msg = err.message.toLowerCase();

        if (msg.includes("already") && msg.includes("cannot be changed")) {
          message =
            "This inquiry has already reached a final status and cannot be changed.";
        } else if (msg.includes("invalid inquiry status transition")) {
          message = `This inquiry cannot be changed from ${status} to ${newStatus}.`;
        } else if (msg.includes("row-level security") || msg.includes("permission denied")) {
          message = "Permission denied. Your account cannot change this inquiry.";
        }
      }

      setStatusError(message);
      setStatus(inquiry.status);
    } finally {
      setUpdatingStatus(false);
    }
  }

  // ─────────────────────────────────────────────
  // CONFIRM & SCHEDULE
  // ─────────────────────────────────────────────

  async function handleConfirmSchedule(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setScheduleError(null);
    setConfirmSuccess(false);

    // Frontend guard (UX only) — the database is the final authority.
    if (status !== "pending") {
      setScheduleError(
        "This inquiry can no longer be scheduled because it is no longer pending."
      );
      return;
    }

    if (!inquiry.patient_id) {
      setScheduleError(
        "This inquiry cannot be scheduled because it is missing a patient record."
      );
      return;
    }

    if (!scheduleDate) {
      setScheduleError("Please select an appointment date.");
      return;
    }

    if (!scheduleStart) {
      setScheduleError("Please select a start time.");
      return;
    }

    if (!scheduleEnd) {
      setScheduleError("Please select an end time.");
      return;
    }

    if (scheduleEnd <= scheduleStart) {
      setScheduleError("End time must be after start time.");
      return;
    }

    try {
      setScheduling(true);

      const result = await confirmInquiryAndSchedule(
        inquiry.id,
        scheduleDate,
        scheduleStart,
        scheduleEnd
      );

      // Refresh the local state so the confirm form is no longer shown and
      // no stale "pending" state remains on screen.
      setStatus(result.inquiry_status);
      setConfirmSuccess(true);
      onStatusUpdated({
        ...inquiry,
        status: result.inquiry_status,
      });

      // Load the newly created related appointment so the relationship is
      // immediately visible without a manual refresh.
      getAppointmentByInquiryId(inquiry.id)
        .then((data) => setRelatedAppointment(data))
        .catch(() => {});
    } catch (err) {
      console.error("Confirm & schedule error:", err);

      let message =
        "Unable to schedule the appointment. Please try again.";

      if (err instanceof Error) {
        const msg = err.message.toLowerCase();

        if (msg.includes("already confirmed") || msg.includes("status is")) {
          message =
            "This inquiry has already been confirmed. The page will refresh to show the latest status.";
          // Stale state: the inquiry was confirmed elsewhere. Re-fetch it.
          getInquiryById(inquiry.id)
            .then((data) => {
              if (data) {
                setStatus(data.status);
                onStatusUpdated(data);
              }
            })
            .catch(() => {});
        } else if (msg.includes("no linked patient")) {
          message =
            "This inquiry cannot be scheduled because it is missing a patient record.";
        } else if (msg.includes("patient record not found")) {
          message =
            "This inquiry references a patient that no longer exists. Please contact support.";
        } else if (msg.includes("past")) {
          message =
            "Cannot schedule an appointment in the past. Please select a future date.";
        } else if (msg.includes("end time")) {
          message =
            "End time must be after start time. Please check your selection.";
        } else if (msg.includes("already") && msg.includes("schedule")) {
          message =
            "This inquiry has already been scheduled. The page will refresh to show the latest status.";
        } else {
          message = err.message;
        }
      }

      setScheduleError(message);
    } finally {
      setScheduling(false);
    }
  }

  return (
    <Modal
      title="Inquiry details"
      subtitle="Consultation request"
      onClose={onClose}
      maxWidth="xl"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-6">
        {/* PATIENT */}
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Patient
          </h3>

          <div className="mt-3 rounded-control border border-border bg-bg p-4">
            <p className="font-semibold text-ink">
              {inquiry.patient_name}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              {inquiry.phone}
            </p>

            <p className="text-sm text-slate-600">
              {inquiry.email}
            </p>
          </div>
        </section>

        {/* APPOINTMENT */}
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Appointment preference
          </h3>

          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="rounded-control border border-border bg-bg p-4">
              <p className="text-xs text-slate-500">Preferred date</p>
              <p className="mt-1 font-medium text-ink">
                {inquiry.preferred_date}
              </p>
            </div>

            <div className="rounded-control border border-border bg-bg p-4">
              <p className="text-xs text-slate-500">Preferred time</p>
              <p className="mt-1 font-medium capitalize text-ink">
                {inquiry.preferred_time_slot}
              </p>
            </div>
          </div>
        </section>

        {/* RELATED APPOINTMENT */}
        {relatedAppointment && (
          <section className="rounded-card border border-accent/30 bg-accent/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Scheduled appointment
              </h3>

              <AppointmentStatusBadge
                status={relatedAppointment.status}
              />
            </div>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="rounded-control border border-border bg-bg p-4">
                <p className="text-xs text-slate-500">Date</p>
                <p className="mt-1 font-medium text-ink">
                  {relatedAppointment.appointment_date}
                </p>
              </div>

              <div className="rounded-control border border-border bg-bg p-4">
                <p className="text-xs text-slate-500">Time</p>
                <p className="mt-1 font-medium text-ink">
                  {relatedAppointment.appointment_start_time} –{" "}
                  {relatedAppointment.appointment_end_time}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setSelectedAppointmentId(
                    relatedAppointment.id
                  )
                }
              >
                View appointment details
              </Button>
            </div>
          </section>
        )}

        {/* CONFIRM & SCHEDULE */}
        {status === "pending" && (
          <section className="rounded-card border border-accent/30 bg-accent/5 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Confirm &amp; schedule appointment
            </h3>

            <p className="mt-2 text-sm text-slate-600">
              Confirm this inquiry and create the appointment. The treatment
              and add-ons will be copied from the inquiry.
            </p>

            <form
              onSubmit={handleConfirmSchedule}
              className="mt-4 space-y-4"
            >
              <Field
                label="Appointment date"
                htmlFor="appointment-date"
                required
              >
                <Input
                  id="appointment-date"
                  type="date"
                  value={scheduleDate}
                  onChange={(event) =>
                    setScheduleDate(event.target.value)
                  }
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Start time"
                  htmlFor="appointment-start"
                  required
                >
                  <Input
                    id="appointment-start"
                    type="time"
                    value={scheduleStart}
                    onChange={(event) =>
                      setScheduleStart(event.target.value)
                    }
                  />
                </Field>

                <Field
                  label="End time"
                  htmlFor="appointment-end"
                  required
                >
                  <Input
                    id="appointment-end"
                    type="time"
                    value={scheduleEnd}
                    onChange={(event) =>
                      setScheduleEnd(event.target.value)
                    }
                  />
                </Field>
              </div>

              {scheduleError && (
                <p
                  role="alert"
                  className="rounded-control border border-error-border bg-error-bg p-3 text-sm font-medium text-error"
                >
                  {scheduleError}
                </p>
              )}

              <Button
                type="submit"
                disabled={scheduling}
                className="w-full sm:w-auto"
              >
                {scheduling
                  ? "Scheduling..."
                  : "Confirm & schedule"}
              </Button>
            </form>
          </section>
        )}

        {/* CONFIRM SUCCESS */}
        {confirmSuccess && (
          <section className="rounded-card border border-success-border bg-success-bg p-5">
            <p className="text-sm font-semibold text-success">
              Appointment scheduled successfully.
            </p>
            <p className="mt-1 text-sm text-slate-700">
              This inquiry has been marked as confirmed and the appointment
              has been created.
            </p>
          </section>
        )}

        {/* SELECTED ITEMS */}
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Selected treatment and add-ons
          </h3>

          {loading && (
            <p className="mt-3 text-sm text-slate-500" role="status">
              Loading selected items...
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-control border border-error-border bg-error-bg p-4 text-sm font-medium text-error"
            >
              {error}
            </p>
          )}

          {!loading &&
            !error &&
            items.length === 0 && (
              <p className="mt-3 rounded-control border border-border bg-bg p-4 text-sm text-slate-500">
                No item information was saved with this inquiry.
              </p>
            )}

          {!loading &&
            !error &&
            items.length > 0 && (
              <div className="mt-3 divide-y divide-border rounded-control border border-border">
                {items.map((item) => (
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

        {/* TOTAL */}
        <section className="rounded-card bg-gradient-to-br from-primary to-primary-hover p-5 text-white">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm text-white/70">
              Calculated total
            </span>

            <span className="text-2xl font-bold">
              {formatPrice(inquiry.calculated_total_price)}
            </span>
          </div>
        </section>

        {/* STATUS */}
        <section>
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Status
            </h3>

            <InquiryStatusBadge status={status} />
          </div>

          {status === "cancelled" || status === "completed" ? (
            <p className="mt-2 text-sm text-slate-500">
              This inquiry is{" "}
              <span className="capitalize">{status}</span> and is final. It
              cannot be changed.
            </p>
          ) : (
            <Select
              value={status}
              disabled={updatingStatus}
              onChange={(event) => {
                const newStatus = event.target.value;

                if (isInquiryStatus(newStatus)) {
                  handleStatusChange(newStatus);
                }
              }}
              aria-label="Update inquiry status"
              className={`mt-2 font-medium capitalize ${statusSelectClasses[status]}`}
            >
              <option value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
              {ALLOWED_INQUIRY_TRANSITIONS[status].map((next) => (
                <option key={next} value={next}>
                  {next.charAt(0).toUpperCase() + next.slice(1)}
                </option>
              ))}
            </Select>
          )}

          {updatingStatus && (
            <p className="mt-2 text-sm text-slate-500" role="status">
              Updating status...
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

        {/* CREATED / UPDATED */}
        <section className="border-t border-border pt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Created
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDateTime(inquiry.created_at)}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last updated
              </p>

              <p className="mt-1 text-sm text-slate-700">
                {formatDateTime(inquiry.updated_at)}
              </p>
            </div>
          </div>
        </section>
      </div>

      {selectedAppointmentId && (
        <AppointmentDetails
          appointmentId={selectedAppointmentId}
          onClose={() => setSelectedAppointmentId(null)}
          onStatusUpdated={() => {}}
          onAppointmentUpdated={() => {
            if (inquiry.status === "confirmed" || inquiry.status === "completed") {
              getAppointmentByInquiryId(inquiry.id)
                .then((data) => setRelatedAppointment(data))
                .catch(() => {});
            }
          }}
        />
      )}
    </Modal>
  );
}

export default InquiryDetails;
