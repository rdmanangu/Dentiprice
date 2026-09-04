import { useEffect, useState } from "react";
import type { PatientHistory as PatientHistoryData } from "../../types/patient";
import type { Inquiry } from "../../types/inquiry";
import { getPatientHistory } from "../../services/patients";
import { Button, Modal } from "../ui";
import { formatPrice } from "../../lib/formatPrice";
import { InquiryStatusBadge } from "./primitives";
import { AppointmentStatusBadge } from "./appointmentPrimitives";
import InquiryDetails from "./InquiryDetails";
import AppointmentDetails from "./AppointmentDetails";

function formatDateTime(value: string): string {
  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString();
}

type PatientHistoryProps = {
  patientId: string;
  patientName: string;
  onClose: () => void;
};

function PatientHistory({
  patientId,
  patientName,
  onClose,
}: PatientHistoryProps) {
  const [history, setHistory] =
    useState<PatientHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedInquiry, setSelectedInquiry] =
    useState<Inquiry | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getPatientHistory(patientId)
      .then((data) => {
        if (!cancelled) {
          setHistory(data);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError("Unable to load patient history.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [patientId]);

  function handleAppointmentUpdated() {
    getPatientHistory(patientId)
      .then((data) => {
        setHistory(data);
      })
      .catch((err) => {
        console.error(err);
      });
  }

  return (
    <Modal
      title="Patient history"
      subtitle={patientName}
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
          Loading patient history...
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

      {!loading && !error && !history && (
        <p className="text-sm text-slate-500">
          No patient record was found.
        </p>
      )}

      {!loading && !error && history && (
        <div className="space-y-6">
          {/* PATIENT INFORMATION */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Patient information
            </h3>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="rounded-control border border-border bg-bg p-4">
                <p className="font-semibold text-ink">
                  {history.patient.full_name}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {history.patient.phone}
                </p>
                <p className="text-sm text-slate-600">
                  {history.patient.email}
                </p>
              </div>

              <div className="space-y-3">
                <div className="rounded-control border border-border bg-bg p-4">
                  <p className="text-xs text-slate-500">Date of birth</p>
                  <p className="mt-1 text-sm text-ink">
                    {history.patient.date_of_birth ?? "—"}
                  </p>
                </div>

                <div className="rounded-control border border-border bg-bg p-4">
                  <p className="text-xs text-slate-500">Patient since</p>
                  <p className="mt-1 text-sm text-ink">
                    {formatDateTime(history.patient.created_at)}
                  </p>
                </div>
              </div>
            </div>

            {(history.patient.notes ?? "").trim() !== "" && (
              <div className="mt-4 rounded-control border border-border bg-bg p-4">
                <p className="text-xs text-slate-500">Notes</p>
                <p className="mt-1 text-sm text-ink">
                  {history.patient.notes}
                </p>
              </div>
            )}
          </section>

          {/* EMPTY HISTORY */}
          {history.entries.length === 0 && (
            <p className="rounded-control border border-border bg-bg p-4 text-sm text-slate-500">
              This patient has no inquiries or appointments yet.
            </p>
          )}

          {/* TIMELINE */}
          {history.entries.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Activity timeline
              </h3>

              <div className="mt-3 space-y-4">
                {history.entries.map((entry) =>
                  entry.type === "inquiry" ? (
                    <div
                      key={entry.key}
                      className="rounded-control border border-border bg-surface p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-info">
                            Inquiry
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatDateTime(entry.inquiry.created_at)}
                          </p>
                        </div>
                        <InquiryStatusBadge status={entry.inquiry.status} />
                      </div>

                      <div className="mt-3">
                        {entry.items.length === 0 ? (
                          <p className="text-sm text-slate-400">
                            No item snapshots saved.
                          </p>
                        ) : (
                          <ul className="divide-y divide-border rounded-control border border-border">
                            {entry.items.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between gap-4 p-3"
                              >
                                <span className="text-sm text-ink">
                                  {item.item_name}
                                </span>
                                <span className="text-sm font-medium text-ink">
                                  {formatPrice(item.item_price)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm text-slate-500">
                          Preferred: {entry.inquiry.preferred_date} ·{" "}
                          {entry.inquiry.preferred_time_slot}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {formatPrice(entry.inquiry.calculated_total_price)}
                        </p>
                      </div>

                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setSelectedInquiry({
                              ...entry.inquiry,
                              patient_id:
                                entry.inquiry.patient_id ?? history.patient.id,
                            })
                          }
                        >
                          View inquiry
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={entry.key}
                      className="rounded-control border border-border bg-surface p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                            Appointment
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {entry.appointment.appointment_date},{" "}
                            {entry.appointment.appointment_start_time} –{" "}
                            {entry.appointment.appointment_end_time}
                          </p>
                        </div>
                        <AppointmentStatusBadge
                          status={entry.appointment.status}
                        />
                      </div>

                      <div className="mt-3">
                        {entry.items.length === 0 ? (
                          <p className="text-sm text-slate-400">
                            No item snapshots saved.
                          </p>
                        ) : (
                          <ul className="divide-y divide-border rounded-control border border-border">
                            {entry.items.map((item) => (
                              <li
                                key={item.id}
                                className="flex items-center justify-between gap-4 p-3"
                              >
                                <span className="text-sm text-ink">
                                  {item.item_name}
                                </span>
                                <span className="text-sm font-medium text-ink">
                                  {formatPrice(item.item_price)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setSelectedAppointmentId(entry.appointment.id)
                          }
                        >
                          View appointment
                        </Button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </section>
          )}

          {/* EMPTY SECTIONS */}
          {history.inquiries.length === 0 && (
            <p className="rounded-control border border-border bg-bg p-4 text-sm text-slate-500">
              No inquiries on record.
            </p>
          )}

          {history.appointments.length === 0 && (
            <p className="rounded-control border border-border bg-bg p-4 text-sm text-slate-500">
              No appointments on record.
            </p>
          )}
        </div>
      )}

      {selectedInquiry && (
        <InquiryDetails
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onStatusUpdated={() => {}}
        />
      )}

      {selectedAppointmentId && (
        <AppointmentDetails
          appointmentId={selectedAppointmentId}
          onClose={() => setSelectedAppointmentId(null)}
          onStatusUpdated={() => {}}
          onAppointmentUpdated={handleAppointmentUpdated}
        />
      )}
    </Modal>
  );
}

export default PatientHistory;
