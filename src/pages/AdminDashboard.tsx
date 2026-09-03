import { useState, useEffect } from "react";
import ProcedureManager from "../components/admin/ProcedureManager";
import AddOnManager from "../components/admin/AddOnManager";
import { Card, SectionHeader } from "../components/ui";
import type { Inquiry, InquiryStatus } from "../types/inquiry";
import { getInquiries } from "../services/inquiries";

const statCards: {
  label: string;
  key: InquiryStatus | "total";
}[] = [
  { label: "Total inquiries", key: "total" },
  { label: "Pending inquiries", key: "pending" },
  { label: "Confirmed inquiries", key: "confirmed" },
  { label: "Completed inquiries", key: "completed" },
];

function AdminDashboard() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);

  const inquiryCounts: Record<InquiryStatus, number> = {
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
  };

  inquiries.forEach((inquiry) => {
    if (inquiry.status in inquiryCounts) {
      inquiryCounts[inquiry.status] += 1;
    }
  });

  const total = inquiries.length;

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
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Dashboard"
        subtitle="Overview of your clinic's consultation requests."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const value =
            stat.key === "total"
              ? total
              : inquiryCounts[stat.key as InquiryStatus];

          return (
            <Card key={stat.label} className="p-6">
              <p className="text-sm font-medium text-slate-500">
                {stat.label}
              </p>

              <p className="mt-2 text-3xl font-bold text-ink">
                {value}
              </p>
            </Card>
          );
        })}
      </div>

      <div className="space-y-6">
        <ProcedureManager />

        <AddOnManager />
      </div>
    </div>
  );
}

export default AdminDashboard;
