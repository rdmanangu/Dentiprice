import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function AdminDashboard() {
  const navigate = useNavigate();

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
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Sign out
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Dashboard
        </h2>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">
              Procedures
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Manage dental treatments and prices.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-slate-900">
              Inquiries
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Review consultation requests.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export default AdminDashboard;