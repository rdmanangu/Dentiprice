import { useCallback, useEffect, useMemo, useState } from "react";
import ProcedureGrid from "../components/procedures/ProcedureGrid";
import ProcedureSearch from "../components/procedures/ProcedureSearch";
import ProcedureFilters from "../components/procedures/ProcedureFilters";
import { getProcedures } from "../services/procedures";
import PriceEstimator from "../components/estimator/PriceEstimator";
import InquiryForm from "../components/inquiries/InquiryForm";
import type { Procedure } from "../types/procedure";


type AddOn = {
  id: string;
  name: string;
  price: number;
};

function Home() {
  // Data & UI state
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("name");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estimator / Inquiry state
  const [selectedProcedure, setSelectedProcedure] = useState<Procedure | null>(null);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [inquiryProcedure, setInquiryProcedure] = useState<Procedure | null>(null);
  const [inquiryAddOns, setInquiryAddOns] = useState<AddOn[]>([]);
  const [inquiryTotal, setInquiryTotal] = useState(0);

  // Load procedures on mount
  useEffect(() => {
    let isMounted = true; // prevent state updates if unmounted

    async function loadProcedures() {
      try {
        const data = await getProcedures();
        if (isMounted) {
          setProcedures(data);
          setError(null); // clear any previous error
        }
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setError("Unable to load treatments.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProcedures();
    return () => {
      isMounted = false;
    };
  }, []);

  // Memoized categories list
  const categories = useMemo(() => {
    return [...new Set(procedures.map((p) => p.category))].sort();
  }, [procedures]);

  // Memoized filtered & sorted procedures
  const filteredProcedures = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const result = procedures.filter((procedure) => {
      const matchesSearch =
        normalizedSearch === "" ||
        procedure.name.toLowerCase().includes(normalizedSearch) ||
        procedure.category.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        category === "all" || procedure.category === category;

      return matchesSearch && matchesCategory;
    });

    return [...result].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.base_price - b.base_price;
        case "price-desc":
          return b.base_price - a.base_price;
        case "duration-asc":
          return a.estimated_duration_mins - b.estimated_duration_mins;
        case "duration-desc":
          return b.estimated_duration_mins - a.estimated_duration_mins;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [procedures, search, category, sort]);

  // Callback for consultation request (memoized)
  const handleRequestConsultation = useCallback(
    (procedure: Procedure, addOns: AddOn[], totalPrice: number) => {
      setInquiryProcedure(procedure);
      setInquiryAddOns(addOns);
      setInquiryTotal(totalPrice);
      setShowInquiryForm(true);
    },
    []
  );

  // Reset inquiry state when the form is closed
  const handleCancelInquiry = useCallback(() => {
    setShowInquiryForm(false);
    // Clear inquiry data to avoid stale values
    setInquiryProcedure(null);
    setInquiryAddOns([]);
    setInquiryTotal(0);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              Dental care made simple
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Find the right dental treatment and estimate your cost.
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-300">
              Explore available treatments, compare prices, and request
              a consultation with our clinic.
            </p>
            <a
              href="#procedures"
              className="mt-8 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-slate-900 hover:bg-slate-100"
            >
              Explore treatments
            </a>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main
        id="procedures"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Our treatments</h2>
          <p className="mt-2 text-slate-600">
            Browse our available dental services.
          </p>
        </div>

        {!loading && !error && (
          <div className="mb-8 space-y-4">
            <ProcedureSearch value={search} onChange={setSearch} />
            <ProcedureFilters
              category={category}
              sort={sort}
              categories={categories}
              onCategoryChange={setCategory}
              onSortChange={setSort}
            />
          </div>
        )}

        {loading && (
          <p className="py-12 text-center text-slate-500">
            Loading treatments...
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700"
          >
            {error}
          </p>
        )}

        {!loading && !error && (
          <>
            {/* Estimator */}
            <div className="mb-8">
              <PriceEstimator
                procedure={selectedProcedure}
                onClear={() => setSelectedProcedure(null)}
                onRequestConsultation={handleRequestConsultation}
              />
            </div>

            {/* Inquiry Form – now rendered as an overlay/modal (if you choose) */}
            {showInquiryForm && inquiryProcedure && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
                  <InquiryForm
                    key={inquiryProcedure.id} // force remount when procedure changes
                    procedure={inquiryProcedure}
                    selectedAddOns={inquiryAddOns}
                    totalPrice={inquiryTotal}
                    onCancel={handleCancelInquiry}
                  />
                </div>
              </div>
            )}

            {/* Results count */}
            <p className="mb-4 text-sm text-slate-500">
              Showing {filteredProcedures.length}{" "}
              {filteredProcedures.length === 1 ? "treatment" : "treatments"}
            </p>

            {/* Grid */}
            <ProcedureGrid
              procedures={filteredProcedures}
              onSelect={setSelectedProcedure}
            />
          </>
        )}
      </main>
    </>
  );
}

export default Home;
