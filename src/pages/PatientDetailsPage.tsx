import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type {
  AppointmentWithDetails,
} from "../types/appointment";
import type {
  InquiryWithItems,
  PatientHistory as PatientHistoryData,
} from "../types/patient";
import type { Inquiry } from "../types/inquiry";
import { getPatientHistory, updatePatient } from "../services/patients";
import {
  confirmInquiryAndSchedule,
  updateInquiryStatus,
} from "../services/inquiries";
import { getAppointmentByInquiryId } from "../services/appointments";
import {
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  SectionHeader,
  Textarea,
} from "../components/ui";
import { formatPrice } from "../lib/formatPrice";
import { todayLocalString } from "../lib/dates";
import { canTransitionInquiry } from "../lib/workflow";
import { AppointmentStatusBadge } from "../components/admin/appointmentPrimitives";
import { InquiryStatusBadge } from "../components/admin/primitives";
import InquiryDetails from "../components/admin/InquiryDetails";
import AppointmentDetails from "../components/admin/AppointmentDetails";
import {
  IconChevronRight,
  IconPhone,
} from "../components/admin/icons";
import { PatientAvatar } from "../components/admin/patientPrimitives";
import {
  formatDateTime,
  formatLongDate,
  formatPatientSince,
  formatTime12,
  inquiryRef,
  patientRef,
} from "../lib/patientDisplay";

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-0.5 break-words text-sm text-ink">{children}</div>
    </div>
  );
}

