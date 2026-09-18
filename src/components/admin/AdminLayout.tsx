import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { PageContainer } from "../ui";
import {
  IconDashboard,
  IconInquiries,
  IconCalendar,
  IconPatients,
  IconTreatments,
  IconLogout,
  IconMenu,
  LogoIcon,
} from "./icons";

export type NavItemIcon = (props: {
  className?: string;
}) => React.JSX.Element;

// ─────────────────────────────────────────────
// NAVIGATION ITEMS
// ─────────────────────────────────────────────

const navItems: {
  label: string;
  to: string;
  end?: boolean;
  icon: NavItemIcon;
}[] = [
  { label: "Dashboard", to: "/admin", end: true, icon: IconDashboard },
  { label: "Inquiries", to: "/admin/inquiries", icon: IconInquiries },
  { label: "Appointments", to: "/admin/scheduling", icon: IconCalendar },
  { label: "Patients", to: "/admin/patients", icon: IconPatients },
  {
    label: "Treatments & Add-ons",
    to: "/admin/treatments",
    icon: IconTreatments,
  },
];

// ─────────────────────────────────────────────
// SIDEBAR CONTENT
// Shared by the desktop (fixed) and mobile
// (overlay) sidebars.
// ─────────────────────────────────────────────

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      navigate("/admin/login");
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 pb-6 pt-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-cta text-white">
          <LogoIcon className="h-6 w-6" />
        </div>
        <div className="leading-tight">
          <p className="text-lg font-bold text-white">
            Denti<span className="text-[#f2a9bd]">Price</span>
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-text">
            Admin Panel
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav aria-label="Admin navigation" className="flex-1 px-3">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-sidebar-text">
          Menu
        </p>
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-control px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta ${
                      isActive
                        ? "bg-sidebar-active-bg text-sidebar-text-active"
                        : "text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active"
                    }`
                  }
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Admin user */}
      <div className="border-t border-sidebar-border px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-cta text-sm font-bold text-white">
            DR
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-text-active">
              Dr. Reyes
            </p>
            <p className="text-xs text-sidebar-text">Administrator</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-control border border-white/15 px-3 py-2 text-sm font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-sidebar-text-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta"
        >
          <IconLogout className="h-4 w-4" />
          Log out
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN LAYOUT
// ─────────────────────────────────────────────

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <main className="min-h-screen bg-bg">
      {/* Desktop sidebar (fixed) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] overflow-y-auto bg-sidebar lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-[260px] overflow-y-auto bg-sidebar shadow-xl lg:hidden">
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex min-h-screen w-full min-w-0 flex-col lg:pl-[260px]">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-control border border-border text-ink transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Open navigation menu"
          >
            <IconMenu className="h-5 w-5" />
          </button>
          <p className="text-sm font-bold text-ink">
            Denti<span className="text-primary">Price</span> Admin
          </p>
          <span className="w-10" aria-hidden="true" />
        </header>

        <PageContainer className="flex-1 py-6 lg:py-8">
          <Outlet />
        </PageContainer>
      </div>
    </main>
  );
}

export default AdminLayout;