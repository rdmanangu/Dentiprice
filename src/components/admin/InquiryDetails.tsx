import { useEffect, useState } from "react";
import type {
  Inquiry,
  InquiryStatus,
} from "../../types/inquiry";

import {
  getInquiryItems,
  updateInquiryStatus,
  type InquiryItem,
} from "../../services/inquiries";

type InquiryDetailsProps = {
  inquiry: Inquiry;
  onClose: () => void;
  onStatusUpdated: (inquiry: Inquiry) => void;
};

function isInquiryStatus(value: string): value is InquiryStatus {
  return (
    value === "pending" ||
    value === "confirmed" ||
    value === "cancelled" ||
    value === "completed"
  );
}

function InquiryDetails({
  inquiry,
  onClose,
  onStatusUpdated,
}: InquiryDetailsProps) {
  const [items, setItems] = useState<InquiryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [status, setStatus] = useState<InquiryStatus>(
    inquiry.status
  );

  const [updatingStatus, setUpdatingStatus] =
    useState(false);

  const [statusError, setStatusError] =
    useState<string | null>(null);

  // ─────────────────────────────────────────────
  // LOAD INQUIRY ITEMS
  // ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    async function loadInquiryItems() {
      try {
        setLoading(true);
        setError(null);

        const data = await getInquiryItems(
          inquiry.id
        );

        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        console.error(
          "Unable to load inquiry items:",
          err
        );

        if (!cancelled) {
          setError(
            "Unable to load selected treatment and add-ons."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInquiryItems();

    return () => {
      cancelled = true;
    };
  }, [inquiry.id]);

  // ─────────────────────────────────────────────
  // UPDATE STATUS
  // ─────────────────────────────────────────────

  async function handleStatusChange(
    newStatus: InquiryStatus
  ) {
    if (newStatus === status) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusError(null);

      const updated = await updateInquiryStatus(
        inquiry.id,
        newStatus
      );

      const updatedInquiry = {
        ...inquiry,
        ...updated,
        status: newStatus,
      };

      setStatus(updatedInquiry.status);
      onStatusUpdated(updatedInquiry);
    } catch (err) {
      console.error(
        "Unable to update inquiry status:",
        err
      );

      setStatusError(
        "Unable to update the inquiry status. Please try again."
      );

      // Restore the previous status.
      setStatus(inquiry.status);
    } finally {
      setUpdatingStatus(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div
        className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-details-title"
      >
        {/* ─────────────────────────────────────
            HEADER
        ───────────────────────────────────── */}

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
          {/* ───────────────────────────────────
              PATIENT
          ─────────────────────────────────── */}

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

          {/* ───────────────────────────────────
              APPOINTMENT
          ─────────────────────────────────── */}

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

                <p className="mt-1 font-medium capitalize text-slate-900">
                  {inquiry.preferred_time_slot}
                </p>
              </div>
            </div>
          </section>

          {/* ───────────────────────────────────
              SELECTED ITEMS
          ─────────────────────────────────── */}

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
                  No item information was saved
                  with this inquiry.
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
                          {item.procedure_id
                            ? "Treatment"
                            : "Add-on"}
                        </p>
                      </div>

                      <p className="font-semibold text-slate-900">
                        ₱
                        {Number(
                          item.item_price
                        ).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
          </section>

          {/* ───────────────────────────────────
              TOTAL
          ─────────────────────────────────── */}

          <section className="rounded-xl bg-slate-900 p-5 text-white">
            <div className="flex items-center justify-between gap-4">
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

          {/* ───────────────────────────────────
              STATUS
          ─────────────────────────────────── */}

          <section>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Status
            </h3>

            <select
              value={status}
              disabled={updatingStatus}
              onChange={(event) => {
                const newStatus = event.target.value;

                if (isInquiryStatus(newStatus)) {
                  handleStatusChange(newStatus);
                }
              }}
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium capitalize text-slate-900 outline-none focus:border-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="pending">
                Pending
              </option>

              <option value="confirmed">
                Confirmed
              </option>

              <option value="cancelled">
                Cancelled
              </option>

              <option value="completed">
                Completed
              </option>
            </select>

            {updatingStatus && (
              <p className="mt-2 text-sm text-slate-500">
                Updating status...
              </p>
            )}

            {statusError && (
              <p
                role="alert"
                className="mt-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"
              >
                {statusError}
              </p>
            )}
          </section>

          {/* ───────────────────────────────────
              CREATED / UPDATED
          ─────────────────────────────────── */}

          <section className="border-t pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Created
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {new Date(
                    inquiry.created_at
                  ).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Last updated
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {new Date(
                    inquiry.updated_at
                  ).toLocaleString()}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* ─────────────────────────────────────
            FOOTER
        ───────────────────────────────────── */}

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
