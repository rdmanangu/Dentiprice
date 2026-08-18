import { useEffect, useState } from "react";
import ProcedureGrid from "../components/procedures/ProcedureGrid";
import { getProcedures } from "../services/procedures";

type Procedure = {
  id: string;
  name: string;
  category: string;
  description: string;
  base_price: number;
  estimated_duration_mins: number;
  image_url: string | null;
};

function Home() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProcedures() {
      try {
        const data = await getProcedures();
        setProcedures(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load treatments.");
      } finally {
        setLoading(false);
      }
    }

    loadProcedures();
  }, []);

  return (
    <>
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
              Explore available treatments, compare prices, and request a
              consultation with our clinic.
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

      <main
        id="procedures"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">
            Our treatments
          </h2>

          <p className="mt-2 text-slate-600">
            Browse our available dental services.
          </p>
        </div>

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
          <ProcedureGrid procedures={procedures} />
        )}
      </main>
    </>
  );
}

export default Home;