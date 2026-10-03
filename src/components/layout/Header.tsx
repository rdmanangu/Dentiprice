import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-lg text-xl font-bold tracking-tight text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <img src="/src/assets/icon.png" alt="" className="h-6 w-6 shrink-0" />
          <span>
            Denti<span className="text-cta">Price</span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-2">
          <a
            href="#procedures"
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-bg hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Treatments
          </a>

          <Link
            to="/admin/login"
            className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-bg hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Admin Login
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
