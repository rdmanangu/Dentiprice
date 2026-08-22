import { useEffect, useState } from "react";
import type { Inquiry } from "../../types/inquiry";
import {
  getInquiryItems,
  type InquiryItem,
} from "../../services/inquiries";


type InquiryDetailsProps = {
  inquiry: Inquiry;
  onClose: () => void;
};

function InquiryDetails({
  inquiry,
  onClose,
}: InquiryDetailsProps) {
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getInquiryItems(inquiry.id)
      .then((data) => {
        if (!cancelled) {
          setItems(data);
        }
      })
      .catch((err) => {
        console.error("Unable to load inquiry items:", err);

        if (!cancelled) {
          setError("Unable to load inquiry items.");
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
  }, [inquiry.id]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div
        className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-details-title"
      >
        <div className="flex items-center justify-between border-b p-6">
          <div>
            <h2
              id="inquiry-details-title"
              className="text-xl font-bold text-slate-900"
            >
              Inquiry details
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Consultation request
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close inquiry details"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Patient */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Patient
            </h3>

            <div className="mt-3 rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">
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

          {/* Appointment */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Appointment preference
            </h3>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Preferred date
                </p>

                <p className="mt-1 font-medium text-slate-900">
                  {inquiry.preferred_date}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs text-slate-500">
                  Preferred time
                </p>

                <p className="mt-1 font-medium text-slate-900">
                  {inquiry.preferred_time_slot}
                </p>
              </div>
            </div>
          </section>

          {/* Selected items */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Selected treatment and add-ons
            </h3>

            {loading && (
              <p className="mt-3 text-sm text-slate-500">
                Loading selected items...
              </p>
            )}

            {error && (
              <p
                role="alert"
                className="mt-3 rounded-xl bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            {!loading &&
              !error &&
              items.length === 0 && (
                <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  No item information was saved with this inquiry.
                </p>
              )}

            {!loading &&
              !error &&
              items.length > 0 && (
                <div className="mt-3 divide-y rounded-xl border border-slate-200">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 p-4"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.item_name}
                        </p>

                        <p className="text-sm text-slate-500">
                          {item.procedure_id ? "Treatment" : "Add-on"}
                        </p>
                      </div>

                      <p className="font-semibold text-slate-900">
                        ₱
                        {Number(item.item_price).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
          </section>

          {/* Total */}
          <section className="rounded-xl bg-slate-900 p-5 text-white">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-300">
                Calculated total
              </span>

              <span className="text-2xl font-bold">
                ₱
                {Number(
                  inquiry.calculated_total_price ?? 0
                ).toLocaleString()}
              </span>
            </div>
          </section>

          {/* Status */}
          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Status
            </h3>

            <p className="mt-2 font-medium capitalize text-slate-900">
              {inquiry.status}
            </p>
          </section>
        </div>

        <div className="border-t p-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default InquiryDetails;
