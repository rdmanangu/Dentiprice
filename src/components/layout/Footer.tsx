function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-lg font-bold tracking-tight text-primary">
            Denti<span className="text-cta">Price</span>
          </p>

          <p className="text-sm text-slate-600">
            Estimates are for reference only. Final pricing is
            confirmed with the clinic.
          </p>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} DentiPrice. All rights
          reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;