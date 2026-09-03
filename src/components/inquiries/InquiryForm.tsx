import { useState } from "react";
import { createInquiry } from "../../services/inquiries";
import { Button, Field, Input, Select } from "../ui";
import { formatPrice } from "../../lib/formatPrice";
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
};

function InquiryForm({
  procedure,
  selectedAddOns = [],
  totalPrice,
  onCancel,
}: InquiryFormProps) {
  const [patientName, setPatientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [preferredTimeSlot, setPreferredTimeSlot] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError(null);
    setSuccess(false);

    if (!patientName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!preferredDate) {
      setError("Please select a preferred date.");
      return;
    }

    if (!preferredTimeSlot) {
      setError("Please select a preferred time.");
      return;
    }

    try {
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

      let userMessage =
        "Unable to submit your consultation request. Please try again.";

      if (error instanceof Error) {
        const msg = error.message.toLowerCase();

        if (
          msg.includes("permission denied") ||
          msg.includes("403")
        ) {
          userMessage =
            "Permission denied. Please try again later.";
        } else if (
          msg.includes("network") ||
          msg.includes("fetch")
        ) {
          userMessage =
            "Network error. Please check your internet connection.";
        } else {
          userMessage = error.message;
        }
      }

      setError(userMessage);
    } finally {
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
            <span className="font-medium capitalize text-ink">
              {preferredDate || "—"}
            </span>
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <span className="text-slate-500">Preferred time</span>
            <span className="font-medium capitalize text-ink">
              {preferredTimeSlot || "—"}
            </span>
          </div>
        </div>

        <p className="mt-5 text-sm text-slate-700">
          Our clinic will contact you to confirm your appointment.
          Please keep your phone and email handy.
        </p>

        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="mt-6"
        >
          Close
        </Button>
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

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <Field
          label="Patient name"
          htmlFor="patient-name"
          required
          error={error && !patientName.trim() ? "Please enter your name." : null}
        >
          <Input
            id="patient-name"
            type="text"
            value={patientName}
            onChange={(event) => setPatientName(event.target.value)}
            required
            autoComplete="name"
          />
        </Field>

        <Field
          label="Phone"
          htmlFor="phone"
          required
          error={error && !phone.trim() ? "Please enter your phone number." : null}
        >
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            autoComplete="tel"
          />
        </Field>

        <Field
          label="Email"
          htmlFor="email"
          required
          error={error && !email.trim() ? "Please enter your email." : null}
        >
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Preferred date"
            htmlFor="preferred-date"
            required
            error={error && !preferredDate ? "Please select a preferred date." : null}
          >
            <Input
              id="preferred-date"
              type="date"
              value={preferredDate}
              onChange={(event) => setPreferredDate(event.target.value)}
              required
            />
          </Field>

          <Field
            label="Preferred time"
            htmlFor="preferred-time"
            required
            error={error && !preferredTimeSlot ? "Please select a preferred time." : null}
          >
            <Select
              id="preferred-time"
              value={preferredTimeSlot}
              onChange={(event) => setPreferredTimeSlot(event.target.value)}
              required
            >
              <option value="">Select a time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </Select>
          </Field>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-control border border-error-border bg-error-bg p-4 text-sm font-medium text-error"
          >
            {error}
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
