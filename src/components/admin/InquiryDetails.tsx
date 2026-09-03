import { useEffect, useState } from "react";
import type {
  Inquiry,
  InquiryStatus,
} from "../../types/inquiry";

import {
  getInquiryItems,
  updateInquiryStatus,
  confirmInquiryAndSchedule,
  type InquiryItem,
} from "../../services/inquiries";
import { Button, Field, Input, Modal, Select } from "../ui";
import { formatPrice } from "../../lib/formatPrice";
import { InquiryStatusBadge } from "./primitives";

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
  // UPDATE STATUS
  // ─────────────────────────────────────────────

  async function handleStatusChange(
    newStatus: InquiryStatus
  ) {
    if (newStatus === status) {
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

      setStatusError(
        "Unable to update the inquiry status. Please try again."
      );

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

      onStatusUpdated({
        ...inquiry,
        status: result.inquiry_status,
      });
    } catch (err) {
      console.error("Confirm & schedule error:", err);

      let message =
        "Unable to schedule the appointment. Please try again.";

      if (err instanceof Error) {
        const msg = err.message.toLowerCase();

        if (msg.includes("already confirmed") || msg.includes("status is")) {
          message =
            "This inquiry has already been processed. Please refresh.";
        } else if (msg.includes("no linked patient")) {
          message =
            "This inquiry has no linked patient. Patient resolution is required before scheduling.";
        } else if (msg.includes("past")) {
          message =
            "Cannot schedule an appointment in the past. Please select a future date.";
        } else if (msg.includes("end time")) {
          message =
            "End time must be after start time. Please check your selection.";
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

              <Button type="submit" disabled={scheduling}>
                {scheduling
                  ? "Scheduling..."
                  : "Confirm & schedule"}
              </Button>
            </form>
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
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </Select>

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
    </Modal>
  );
}

export default InquiryDetails;
