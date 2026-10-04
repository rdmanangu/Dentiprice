import { useEffect, useMemo, useState } from "react";
import type { AppointmentWithDetails } from "../../types/appointment";
import type { ConfirmScheduleResult } from "../../types/appointment";
import {
  confirmInquiryAndSchedule,
  getSchedulableInquiries,
  type SchedulableInquiry,
} from "../../services/inquiries";
import { Button, Field, Input, Modal, Select, Textarea } from "../ui";
import { formatPrice } from "../../lib/formatPrice";
import { todayLocalString } from "../../lib/dates";
import { formatLongDate } from "../../lib/patientDisplay";
import {
  APPOINTMENT_DURATION_OPTIONS,
  addMinutesToTime,
  conflictMessage,
  findConflictingAppointments,
} from "../../lib/appointmentFilters";
import { IconAlert } from "./icons";

type AppointmentScheduleModalProps = {
  open: boolean;
  /** Appointments already on the calendar, used for conflict warnings. */
  appointments: AppointmentWithDetails[];
  /** Pre-selected appointment date (e.g. the day clicked in the calendar). */
  initialDate?: string;
  /** Pre-selected inquiry, e.g. when arriving from the inquiries page. */
  initialInquiryId?: string | null;
  onClose: () => void;
  onScheduled: (result: ConfirmScheduleResult) => void;
};

