import { useRef, useState } from "react";
import { createInquiry } from "../../services/inquiries";
import { Button, Field, Input, Select } from "../ui";
import { formatPrice } from "../../lib/formatPrice";
import { formatDisplayDate, todayLocalString } from "../../lib/dates";
import type { Procedure } from "../../types/procedure";

type AddOn = {
  id: string;
  name: string;
  price: number;
};

type InquiryFormProps = {
  procedure: Procedure;
  selectedAddOns?: AddOn[];
  totalPrice: number;
  onCancel: () => void;
  onStartOver?: () => void;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Returns a short, human-readable label for a time-slot value.
function timeSlotLabel(value: string): string {
  if (!value) {
    return "—";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

// Maps low-level submission failures to safe, user-facing messages.
// Internal database error details are logged for developers but are
// never shown directly to public users.
function userMessageFor(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (
      msg.includes("permission denied") ||
      msg.includes("403") ||
      msg.includes("row-level security")
    ) {
      return "Permission denied. Please try again later.";
    }

    if (
      msg.includes("network") ||
      msg.includes("fetch") ||
      msg.includes("failed to fetch")
    ) {
      return "Network error. Please check your internet connection and try again.";
    }
  }

  return "Unable to submit your consultation request. Please try again.";
}

function InquiryForm({
  procedure,
  selectedAddOns = [],
  totalPrice,
  onCancel,
  onStartOver,
}: InquiryFormProps) {
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState(false);

  // Guards against double-submission. The `submitting` state object alone is
  // not enough: two rapid submits can both read the stale closure value
  // (false) before React re-renders. A ref updates synchronously.
  const submissionInFlight = useRef(false);

  const today = todayLocalString();

  function clearFieldError(field: string) {
    setFieldErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validate({
    name,
    phoneNumber,
    emailAddress,
    date,
    timeSlot,
  }: {
    name: string;
    phoneNumber: string;
    emailAddress: string;
    date: string;
    timeSlot: string;
  }): { [key: string]: string } {
    const errors: { [key: string]: string } = {};

    if (!name.trim()) {
      errors.name = "Please enter your name.";
    } else if (name.trim().length < 2) {
      errors.name = "Your name must be at least 2 characters.";
    }

    if (!phoneNumber.trim()) {
      errors.phone = "Please enter your phone number.";
    } else {
      const phoneDigits = phoneNumber.replace(/\D/g, "").length;
      if (phoneDigits < 7 || phoneDigits > 15) {
        errors.phone = "Please enter a valid phone number.";
      }
    }

    if (!emailAddress.trim()) {
      errors.email = "Please enter your email.";
    } else if (!EMAIL_PATTERN.test(emailAddress.trim())) {
      errors.email = "Please enter a valid email address.";
    }

    if (!date) {
      errors.date = "Please select a preferred date.";
    } else if (date < today) {
      errors.date = "The preferred date cannot be in the past.";
    }

    if (!timeSlot) {
      errors.time = "Please select a preferred time.";
    }

    return errors;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting || submissionInFlight.current) {
      return;
    }

    setSubmitError(null);

    const errors = validate({
      name: patientName,
      phoneNumber: phone,
      emailAddress: email,
      date: preferredDate,
      timeSlot: preferredTimeSlot,
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const focusOrder = [
        "patient-name",
        "phone",
        "email",
        "preferred-date",
        "preferred-time",
      ];

      const firstInvalid = focusOrder.find((id) => {
        const key = id.replace("patient-", "").replace("preferred-", "");
        return Boolean(errors[key]);
      });

      const target = document.getElementById(
        firstInvalid ?? "patient-name"
      );

      if (target instanceof HTMLElement) {
        target.focus();
      }

      return;
    }

    try {
      submissionInFlight.current = true;
      setSubmitting(true);

      await createInquiry({
        patientName: patientName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        procedureId: procedure.id,
        procedureName: procedure.name,
        procedurePrice: procedure.base_price,
        selectedAddOns,
        totalPrice,
        preferredDate,
        preferredTimeSlot,
      });

      setSuccess(true);
    } catch (error) {
      console.error("INQUIRY SUBMISSION ERROR:", error);
      setSubmitError(userMessageFor(error));
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  }

  // Confirmation / success state
  if (success) {
    return (
      <div className="rounded-card border border-success-border bg-success-bg p-6 text-center">
        <p className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success text-2xl font-bold text-white" aria-hidden="true">
          ✓
        </p>

        <h2 className="mt-4 text-2xl font-bold text-success">
          Request submitted!
        </h2>

        <p className="mt-2 text-sm text-slate-700">
          Thank you, {patientName.trim() || "there"}! Your consultation
          request has been received by our clinic.
        </p>

        <div className="mx-auto mt-5 max-w-sm rounded-control border border-success-border bg-surface p-5 text-left">
          <p className="text-sm font-medium text-cta">Selected treatment</p>
          <p className="mt-1 font-semibold text-ink">{procedure.name}</p>

          {selectedAddOns.length > 0 && (
            <div className="mt-3">
              <p className="text-sm text-slate-500">Add-ons</p>
              <ul className="mt-1 space-y-1 text-sm text-slate-700">
                {selectedAddOns.map((addOn) => (
                  <li key={addOn.id} className="flex justify-between gap-3">
                    <span>{addOn.name}</span>
                    <span className="font-medium">{formatPrice(addOn.price)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-ink">Estimated total</span>
              <span className="text-2xl font-bold text-success">
                {formatPrice(totalPrice)}
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-4 max-w-sm rounded-control border border-border bg-surface p-4 text-left text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Preferred date</span>
            <span className="font-medium text-ink">
              {formatDisplayDate(preferredDate)}
            </span>
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <span className="text-slate-500">Preferred time</span>
            <span className="font-medium text-ink">
              {timeSlotLabel(preferredTimeSlot)}
            </span>
          </div>
        </div>

        <p className="mt-5 text-sm text-slate-700">
          This is a consultation request, not a confirmed appointment.
          Our clinic will contact you to confirm a final schedule.
          Please keep your phone and email handy.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {onStartOver && (
            <Button
              type="button"
              variant="secondary"
              onClick={onStartOver}
            >
              Start over
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            onClick={onCancel}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Selected treatment summary */}
      <div className="rounded-control border border-border bg-bg p-4">
        <p className="text-sm font-medium text-cta">Selected treatment</p>

        <p className="mt-1 font-semibold text-ink">{procedure.name}</p>

        {selectedAddOns.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-slate-500">Add-ons</p>

            <ul className="mt-1 space-y-1 text-sm text-slate-700">
              {selectedAddOns.map((addOn) => (
                <li key={addOn.id} className="flex justify-between gap-3">
                  <span>{addOn.name}</span>
                  <span className="font-medium">
                    {formatPrice(addOn.price)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-ink">Estimated total</span>

            <span className="text-xl font-bold text-primary">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <Field
          label="Full name"
          htmlFor="patient-name"
          required
          error={fieldErrors.name}
        >
          <Input
            id="patient-name"
            type="text"
            value={patientName}
            onChange={(event) => {
              setPatientName(event.target.value);
              clearFieldError("name");
            }}
            autoComplete="name"
            maxLength={100}
          />
        </Field>

        <Field
          label="Phone"
          htmlFor="phone"
          required
          error={fieldErrors.phone}
        >
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              clearFieldError("phone");
            }}
            autoComplete="tel"
            maxLength={30}
          />
        </Field>

        <Field
          label="Email"
          htmlFor="email"
          required
          error={fieldErrors.email}
        >
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              clearFieldError("email");
            }}
            autoComplete="email"
            maxLength={100}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Preferred date"
            htmlFor="preferred-date"
            required
            error={fieldErrors.date}
          >
            <Input
              id="preferred-date"
              type="date"
              value={preferredDate}
              min={today}
              onChange={(event) => {
                setPreferredDate(event.target.value);
                clearFieldError("date");
              }}
            />
          </Field>

          <Field
            label="Preferred time"
            htmlFor="preferred-time"
            required
            hint="Morning (before 12:00 PM), Afternoon (12:00–5:00 PM), Evening (after 5:00 PM)"
            error={fieldErrors.time}
          >
            <Select
              id="preferred-time"
              value={preferredTimeSlot}
              onChange={(event) => {
                setPreferredTimeSlot(event.target.value);
                clearFieldError("time");
              }}
            >
              <option value="">Select a time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </Select>
          </Field>
        </div>

        {submitError && (
          <p
            role="alert"
            className="rounded-control border border-error-border bg-error-bg p-4 text-sm font-medium text-error"
          >
            {submitError}
          </p>
        )}

        <Button
          type="submit"
          variant="cta"
          disabled={submitting}
          className="w-full"
        >
          {submitting ? "Submitting..." : "Submit request"}
        </Button>
      </form>
    </div>
  );
}

export default InquiryForm;