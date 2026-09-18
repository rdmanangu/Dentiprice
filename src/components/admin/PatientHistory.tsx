import { useEffect, useState } from "react";
import type { PatientHistory as PatientHistoryData } from "../../types/patient";
import type { Inquiry } from "../../types/inquiry";
import { getPatientHistory, updatePatient } from "../../services/patients";
import { Button, Field, Input, Modal, Textarea } from "../ui";
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

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = new Date(dateOnly ? `${value}T00:00:00` : value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString();
}

function formatTime(time: string): string {
  const [h, m] = time.split(":");

  if (!h || !m) {
    return time;
  }

  const hour = parseInt(h, 10);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${suffix}`;
}

type PatientHistoryProps = {
  patientId: string;
  patientName: string;
  onClose: () => void;
  onDataChanged?: () => void;
};

function PatientHistory({
  patientId,
  patientName,
  onClose,
  onDataChanged,
}: PatientHistoryProps) {
  const [history, setHistory] =
    useState<PatientHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [notes, setNotes] = useState("");

  const [selectedInquiry, setSelectedInquiry] =
    useState<Inquiry | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] =
    useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);

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

  function loadHistory() {
    setLoadError(null);

    getPatientHistory(patientId)
      .then((data) => {
        setHistory(data);
      })
      .catch((err) => {
        console.error(err);
        setLoadError("Unable to refresh patient history. Please try again.");
      });
  }

  function notifyDataChanged() {
    onDataChanged?.();
  }

  function handleAppointmentUpdated() {
    loadHistory();
    notifyDataChanged();
  }

  function refreshAfterInquiryUpdate() {
    loadHistory();
    notifyDataChanged();
  }

  function startEditing() {
    if (!history) {
      return;
    }

    setFullName(history.patient.full_name);
    setPhone(history.patient.phone);
    setEmail(history.patient.email);
    setDateOfBirth(history.patient.date_of_birth ?? "");
    setNotes(history.patient.notes ?? "");
    setSaveError(null);
    setSaveSuccess(false);
    setEditing(true);
  }

  async function handleSaveEdit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setSaveError("Name, phone, and email are required.");
      return;
    }

    setSaving(true);

    try {
      const updated = await updatePatient(patientId, {
        full_name: fullName,
        phone,
        email,
        date_of_birth: dateOfBirth || null,
        notes: notes || null,
      });

      setHistory((current) =>
        current ? { ...current, patient: updated } : current
      );
      setSaveSuccess(true);
      setEditing(false);
      notifyDataChanged();
    } catch (err) {
      console.error("Unable to update patient:", err);

      let message =
        "Unable to update the patient. Please try again.";

      if (err instanceof Error) {
        const msg = err.message.toLowerCase();

        if (msg.includes("another patient already uses")) {
          message = err.message;
        } else if (msg.includes("permission denied") || msg.includes("row-level security")) {
          message =
            "Permission denied. Your account cannot edit patient records.";
        }
      }

      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  const patient = history?.patient ?? null;
  const upcoming = history?.upcoming_appointment ?? null;
  const latestActivity = history?.entries[0]?.date ?? null;

  return (
    <Modal
      title="Patient details"
      subtitle={patient ? patient.full_name : patientName}
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
          Loading patient details...
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
          {loadError && (
            <p
              role="alert"
              className="rounded-control border border-error-border bg-error-bg p-3 text-sm font-medium text-error"
            >
              {loadError}
            </p>
          )}

          {/* ── PATIENT INFORMATION / EDIT ─────────────────────── */}
          {editing ? (
            <section className="rounded-card border border-border bg-surface p-5">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Edit patient information
              </h3>

              <form
                onSubmit={handleSaveEdit}
                className="mt-4 space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Full name"
                    htmlFor="edit-full-name"
                    required
                  >
                    <Input
                      id="edit-full-name"
                      value={fullName}
                      onChange={(event) =>
                        setFullName(event.target.value)
                      }
                      disabled={saving}
                    />
                  </Field>

                  <Field
                    label="Phone"
                    htmlFor="edit-phone"
                    required
                  >
                    <Input
                      id="edit-phone"
                      type="tel"
                      value={phone}
                      onChange={(event) =>
                        setPhone(event.target.value)
                      }
                      disabled={saving}
                    />
                  </Field>

                  <Field
                    label="Email"
                    htmlFor="edit-email"
                    required
                  >
                    <Input
                      id="edit-email"
                      type="email"
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      disabled={saving}
                    />
                  </Field>

                  <Field
                    label="Date of birth"
                    htmlFor="edit-dob"
                  >
                    <Input
                      id="edit-dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(event) =>
                        setDateOfBirth(event.target.value)
                      }
                      disabled={saving}
                    />
                  </Field>
                </div>

                <Field
                  label="Administrative notes"
                  htmlFor="edit-notes"
                  hint="Internal notes only. Not shown to patients."
                >
                  <Textarea
                    id="edit-notes"
                    rows={3}
                    value={notes}
                    onChange={(event) =>
                      setNotes(event.target.value)
                    }
                    placeholder="Add administrative notes..."
                    disabled={saving}
                  />
                </Field>

                {saveError && (
                  <p
                    role="alert"
                    className="rounded-control border border-error-border bg-error-bg p-3 text-sm font-medium text-error"
                  >
                    {saveError}
                  </p>
                )}

                {saveSuccess && (
                  <p className="rounded-control border border-success-border bg-success-bg p-3 text-sm font-medium text-success">
                    Patient information updated successfully.
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button
                    type="submit"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </section>
          ) : (
            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Patient information
                </h3>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={startEditing}
                >
                  Edit
                </Button>
              </div>

              <div className="mt-3 rounded-control border border-border bg-bg p-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
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
                    <div>
                      <p className="text-xs text-slate-500">
                        Date of birth
                      </p>
                      <p className="mt-1 text-sm text-ink">
                        {formatDate(history.patient.date_of_birth)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Patient since
                      </p>
                      <p className="mt-1 text-sm text-ink">
                        {formatDateTime(history.patient.created_at)}
                      </p>
                    </div>
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
          )}

          {/* ── SUMMARY STATS ──────────────────────────────────── */}
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-control border border-border bg-bg p-4 text-center">
              <p className="text-2xl font-bold text-ink">
                {history.inquiries.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">Inquiries</p>
            </div>

            <div className="rounded-control border border-border bg-bg p-4 text-center">
              <p className="text-2xl font-bold text-ink">
                {history.appointments.length}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Appointments
              </p>
            </div>

            <div className="rounded-control border border-border bg-bg p-4 text-center">
              <p className="text-2xl font-bold text-ink">
                {formatDate(latestActivity)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Latest activity
              </p>
            </div>
          </section>

          {/* ── UPCOMING APPOINTMENT ───────────────────────────── */}
          {upcoming && (
            <section className="rounded-card border border-accent/40 bg-accent/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Upcoming appointment
                </h3>

                <AppointmentStatusBadge status={upcoming.status} />
              </div>

              <p className="mt-3 text-lg font-semibold text-ink">
                {formatDate(upcoming.appointment_date)}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {formatTime(upcoming.appointment_start_time)} –{" "}
                {formatTime(upcoming.appointment_end_time)}
              </p>

              <div className="mt-3">
                <Button
                  type="button"
                  onClick={() =>
                    setSelectedAppointmentId(upcoming.id)
                  }
                >
                  View appointment
                </Button>
              </div>
            </section>
          )}

          {/* ── EMPTY HISTORY ──────────────────────────────────── */}
          {history.entries.length === 0 && (
            <p className="rounded-control border border-border bg-bg p-4 text-sm text-slate-500">
              This patient has no inquiries or appointments yet.
            </p>
          )}

          {/* ── TIMELINE ───────────────────────────────────────── */}
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
                            {formatDate(entry.appointment.appointment_date)},{" "}
                            {formatTime(entry.appointment.appointment_start_time)} –{" "}
                            {formatTime(entry.appointment.appointment_end_time)}
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
        </div>
      )}

      {selectedInquiry && (
        <InquiryDetails
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onStatusUpdated={refreshAfterInquiryUpdate}
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
