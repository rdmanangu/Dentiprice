function Header() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="text-xl font-bold tracking-tight text-slate-900"
        >
          Dentiprice
        </a>

        <nav aria-label="Main navigation">
          <a
            href="#procedures"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Treatments
          </a>
        </nav>
      </div>
    </header>
  );
}

export default Header;