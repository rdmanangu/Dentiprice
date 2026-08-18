import { useState } from "react";
import { createInquiry } from "../../services/inquiries";
import type { Procedure } from "../../types/procedure";

type AddOn = {
  id: string;
  name: string;
  price: number;
};

type InquiryFormProps = {
  procedure: Procedure;
  selectedAddOns: AddOn[];
  totalPrice: number;
  onCancel: () => void;
};

function InquiryForm({
  procedure,
  selectedAddOns,
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

async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  setError(null);

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
      patientName,
      phone,
      email,
      procedureId: procedure.id,
      procedureName: procedure.name,
      procedurePrice: procedure.base_price,
      selectedAddOns,
      totalPrice,
      preferredDate,
      preferredTimeSlot,
    });

    alert("Your consultation request has been submitted.");

    onCancel();
  } catch (error) {
  console.error("FULL SUPABASE ERROR:", error);

  if (error && typeof error === "object") {
    console.table(error);
  }

  setError("Unable to submit your consultation request.");
}
}

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Request a consultation
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Send your preferred appointment details to the clinic.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          Cancel
        </button>
      </div>

      <div className="mt-6 rounded-xl bg-slate-50 p-4">
        <p className="text-sm text-slate-500">
          Selected treatment
        </p>

        <p className="mt-1 font-semibold text-slate-900">
          {procedure.name}
        </p>

        {selectedAddOns.length > 0 && (
          <div className="mt-3">
            <p className="text-sm text-slate-500">
              Add-ons
            </p>

            <ul className="mt-1 text-sm text-slate-700">
              {selectedAddOns.map((addOn) => (
                <li key={addOn.id}>
                  {addOn.name} — ₱{Number(addOn.price).toLocaleString()}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-4 border-t border-slate-200 pt-4">
          <div className="flex justify-between">
            <span className="font-medium text-slate-700">
              Estimated total
            </span>

            <span className="font-bold text-slate-900">
              ₱{totalPrice.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="patient-name"
            className="block text-sm font-medium text-slate-700"
          >
            Patient name
          </label>

          <input
            id="patient-name"
            type="text"
            value={patientName}
            onChange={(event) => setPatientName(event.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="block text-sm font-medium text-slate-700"
          >
            Phone
          </label>

          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="preferred-date"
              className="block text-sm font-medium text-slate-700"
            >
              Preferred date
            </label>

            <input
              id="preferred-date"
              type="date"
              value={preferredDate}
              onChange={(event) =>
                setPreferredDate(event.target.value)
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label
              htmlFor="preferred-time"
              className="block text-sm font-medium text-slate-700"
            >
              Preferred time
            </label>

            <select
              id="preferred-time"
              value={preferredTimeSlot}
              onChange={(event) =>
                setPreferredTimeSlot(event.target.value)
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-slate-900"
            >
              <option value="">Select a time</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Submit request"}
      </button>
    </form>
  );
}

export default InquiryForm;
