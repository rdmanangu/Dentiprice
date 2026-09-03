import { useEffect, useState } from "react";
import type { AppointmentStatus } from "../../types/appointment";
import type { AppointmentWithDetails } from "../../types/appointment";
import type { Inquiry } from "../../types/inquiry";
import {
  getAppointmentById,
  updateAppointmentStatus,
} from "../../services/appointments";
import { getInquiryById } from "../../services/inquiries";
import { Button, Modal, Select } from "../ui";
import { formatPrice } from "../../lib/formatPrice";
import { AppointmentStatusBadge } from "./appointmentPrimitives";

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
};

function AppointmentDetails({
  appointmentId,
  onClose,
  onStatusUpdated,
}: AppointmentDetailsProps) {
  const [appointment, setAppointment] =
    useState<AppointmentWithDetails | null>(null);
  const [inquiry, setInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<AppointmentStatus>("scheduled");
  const [updating, setUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

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

          if (data?.inquiry_id) {
            const related =
              await getInquiryById(data.inquiry_id);
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

  async function handleStatusChange(
    newStatus: AppointmentStatus
  ) {
    if (newStatus === status || !appointment) {
      return;
    }

    try {
      setUpdating(true);
      setStatusError(null);

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
      onStatusUpdated(updatedAppointment);
    } catch (err) {
      console.error("Unable to update appointment status:", err);
      setStatusError(
        "Unable to update the appointment status. Please try again."
      );
      setStatus(appointment.status);
    } finally {
      setUpdating(false);
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
                  {appointment.status}
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
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium text-ink capitalize">
                    {inquiry.status}
                  </p>
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
              className={`mt-2 font-medium capitalize`}
            >
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No show</option>
            </Select>

            {updating && (
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
    </Modal>
  );
}

export default AppointmentDetails;
