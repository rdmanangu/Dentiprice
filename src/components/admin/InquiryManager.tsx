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
import { ConfirmDialog, DataTable, SectionHeader } from "../ui";
import { formatPrice } from "../../lib/formatPrice";

type InquiryFilter = "all" | InquiryStatus;

const inquiryStatusControlClasses: Record<
  InquiryStatus,
  string
> = {
  pending: "border border-warning-border bg-warning-bg text-warning",
  confirmed: "border border-info-border bg-info-bg text-info",
  cancelled: "border border-border bg-slate-100 text-slate-600",
  completed: "border border-success-border bg-success-bg text-success",
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
  onInquiriesChange?: (inquiries: Inquiry[]) => void;
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
  const [pendingDelete, setPendingDelete] = useState<Inquiry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredInquiries = inquiries.filter(
    (inquiry) =>
      activeFilter === "all" || inquiry.status === activeFilter
  );

  useEffect(() => {
    onInquiriesChange?.(inquiries);
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
      const updated = await updateInquiryStatus(id, status);

      setInquiries((current) =>
        current.map((inquiry) =>
          inquiry.id === updated.id ? updated : inquiry
        )
      );
    } catch (err) {
      console.error(err);
      setError("Unable to update inquiry status.");
    }
  }

  async function handleDelete(inquiry: Inquiry) {
    setDeleting(true);

    try {
      setError(null);
      await deleteInquiry(inquiry.id);

      setInquiries((current) =>
        current.filter(
          (currentInquiry) => currentInquiry.id !== inquiry.id
        )
      );

      setPendingDelete(null);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete inquiry."
      );

      setPendingDelete(null);
    } finally {
      setDeleting(false);
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

  return (
    <section className="mt-12">
      <SectionHeader
        title="Consultation inquiries"
        subtitle="Manage consultation requests from patients."
      />

      <p className="mt-2 text-sm text-slate-500" aria-live="polite">
        {filteredInquiries.length}{" "}
        {filteredInquiries.length === 1 ? "inquiry" : "inquiries"}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {inquiryFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setActiveFilter(filter.value)}
            aria-pressed={activeFilter === filter.value}
            className={`rounded-control px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              activeFilter === filter.value
                ? "bg-primary text-white"
                : "bg-surface text-slate-700 hover:bg-bg border border-border"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <DataTable
        className="mt-6"
        ariaLabel="Consultation inquiries"
        loading={loading}
        loadingLabel="Loading inquiries..."
        error={error}
        emptyTitle="No inquiries found."
        emptyDescription={
          activeFilter === "all"
            ? "Consultation requests will appear here."
            : "No inquiries are currently in this status."
        }
        rows={filteredInquiries}
        getRowId={(inquiry) => inquiry.id}
        columns={[
          {
            key: "patient",
            header: "Patient",
            render: (inquiry) => (
              <>
                <p className="font-medium text-ink">{inquiry.patient_name}</p>
                <p className="text-xs text-slate-500">{inquiry.id}</p>
              </>
            ),
          },
          {
            key: "contact",
            header: "Contact",
            render: (inquiry) => (
              <>
                <p className="text-sm">{inquiry.phone}</p>
                <p className="text-sm text-slate-500">{inquiry.email}</p>
              </>
            ),
          },
          {
            key: "date",
            header: "Date",
            render: (inquiry) => (
              <span className="text-sm">{inquiry.preferred_date}</span>
            ),
          },
          {
            key: "time",
            header: "Time",
            render: (inquiry) => (
              <span className="text-sm capitalize">
                {inquiry.preferred_time_slot}
              </span>
            ),
          },
          {
            key: "total",
            header: "Total",
            align: "right",
            cellClassName: "font-bold text-primary",
            render: (inquiry) => formatPrice(inquiry.calculated_total_price),
          },
          {
            key: "status",
            header: "Status",
            render: (inquiry) => (
              <select
                value={inquiry.status}
                onChange={(event) => {
                  const status = event.target.value;

                  if (isInquiryStatus(status)) {
                    handleStatusChange(inquiry.id, status);
                  }
                }}
                aria-label={`Change status for inquiry from ${inquiry.patient_name}`}
                className={`rounded-control px-3 py-2 text-sm font-medium capitalize focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${inquiryStatusControlClasses[inquiry.status]}`}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (inquiry) => (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedInquiry(inquiry)}
                  aria-label={`View details for inquiry from ${inquiry.patient_name}`}
                  className="rounded-lg text-sm font-medium text-slate-900 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  View
                </button>

                <button
                  type="button"
                  onClick={() => setPendingDelete(inquiry)}
                  aria-label={`Delete inquiry from ${inquiry.patient_name}`}
                  className="rounded-lg text-sm font-medium text-error hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />

      {selectedInquiry && (
        <InquiryDetails
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onStatusUpdated={handleDetailsStatusUpdated}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete inquiry?"
        description="Are you sure you want to delete this inquiry? This action cannot be undone."
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            handleDelete(pendingDelete);
          }
        }}
      />
    </section>
  );
}

export default InquiryManager;
