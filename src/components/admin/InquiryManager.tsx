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

function InquiryManager() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this inquiry?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);
      await deleteInquiry(id);

      setInquiries((current) =>
        current.filter((inquiry) => inquiry.id !== id)
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

  if (loading) {
    return (
      <p className="text-slate-500">
        Loading inquiries...
      </p>
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
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {inquiries.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white p-6 text-slate-500">
          No inquiries found.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold">
                    Patient
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Contact
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Date
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Time
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Total
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Status
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {inquiries.map((inquiry) => (
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
                      {inquiry.calculated_total_price.toLocaleString()}
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={inquiry.status}
                        onChange={(event) =>
                          handleStatusChange(
                            inquiry.id,
                            event.target
                              .value as InquiryStatus
                          )
                        }
                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      >
                        <option value="pending">
                          Pending
                        </option>

                        <option value="new">
                          New
                        </option>

                        <option value="contacted">
                          Contacted
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
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(inquiry.id)
                        }
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default InquiryManager;
