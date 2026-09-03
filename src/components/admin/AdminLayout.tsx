import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { Button, PageContainer } from "../ui";

const navItems: { label: string; to: string; end?: boolean }[] = [
  { label: "Dashboard", to: "/admin", end: true },
  { label: "Inquiries", to: "/admin/inquiries" },
  { label: "Scheduling", to: "/admin/scheduling" },
];

function AdminLayout() {
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  return (
    <main className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <PageContainer className="flex items-center justify-between py-5">
          <div>
            <h1 className="text-2xl font-bold text-ink">
              Denti<span className="text-primary">Price</span> Admin
            </h1>
            <p className="text-sm text-slate-500">
              Clinic management dashboard
            </p>
          </div>

          <Button type="button" variant="secondary" onClick={handleLogout}>
            Sign out
          </Button>
        </PageContainer>

        <PageContainer>
          <nav
            aria-label="Admin navigation"
            className="flex gap-1 overflow-x-auto pb-0"
          >
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                    isActive
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-600 hover:border-slate-300 hover:text-ink"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </PageContainer>
      </header>

      <PageContainer className="py-10">
        <Outlet />
      </PageContainer>
    </main>
  );
}

export default AdminLayout;