// Appointments are created exclusively through the existing
// confirm_inquiry_and_schedule RPC, so the form books a pending
// inquiry. That keeps the inquiry → appointment relationship, the
// item snapshots, and every database validation (past date,
// end-after-start, one appointment per inquiry, admin role)
// intact.
export function AppointmentScheduleModal({
  open,
  appointments,
  initialDate,
  initialInquiryId = null,
  onClose,
  onScheduled,
}: AppointmentScheduleModalProps) {
  const today = todayLocalString();

  const [inquiries, setInquiries] = useState<SchedulableInquiry[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(true);
  const [inquiriesError, setInquiriesError] = useState<string | null>(
    null
  );

  const [inquiryId, setInquiryId] = useState("");
  const [date, setDate] = useState(initialDate ?? today);
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState<number>(60);
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset the form whenever the modal opens, using the render-phase
  // state adjustment React recommends instead of a synchronising effect.
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setInquiryId(initialInquiryId ?? "");
      setDate(
        initialDate && initialDate >= today ? initialDate : today
      );
      setStartTime("");
      setEndTime("");
      setDuration(60);
      setNotes("");
      setErrors({});
      setFormError(null);
    }
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        setLoadingInquiries(true);
        setInquiriesError(null);

        const data = await getSchedulableInquiries();

        if (!cancelled) {
          setInquiries(data);
        }
      } catch (err) {
        console.error(
          "Unable to load pending inquiries:",
          err
        );

        if (!cancelled) {
          setInquiries([]);
          setInquiriesError(
            "Unable to load pending inquiries. Please try again."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingInquiries(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [open]);

  const selectedInquiry = useMemo(
    () =>
      inquiries.find((inquiry) => inquiry.id === inquiryId) ??
      null,
    [inquiries, inquiryId]
  );

  // Selecting an inquiry pre-fills the date from the patient's
  // preference whenever that preference is still in the future.
  function handleInquiryChange(value: string) {
    setInquiryId(value);
    setErrors((current) => ({ ...current, inquiry: "" }));

    const inquiry = inquiries.find(
      (candidate) => candidate.id === value
    );

    if (
      inquiry?.preferred_date &&
      inquiry.preferred_date >= today
    ) {
      setDate(inquiry.preferred_date);
    }
  }

  function handleStartTimeChange(value: string) {
    setStartTime(value);
    setErrors((current) => ({
      ...current,
      startTime: "",
    }));

    if (value && duration > 0) {
      const computed = addMinutesToTime(value, duration);

      if (computed) {
        setEndTime(computed);
        setErrors((current) => ({
          ...current,
          endTime: "",
        }));
      }
    }
  }

  function handleDurationChange(value: string) {
    const minutes = Number(value);
    setDuration(minutes);
    setErrors((current) => ({ ...current, endTime: "" }));

    if (startTime) {
      const computed = addMinutesToTime(startTime, minutes);

      if (computed) {
        setEndTime(computed);
      }
    }
  }

  // Live conflict check against the appointments already loaded on
  // the page. The database still owns its own constraints; this only
  // gives the admin immediate feedback.
  const conflicts = useMemo(() => {
    if (!date || !startTime || !endTime || endTime <= startTime) {
      return [];
    }

    return findConflictingAppointments(appointments, {
      date,
      start: startTime,
      end: endTime,
    });
  }, [appointments, date, startTime, endTime]);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (saving) {
      return;
    }

    const nextErrors: Record<string, string> = {};

    if (!inquiryId) {
      nextErrors.inquiry = "Select the inquiry to schedule.";
    }

    if (!date) {
      nextErrors.date = "Select an appointment date.";
    } else if (date < today) {
      nextErrors.date =
        "Appointments cannot be scheduled in the past.";
    }

    if (!startTime) {
      nextErrors.startTime = "Select a start time.";
    }

    if (!endTime) {
      nextErrors.endTime = "Select an end time.";
    } else if (startTime && endTime <= startTime) {
      nextErrors.endTime =
        "End time must be after the start time.";
    }

    setErrors(nextErrors);
    setFormError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (conflicts.length > 0) {
      setFormError(conflictMessage(conflicts));
      return;
    }

    try {
      setSaving(true);

      const result = await confirmInquiryAndSchedule(
        inquiryId,
        date,
        startTime,
        endTime,
        notes
      );

      // Only close after the database confirmed the save.
      onScheduled(result);
    } catch (err) {
      console.error(
        "Unable to schedule appointment:",
        err
      );

      setFormError(
        err instanceof Error
          ? err.message
          : "The appointment could not be scheduled. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return null;
  }

  const noInquiries =
    !loadingInquiries && !inquiriesError && inquiries.length === 0;

  return (
    <Modal
      title="Schedule appointment"
      subtitle="Book a pending inquiry into the clinic calendar."
      onClose={saving ? () => undefined : onClose}
      maxWidth="lg"
      footer={
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            form="schedule-appointment-form"
            disabled={saving || loadingInquiries || noInquiries}
          >
            {saving
              ? "Scheduling..."
              : "Schedule appointment"}
          </Button>
        </div>
      }
    >
      {inquiriesError && (
        <p
          role="alert"
          className="mb-4 rounded-control border border-error-border bg-error-bg p-3 text-sm font-medium text-error"
        >
          {inquiriesError}
        </p>
      )}

      {noInquiries && (
        <div className="mb-4 rounded-card border border-border bg-bg p-5 text-center">
          <p className="text-sm font-semibold text-ink">
            No pending inquiries available
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Appointments are created from a consultation request.
            Confirm a pending inquiry first, then return here to
            schedule it.
          </p>
        </div>
      )}

      <form
        id="schedule-appointment-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-4"
      >
        <Field
          label="Pending inquiry"
          htmlFor="schedule-inquiry"
          required
          error={errors.inquiry}
          hint="The inquiry's treatment and add-ons are copied onto the appointment."
        >
          <Select
            id="schedule-inquiry"
            value={inquiryId}
            disabled={saving || loadingInquiries}
            onChange={(event) =>
              handleInquiryChange(event.target.value)
            }
          >
            <option value="">
              {loadingInquiries
                ? "Loading inquiries..."
                : "Select an inquiry"}
            </option>

            {inquiries.map((inquiry) => (
              <option
                key={inquiry.id}
                value={inquiry.id}
              >
                {inquiry.patient_name} — prefers{" "}
                {formatLongDate(inquiry.preferred_date)}
              </option>
            ))}
          </Select>
        </Field>

        {selectedInquiry && (
          <div className="rounded-control border border-border bg-bg p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">
                  {selectedInquiry.patient_name}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  {selectedInquiry.phone} ·{" "}
                  {selectedInquiry.email}
                </p>
              </div>

              <p className="text-sm font-semibold text-primary">
                {formatPrice(
                  selectedInquiry.calculated_total_price
                )}
              </p>
            </div>

            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Scheduled items
            </p>

            {selectedInquiry.inquiry_items.length === 0 ? (
              <p className="mt-1 text-sm text-slate-500">
                No items were saved with this inquiry. The
                appointment will be created without treatments.
              </p>
            ) : (
              <ul className="mt-1 space-y-0.5">
                {selectedInquiry.inquiry_items.map((item) => (
                  <li
                    key={item.id}
                    className="text-sm text-slate-600"
                  >
                    {item.item_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Appointment date"
            htmlFor="schedule-date"
            required
            error={errors.date}
          >
            <Input
              id="schedule-date"
              type="date"
              min={today}
              value={date}
              disabled={saving}
              onChange={(event) =>
                setDate(event.target.value)
              }
            />
          </Field>

          <Field
            label="Duration"
            htmlFor="schedule-duration"
            hint="Used to calculate the end time."
          >
            <Select
              id="schedule-duration"
              value={String(duration)}
              disabled={saving}
              onChange={(event) =>
                handleDurationChange(event.target.value)
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
            htmlFor="schedule-start"
            required
            error={errors.startTime}
          >
            <Input
              id="schedule-start"
              type="time"
              step={300}
              value={startTime}
              disabled={saving}
              onChange={(event) =>
                handleStartTimeChange(event.target.value)
              }
            />
          </Field>

          <Field
            label="End time"
            htmlFor="schedule-end"
            required
            error={errors.endTime}
          >
            <Input
              id="schedule-end"
              type="time"
              step={300}
              value={endTime}
              disabled={saving}
              onChange={(event) =>
                setEndTime(event.target.value)
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

        <Field
          label="Notes"
          htmlFor="schedule-notes"
          hint="Optional. Visible to clinic staff only."
        >
          <Textarea
            id="schedule-notes"
            rows={3}
            value={notes}
            disabled={saving}
            placeholder="Preparation notes, requested add-ons, seating needs..."
            onChange={(event) =>
              setNotes(event.target.value)
            }
          />
        </Field>

        {formError && (
          <p
            role="alert"
            className="rounded-control border border-error-border bg-error-bg p-3 text-sm font-medium text-error"
          >
            {formError}
          </p>
        )}
      </form>
    </Modal>
  );
}

export default AppointmentScheduleModal;