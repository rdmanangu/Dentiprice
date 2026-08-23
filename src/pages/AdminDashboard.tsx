import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ProcedureManager from "../components/admin/ProcedureManager";
import AddOnManager from "../components/admin/AddOnManager";
import InquiryManager from "../components/admin/InquiryManager";
import type { Inquiry, InquiryStatus } from "../types/inquiry";

function AdminDashboard() {
  const navigate = useNavigate();
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

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Dentiprice Admin
            </h1>

            <p className="text-sm text-slate-500">
              Clinic management dashboard
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Dashboard
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Total inquiries
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {inquiries.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Pending inquiries
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {inquiryCounts.pending}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Confirmed inquiries
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {inquiryCounts.confirmed}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Completed inquiries
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {inquiryCounts.completed}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <ProcedureManager />

          <AddOnManager />

          <InquiryManager onInquiriesChange={setInquiries} />
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;