function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const today = todayLocalString();

  const [history, setHistory] = useState<PatientHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [notes, setNotes] = useState("");

  const [relatedAppointment, setRelatedAppointment] =
    useState<AppointmentWithDetails | null>(null);

  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduling, setScheduling] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getPatientHistory(id ?? "")
      .then((data) => {
        if (!cancelled) {
          setHistory(data);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError("Unable to load patient details.");
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
  }, [id]);

  const currentInquiry = useMemo<InquiryWithItems | null>(() => {
    if (!history || history.inquiries.length === 0) {
      return null;
    }

    return history.inquiries.reduce((latest, current) =>
      current.inquiry.created_at > latest.inquiry.created_at
        ? current
        : latest
    );
  }, [history]);

  useEffect(() => {
    if (!currentInquiry) {
      return;
    }

    let cancelled = false;

    getAppointmentByInquiryId(currentInquiry.inquiry.id)
      .then((data) => {
        if (!cancelled) {
          setRelatedAppointment(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRelatedAppointment(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentInquiry]);

  async function loadHistory() {
    setActionError(null);

    try {
      const data = await getPatientHistory(id ?? "");
      setHistory(data);
    } catch (err) {
      console.error("Unable to refresh patient details:", err);
      setActionError("Unable to refresh patient details. Please try again.");
    }
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
    setEditing(true);
  }

  async function handleSaveEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);

    if (!fullName.trim() || !phone.trim() || !email.trim()) {
      setSaveError("Name, phone, and email are required.");
      return;
    }

    setSaving(true);

    try {
      const updated = await updatePatient(id ?? "", {
        full_name: fullName,
        phone,
        email,
        date_of_birth: dateOfBirth || null,
        notes: notes || null,
      });

      setHistory((current) =>
        current ? { ...current, patient: updated } : current
      );
      setEditing(false);
    } catch (err) {
      console.error("Unable to update patient:", err);

      let message = "Unable to update the patient. Please try again.";

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

  async function runInquiryAction(
    action: () => Promise<unknown>
  ) {
    setActionBusy(true);
    setActionError(null);

    try {
      await action();
      await loadHistory();
    } catch (err) {
      console.error(err);
      setActionError(
        "Unable to update the inquiry. Please try again."
      );
    } finally {
      setActionBusy(false);
    }
  }

  async function handleConfirmSchedule(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setScheduleError(null);

    if (!currentInquiry) {
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

    setScheduling(true);

    try {
      await confirmInquiryAndSchedule(
        currentInquiry.inquiry.id,
        scheduleDate,
        scheduleStart,
        scheduleEnd
      );

      setShowScheduleForm(false);
      await loadHistory();
    } catch (err) {
      console.error("Confirm & schedule error:", err);

      let message = "Unable to schedule the appointment. Please try again.";

      if (err instanceof Error) {
        const msg = err.message.toLowerCase();

        if (msg.includes("already confirmed") || msg.includes("status is")) {
          message =
            "This inquiry has already been confirmed and scheduled.";
        } else if (msg.includes("past")) {
          message =
            "Cannot schedule an appointment in the past. Please select a future date.";
        } else if (msg.includes("end time")) {
          message = "End time must be after start time.";
        } else {
          message = err.message;
        }
      }

      setScheduleError(message);
    } finally {
      setScheduling(false);
    }
  }

  const inquiry = currentInquiry?.inquiry ?? null;
  const inquiryItems = currentInquiry?.items ?? [];

  return (
    <div className="space-y-6">
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
        <div className="rounded-card border border-border bg-surface p-8 text-center">
          <p className="font-semibold text-ink">No patient record was found.</p>
          <div className="mt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate("/admin/patients")}
            >
              Back to Patients
            </Button>
          </div>
        </div>
      )}

      {!loading && !error && history && (
        <>
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-500">
              <li>
                <Link
                  to="/admin/patients"
                  className="font-medium text-primary hover:underline"
                >
                  Patients
                </Link>
              </li>
              <li aria-hidden="true">
                <IconChevronRight className="h-3.5 w-3.5" />
              </li>
              <li className="truncate font-medium text-slate-900">
                {history.patient.full_name}
              </li>
            </ol>
          </nav>

          <SectionHeader
            as="h1"
            title="Patient Details"
            subtitle="Profile, current inquiry, and full treatment history."
          />

          {/* PROFILE CARD */}
          <Card>
            {editing ? (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Edit patient information
                </h2>

                <form
                  onSubmit={handleSaveEdit}
                  className="mt-4 space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Full name"
                      htmlFor="detail-full-name"
                      required
                    >
                      <Input
                        id="detail-full-name"
                        value={fullName}
                        onChange={(event) =>
                          setFullName(event.target.value)
                        }
                        disabled={saving}
                      />
                    </Field>

                    <Field
                      label="Phone"
                      htmlFor="detail-phone"
                      required
                    >
                      <Input
                        id="detail-phone"
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
                      htmlFor="detail-email"
                      required
                    >
                      <Input
                        id="detail-email"
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
                      htmlFor="detail-dob"
                    >
                      <Input
                        id="detail-dob"
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
                    label="Patient notes"
                    htmlFor="detail-notes"
                    hint="Administrative notes shown to staff only."
                  >
                    <Textarea
                      id="detail-notes"
                      value={notes}
                      onChange={(event) =>
                        setNotes(event.target.value)
                      }
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

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={saving}>
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
              </div>
            ) : (
              <div>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                  <PatientAvatar
                    name={history.patient.full_name}
                    className="h-16 w-16 text-xl"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-bold text-ink">
                      {history.patient.full_name}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Patient since {formatPatientSince(history.patient.created_at)}
                    </p>

                    <div className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
                      <DetailRow label="Patient ID">
                        {patientRef(history.patient.id)}
                      </DetailRow>

                      <DetailRow label="Phone">
                        <a
                          href={`tel:${history.patient.phone}`}
                          className="hover:text-primary hover:underline"
                        >
                          {history.patient.phone}
                        </a>
                      </DetailRow>

                      <DetailRow label="Email">
                        {history.patient.email}
                      </DetailRow>

                      <DetailRow label="Birthdate">
                        {formatLongDate(history.patient.date_of_birth)}
                      </DetailRow>

                      <DetailRow label="Address">—</DetailRow>

                      <DetailRow label="Allergies">—</DetailRow>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-3 sm:flex-col">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={startEditing}
                    >
                      Edit Info
                    </Button>

                    <a
                      href={`tel:${history.patient.phone}`}
                      className="inline-flex items-center justify-center gap-2 rounded-control border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      <IconPhone className="h-4 w-4" />
                      Call Patient
                    </a>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* CURRENT INQUIRY CARD */}
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Current Inquiry
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {inquiry ? inquiryRef(inquiry.id) : "No recent inquiry"}
                </p>
              </div>

              {inquiry && <InquiryStatusBadge status={inquiry.status} />}
            </div>

            {!inquiry && (
              <p className="mt-4 rounded-control border border-border bg-bg p-4 text-sm text-slate-500">
                This patient has no inquiry on record.
              </p>
            )}

            {inquiry && (
              <>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-control border border-border bg-bg p-4">
                    <p className="text-xs text-slate-500">Treatment</p>
                    {inquiryItems.length === 0 ? (
                      <p className="mt-1 text-sm text-slate-400">
                        No item snapshots saved.
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {inquiryItems.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between gap-3 text-sm"
                          >
                            <span className="text-ink">{item.item_name}</span>
                            <span className="ml-auto font-medium text-ink">
                              {formatPrice(item.item_price)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="rounded-control border border-border bg-bg p-4">
                      <p className="text-xs text-slate-500">
                        Preferred schedule
                      </p>
                      <p className="mt-1 font-medium capitalize text-ink">
                        {formatLongDate(inquiry.preferred_date)} ·{" "}
                        {inquiry.preferred_time_slot}
                      </p>
                    </div>

                    <div className="rounded-control border border-border bg-bg p-4">
                      <p className="text-xs text-slate-500">Estimated total</p>
                      <p className="mt-1 text-lg font-bold text-primary">
                        {formatPrice(inquiry.calculated_total_price)}
                      </p>
                    </div>
                  </div>
                </div>

                {(history.patient.notes ?? "").trim() !== "" && (
                  <div className="mt-4 rounded-control border border-border bg-bg p-4">
                    <p className="text-xs text-slate-500">Patient notes</p>
                    <p className="mt-1 text-sm text-ink">
                      {history.patient.notes}
                    </p>
                  </div>
                )}

                {actionError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-control border border-error-border bg-error-bg p-3 text-sm font-medium text-error"
                  >
                    {actionError}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  {inquiry.status === "pending" && (
                    <Button
                      type="button"
                      variant="success"
                      disabled={actionBusy}
                      onClick={() => setShowScheduleForm((current) => !current)}
                    >
                      Confirm Appointment
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    disabled={actionBusy}
                    onClick={() => {
                      if (
                        relatedAppointment &&
                        relatedAppointment.inquiry_id === inquiry?.id
                      ) {
                        setSelectedAppointmentId(relatedAppointment.id);
                      } else {
                        navigate("/admin/scheduling");
                      }
                    }}
                  >
                    Reschedule
                  </Button>

                  {canTransitionInquiry(inquiry.status, "completed") && (
                    <Button
                      type="button"
                      variant="primary"
                      disabled={actionBusy}
                      onClick={() =>
                        runInquiryAction(() =>
                          updateInquiryStatus(inquiry.id, "completed")
                        )
                      }
                    >
                      Mark Completed
                    </Button>
                  )}

                  {canTransitionInquiry(inquiry.status, "cancelled") && (
                    <Button
                      type="button"
                      variant="danger"
                      disabled={actionBusy}
                      onClick={() => setConfirmCancel(true)}
                    >
                      Cancel Inquiry
                    </Button>
                  )}
                </div>

                {(inquiry.status === "cancelled" ||
                  inquiry.status === "completed") && (
                  <p className="mt-4 text-sm text-slate-500">
                    This inquiry is{" "}
                    <span className="capitalize">{inquiry.status}</span> and is
                    final. It cannot be changed.
                  </p>
                )}

                {showScheduleForm && inquiry.status === "pending" && (
                  <form
                    onSubmit={handleConfirmSchedule}
                    className="mt-5 rounded-card border border-accent/30 bg-accent/5 p-5"
                  >
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                      Confirm &amp; schedule appointment
                    </h3>

                    <div className="mt-4 grid gap-4 sm:grid-cols-3">
                      <Field
                        label="Appointment date"
                        htmlFor="confirm-date"
                        required
                      >
                        <Input
                          id="confirm-date"
                          type="date"
                          value={scheduleDate}
                          min={today}
                          onChange={(event) =>
                            setScheduleDate(event.target.value)
                          }
                        />
                      </Field>

                      <Field
                        label="Start time"
                        htmlFor="confirm-start"
                        required
                      >
                        <Input
                          id="confirm-start"
                          type="time"
                          value={scheduleStart}
                          onChange={(event) =>
                            setScheduleStart(event.target.value)
                          }
                        />
                      </Field>

                      <Field
                        label="End time"
                        htmlFor="confirm-end"
                        required
                      >
                        <Input
                          id="confirm-end"
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
                        className="mt-3 rounded-control border border-error-border bg-error-bg p-3 text-sm font-medium text-error"
                      >
                        {scheduleError}
                      </p>
                    )}

                    <div className="mt-4">
                      <Button
                        type="submit"
                        variant="success"
                        disabled={scheduling}
                      >
                        {scheduling ? "Scheduling..." : "Confirm & schedule"}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}
          </Card>

          {/* PATIENT HISTORY CARD */}
          <Card>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Patient History
            </h2>

            {history.entries.length === 0 ? (
              <p className="mt-4 rounded-control border border-border bg-bg p-4 text-sm text-slate-500">
                This patient has no previous treatments or inquiries on record.
              </p>
            ) : (
              <div className="mt-4 space-y-4">
                {history.entries.map((entry) => {
                  if (entry.type === "inquiry") {
                    const treatmentName =
                      entry.items.find((item) => item.procedure_id)?.item_name ??
                      "Inquiry";

                    return (
                      <div
                        key={entry.key}
                        className="rounded-control border border-border bg-bg p-4"
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

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                          <p className="font-medium text-ink">
                            {treatmentName}
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
                                  entry.inquiry.patient_id ??
                                  history.patient.id,
                              })
                            }
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  const treatmentName =
                    entry.items.find((item) => item.procedure_id)?.item_name ??
                    "Appointment";
                  const total = entry.items.reduce(
                    (sum, item) => sum + item.item_price,
                    0
                  );

                  return (
                    <div
                      key={entry.key}
                      className="rounded-control border border-border bg-bg p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                            Appointment
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatLongDate(entry.appointment.appointment_date)}
                            {" · "}
                            {formatTime12(
                              entry.appointment.appointment_start_time
                            )}
                            {" – "}
                            {formatTime12(entry.appointment.appointment_end_time)}
                          </p>
                        </div>
                        <AppointmentStatusBadge
                          status={entry.appointment.status}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-ink">
                          {treatmentName}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {formatPrice(total)}
                        </p>
                      </div>

                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            setSelectedAppointmentId(entry.appointment.id)
                          }
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel inquiry?"
        description="Are you sure you want to cancel this inquiry? This action cannot be undone."
        loading={actionBusy}
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => {
          if (inquiry) {
            setConfirmCancel(false);
            runInquiryAction(() =>
              updateInquiryStatus(inquiry.id, "cancelled")
            );
          }
        }}
      />

      {selectedInquiry && (
        <InquiryDetails
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onStatusUpdated={() => {
            setSelectedInquiry(null);
            loadHistory();
          }}
        />
      )}

      {selectedAppointmentId && (
        <AppointmentDetails
          appointmentId={selectedAppointmentId}
          onClose={() => setSelectedAppointmentId(null)}
          onStatusUpdated={() => {
            setSelectedAppointmentId(null);
            loadHistory();
          }}
          onAppointmentUpdated={() => {
            setSelectedAppointmentId(null);
            loadHistory();
          }}
        />
      )}
    </div>
  );
}

export default PatientDetailsPage;