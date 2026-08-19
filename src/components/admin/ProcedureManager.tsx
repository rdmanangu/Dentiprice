import { useEffect, useState } from "react";
import type { Procedure } from "../../types/procedure";
import {
  deleteProcedure,
  getProcedures,
} from "../../services/procedures";

import ProcedureForm from "./ProcedureForm";

function ProcedureManager() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function loadProcedures() {
    try {
      setLoading(true);
      setError(null);

      const data = await getProcedures();
      setProcedures(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load procedures.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProcedures();
  }, []);

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this procedure?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProcedure(id);

      setProcedures((current) =>
        current.filter((procedure) => procedure.id !== id)
      );
    } catch (err) {
      console.error(err);
      setError("Unable to delete procedure.");
    }
  }

  if (loading) {
    return (
      <p className="text-slate-500">
        Loading procedures...
      </p>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Procedures
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage your clinic's treatments and prices.
          </p>
        </div>

        {showForm && (
        <div className="mt-6">
            <ProcedureForm
            onCreated={(procedure) => {
                setProcedures((current) =>
                [...current, procedure].sort((a, b) =>
                    a.name.localeCompare(b.name)
                )
                );

                setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
            />
        </div>
        )}
        
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
        >
          Add procedure
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {procedures.length === 0 ? (
        <p className="mt-8 rounded-xl bg-white p-6 text-slate-500">
          No procedures found.
        </p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b bg-slate-50">
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold">
                    Name
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Category
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Price
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Duration
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {procedures.map((procedure) => (
                  <tr
                    key={procedure.id}
                    className="border-b last:border-b-0"
                  >
                    <td className="px-6 py-4 font-medium">
                      {procedure.name}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {procedure.category}
                    </td>

                    <td className="px-6 py-4">
                      ₱
                      {procedure.base_price.toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {procedure.estimated_duration_mins} min
                    </td>

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(procedure.id)
                        }
                        className="text-sm font-medium text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProcedureManager;