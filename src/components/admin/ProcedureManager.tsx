import { useEffect, useState } from "react";
import type { Procedure } from "../../types/procedure";
import {
  deleteProcedure,
  getProcedures,
} from "../../services/procedures";

import ProcedureForm from "./ProcedureForm";
import { Button, ConfirmDialog, DataTable, SectionHeader } from "../ui";
import { formatPrice } from "../../lib/formatPrice";

function isErrorWithMessage(err: unknown): err is { message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof err.message === "string"
  );
}

function ProcedureManager() {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingProcedure, setEditingProcedure] =
    useState<Procedure | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Procedure | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getProcedures()
      .then((data) => {
        if (!cancelled) {
          setProcedures(data);
        }
      })
      .catch((err) => {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load procedures.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(procedure: Procedure) {
    setDeleting(true);

    try {
      setError(null);
      await deleteProcedure(procedure.id);

      setProcedures((current) =>
        current.filter(
          (currentProcedure) => currentProcedure.id !== procedure.id
        )
      );

      setPendingDelete(null);
    } catch (err) {
      console.error(err);
      setError(
        isErrorWithMessage(err)
          ? err.message
          : "Unable to delete procedure."
      );

      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section>
      <SectionHeader
        title="Procedures"
        subtitle="Manage your clinic's treatments and prices."
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditingProcedure(null);
              setShowForm(true);
            }}
          >
            Add procedure
          </Button>
        }
      />

      {showForm && (
        <div className="mt-6">
          <ProcedureForm
            key={editingProcedure?.id ?? "new"}
            procedure={editingProcedure ?? undefined}
            onSaved={(savedProcedure) => {
              setProcedures((current) =>
                current
                  .map((procedure) =>
                    procedure.id === savedProcedure.id
                      ? savedProcedure
                      : procedure
                  )
                  .concat(
                    current.some(
                      (procedure) =>
                        procedure.id === savedProcedure.id
                    )
                      ? []
                      : [savedProcedure]
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
              );

              setShowForm(false);
              setEditingProcedure(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingProcedure(null);
            }}
          />
        </div>
      )}

      <DataTable
        className="mt-6"
        ariaLabel="Procedures"
        loading={loading}
        loadingLabel="Loading procedures..."
        error={error}
        emptyTitle="No procedures found."
        emptyDescription="Add your first treatment to get started."
        rows={procedures}
        getRowId={(procedure) => procedure.id}
        columns={[
          {
            key: "name",
            header: "Name",
            render: (procedure) => (
              <>
                <p className="font-medium text-ink">{procedure.name}</p>
                <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                  {procedure.description}
                </p>
              </>
            ),
          },
          {
            key: "category",
            header: "Category",
            render: (procedure) => (
              <span className="text-slate-600">{procedure.category}</span>
            ),
          },
          {
            key: "price",
            header: "Price",
            align: "right",
            cellClassName: "font-bold text-primary",
            render: (procedure) => formatPrice(procedure.base_price),
          },
          {
            key: "duration",
            header: "Duration",
            render: (procedure) => (
              <span className="text-slate-600">
                {procedure.estimated_duration_mins != null
                  ? `${procedure.estimated_duration_mins} min`
                  : "—"}
              </span>
            ),
          },
          {
            key: "image",
            header: "Image",
            render: (procedure) =>
              procedure.image_url ? (
                <a
                  href={procedure.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open image for ${procedure.name}`}
                >
                  <img
                    src={procedure.image_url}
                    alt=""
                    className="h-12 w-12 rounded-control border border-border object-cover"
                  />
                </a>
              ) : (
                <span className="text-slate-400">—</span>
              ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (procedure) => (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProcedure(procedure);
                    setShowForm(true);
                  }}
                  aria-label={`Edit procedure ${procedure.name}`}
                  className="rounded-lg text-sm font-medium text-slate-700 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => setPendingDelete(procedure)}
                  aria-label={`Delete procedure ${procedure.name}`}
                  className="rounded-lg text-sm font-medium text-error hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                >
                  Delete
                </button>
              </div>
            ),
          },
        ]}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete procedure?"
        description={`Are you sure you want to delete this procedure? This action cannot be undone.`}
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            handleDelete(pendingDelete);
          }
        }}
      />
    </section>
  );
}

export default ProcedureManager;
