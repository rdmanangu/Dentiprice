import { useEffect, useState } from "react";
import type {
  Inquiry,
  InquiryStatus,
} from "../../types/inquiry";
import {
  deleteInquiry,
  getInquiries,
  updateInquiryStatus,
} from "../../services/inquiries";
import InquiryDetails from "./InquiryDetails";
import {
  ErrorAlert,
  LoadingLine,
} from "./primitives";

type InquiryFilter = "all" | InquiryStatus;

const inquiryStatusControlClasses: Record<
  InquiryStatus,
  string
> = {
  pending: "border-amber-300 bg-amber-50 text-amber-900",
  confirmed: "border-emerald-300 bg-emerald-50 text-emerald-900",
  cancelled: "border-slate-300 bg-slate-100 text-slate-700",
  completed: "border-sky-300 bg-sky-50 text-sky-900",
};

const inquiryFilters: {
  label: string;
  value: InquiryFilter;
}[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Completed", value: "completed" },
];

function isInquiryStatus(value: string): value is InquiryStatus {
  return (
    value === "pending" ||
    value === "confirmed" ||
    value === "cancelled" ||
    value === "completed"
  );
}

type InquiryManagerProps = {
  onInquiriesChange: (inquiries: Inquiry[]) => void;
};

function InquiryManager({
  onInquiriesChange,
}: InquiryManagerProps) {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [activeFilter, setActiveFilter] =
    useState<InquiryFilter>("all");

  const filteredInquiries = inquiries.filter(
    (inquiry) =>
      activeFilter === "all" || inquiry.status === activeFilter
  );

  useEffect(() => {
    onInquiriesChange(inquiries);
  }, [inquiries, onInquiriesChange]);

  useEffect(() => {
    let cancelled = false;

    getInquiries()
      .then((data) => {
        if (!cancelled) {
          setInquiries(data);
        }
      })
      .catch((err) => {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load inquiries.");
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
  }, []);

  async function handleStatusChange(
    id: string,
    status: InquiryStatus
  ) {
    try {
      setError(null);
      const updated = await updateInquiryStatus(
        id,
        status
      );

      setInquiries((current) =>
        current.map((inquiry) =>
          inquiry.id === updated.id
            ? updated
            : inquiry
        )
      );
    } catch (err) {
      console.error(err);
      setError("Unable to update inquiry status.");
    }
  }

  async function handleDelete(inquiry: Inquiry) {
    const confirmed = window.confirm(
      `Delete the consultation request from ${inquiry.patient_name}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await deleteInquiry(inquiry.id);

      setInquiries((current) =>
        current.filter(
          (currentInquiry) => currentInquiry.id !== inquiry.id
        )
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete inquiry."
      );
    }
  }

  function handleDetailsStatusUpdated(updated: Inquiry) {
    setInquiries((current) =>
      current.map((inquiry) =>
        inquiry.id === updated.id ? updated : inquiry
      )
    );

    setSelectedInquiry((current) =>
      current?.id === updated.id ? updated : current
    );
  }

  if (loading) {
    return (
      <LoadingLine>
        Loading inquiries...
      </LoadingLine>
    );
  }

  return (
    <section className="mt-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          Consultation inquiries
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Manage consultation requests from patients.
        </p>

        <p className="mt-2 text-sm text-slate-500">
          {filteredInquiries.length} {filteredInquiries.length === 1 ? "inquiry" : "inquiries"}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {inquiryFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
              activeFilter === filter.value
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-700 hover:bg-slate-100"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && (
        <ErrorAlert className="mt-4">
          {error}
        </ErrorAlert>
      )}

      {filteredInquiries.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-500">
          No inquiries found for this status.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-sm font-semibold">
                    Patient
                  </th>

                  <th scope="col" className="px-6 py-4 text-sm font-semibold">
                    Contact
                  </th>

                  <th scope="col" className="px-6 py-4 text-sm font-semibold">
                    Date
                  </th>

                  <th scope="col" className="px-6 py-4 text-sm font-semibold">
                    Time
                  </th>

                  <th scope="col" className="px-6 py-4 text-sm font-semibold">
                    Total
                  </th>

                  <th scope="col" className="px-6 py-4 text-sm font-semibold">
                    Status
                  </th>

                  <th scope="col" className="px-6 py-4 text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredInquiries.map((inquiry) => (
                  <tr
                    key={inquiry.id}
                    className="border-b last:border-b-0"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-900">
                        {inquiry.patient_name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {inquiry.id}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm">
                        {inquiry.phone}
                      </p>

                      <p className="text-sm text-slate-500">
                        {inquiry.email}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {inquiry.preferred_date}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {inquiry.preferred_time_slot}
                    </td>

                    <td className="px-6 py-4 font-medium">
                      ₱
                      {Number(
                        inquiry.calculated_total_price ?? 0
                      ).toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={inquiry.status}
                        onChange={(event) => {
                          const status = event.target.value;

                          if (isInquiryStatus(status)) {
                            handleStatusChange(inquiry.id, status);
                          }
                        }}
                        aria-label={`Change status for inquiry from ${inquiry.patient_name}`}
                        className={`rounded-lg px-3 py-2 text-sm ${inquiryStatusControlClasses[inquiry.status]}`}
                      >
                        <option value="pending">
                          Pending
                        </option>

                        <option value="confirmed">
                          Confirmed
                        </option>

                        <option value="completed">
                          Completed
                        </option>

                        <option value="cancelled">
                          Cancelled
                        </option>
                      </select>
                    </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedInquiry(inquiry)}
                            aria-label={`View details for inquiry from ${inquiry.patient_name}`}
                            className="rounded-lg text-sm font-medium text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                          >
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(inquiry)}
                            aria-label={`Delete inquiry from ${inquiry.patient_name}`}
                            className="rounded-lg text-sm font-medium text-red-600 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {selectedInquiry && (
        <InquiryDetails
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onStatusUpdated={handleDetailsStatusUpdated}
        />
      )}
    </section>
  );
}

export default InquiryManager;
