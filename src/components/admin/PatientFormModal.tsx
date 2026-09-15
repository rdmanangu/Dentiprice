import { useState } from "react";
import type { Patient } from "../../types/patient";
import {
  createPatient,
  updatePatient,
} from "../../services/patients";
import { Button, Field, Input, Modal, Textarea } from "../ui";

type PatientFormModalProps = {
  open: boolean;
  patient?: Patient | null;
  onClose: () => void;
  onSaved: (patient: Patient) => void;
};

function validatePatient(
  fullName: string,
  phone: string,
  email: string
): string | null {
  if (!fullName) {
    return "Patient name is required.";
  }

  if (!phone) {
    return "Phone number is required.";
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "A valid email address is required.";
  }

  return null;
}

export function PatientFormModal({
  open,
  patient,
  onClose,
  onSaved,
}: PatientFormModalProps) {
  const editing = Boolean(patient);
  const formKey = editing ? patient?.id : "new";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("full_name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const dateOfBirth =
      String(form.get("date_of_birth") ?? "").trim() || null;
    const notes = String(form.get("notes") ?? "").trim() || null;

    const validationError = validatePatient(fullName, phone, email);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const saved = patient
        ? await updatePatient(patient.id, {
            full_name: fullName,
            phone,
            email,
            date_of_birth: dateOfBirth,
            notes,
          })
        : await createPatient({
            full_name: fullName,
            phone,
            email,
            date_of_birth: dateOfBirth,
            notes,
          });

      setSaving(false);
      onSaved(saved);
    } catch (err) {
      console.error("Unable to save patient:", err);

      let message = editing
        ? "Unable to update the patient. Please try again."
        : "Unable to add the patient. Please try again.";

      if (err instanceof Error) {
        const msg = err.message.toLowerCase();

        if (msg.includes("another patient already uses")) {
          message = err.message;
        } else if (msg.includes("duplicate")) {
          message =
            "Another patient already uses that phone number or email.";
        } else if (msg.includes("permission denied") || msg.includes("row-level security")) {
          message =
            "Permission denied. Your account cannot save patient records.";
        }
      }

      setError(message);
      setSaving(false);
    }
  }

  return (
    <Modal
      title={editing ? "Edit patient" : "Add patient"}
      subtitle={
        editing
          ? "Update the patient's administrative information."
          : "Create a new patient record."
      }
      onClose={onClose}
      maxWidth="lg"
      footer={
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            form="patient-form"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : editing
                ? "Save changes"
                : "Add patient"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
        </div>
      }
    >
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-control border border-error-border bg-error-bg p-3 text-sm font-medium text-error"
        >
          {error}
        </p>
      )}

      <form
        id="patient-form"
        key={formKey}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <Field
          label="Full name"
          htmlFor="patient-full-name"
          required
        >
          <Input
            id="patient-full-name"
            name="full_name"
            type="text"
            defaultValue={editing ? patient?.full_name : ""}
            disabled={saving}
            placeholder="e.g. Maria Santos"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" htmlFor="patient-phone" required>
            <Input
              id="patient-phone"
              name="phone"
              type="tel"
              defaultValue={editing ? patient?.phone : ""}
              disabled={saving}
              placeholder="e.g. 0917 555 0198"
            />
          </Field>

          <Field
            label="Email"
            htmlFor="patient-email"
            required
          >
            <Input
              id="patient-email"
              name="email"
              type="email"
              defaultValue={editing ? patient?.email : ""}
              disabled={saving}
              placeholder="name@email.com"
            />
          </Field>
        </div>

        <Field
          label="Date of birth"
          htmlFor="patient-dob"
        >
          <Input
            id="patient-dob"
            name="date_of_birth"
            type="date"
            defaultValue={editing ? patient?.date_of_birth ?? "" : ""}
            disabled={saving}
          />
        </Field>

        <Field
          label="Patient notes"
          htmlFor="patient-notes"
          hint="Administrative notes shown to staff only. E.g. allergies, address."
        >
          <Textarea
            id="patient-notes"
            name="notes"
            rows={3}
            defaultValue={editing ? patient?.notes ?? "" : ""}
            disabled={saving}
            placeholder="Any additional information about this patient..."
          />
        </Field>
      </form>
    </Modal>
  );
}

export default PatientFormModal;