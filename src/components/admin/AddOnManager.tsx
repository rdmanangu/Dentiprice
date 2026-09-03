import { useEffect, useMemo, useState } from "react";
import type { Procedure } from "../../types/procedure";
import {
  deleteAddOn,
  getAllAddOns,
  type AddOn,
} from "../../services/addons";
import { getProcedures } from "../../services/procedures";
import AddOnForm from "./AddOnForm";
import { Badge, Button, ConfirmDialog, DataTable, SectionHeader } from "../ui";
import { formatPrice } from "../../lib/formatPrice";

function isErrorWithMessage(err: unknown): err is { message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof err.message === "string"
  );
}

function AddOnManager() {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAddOn, setEditingAddOn] =
    useState<AddOn | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AddOn | null>(null);
  const [deleting, setDeleting] = useState(false);

  const procedureNameById = useMemo(() => {
    const map = new Map<string, string>();

    procedures.forEach((procedure) => {
      map.set(procedure.id, procedure.name);
    });

    return map;
  }, [procedures]);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [addOnData, procedureData] =
          await Promise.all([getAllAddOns(), getProcedures()]);

        if (!cancelled) {
          setAddOns(addOnData);
          setProcedures(procedureData);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setError("Unable to load add-ons.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(addOn: AddOn) {
    setDeleting(true);

    try {
      setError(null);
      await deleteAddOn(addOn.id);

      setAddOns((current) =>
        current.filter(
          (currentAddOn) => currentAddOn.id !== addOn.id
        )
      );

      setPendingDelete(null);
    } catch (err) {
      console.error(err);
      setError(
        isErrorWithMessage(err)
          ? err.message
          : "Unable to delete add-on."
      );

      setPendingDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section>
      <SectionHeader
        title="Add-ons"
        subtitle="Manage optional extras for each treatment."
        actions={
          <Button
            type="button"
            onClick={() => {
              setEditingAddOn(null);
              setShowForm(true);
            }}
          >
            Add add-on
          </Button>
        }
      />

      {showForm && (
        <div className="mt-6">
          <AddOnForm
            key={editingAddOn?.id ?? "new"}
            procedures={procedures}
            addOn={editingAddOn ?? undefined}
            onSaved={(savedAddOn) => {
              setAddOns((current) =>
                current
                  .map((addOn) =>
                    addOn.id === savedAddOn.id ? savedAddOn : addOn
                  )
                  .concat(
                    current.some(
                      (addOn) => addOn.id === savedAddOn.id
                    )
                      ? []
                      : [savedAddOn]
                  )
                  .sort((a, b) => a.name.localeCompare(b.name))
              );

              setShowForm(false);
              setEditingAddOn(null);
            }}
            onCancel={() => {
              setShowForm(false);
              setEditingAddOn(null);
            }}
          />
        </div>
      )}

      <DataTable
        className="mt-6"
        ariaLabel="Add-ons"
        loading={loading}
        loadingLabel="Loading add-ons..."
        error={error}
        emptyTitle="No add-ons found."
        emptyDescription="Add an optional extra to a treatment to get started."
        rows={addOns}
        getRowId={(addOn) => addOn.id}
        columns={[
          {
            key: "name",
            header: "Name",
            cellClassName: "font-medium text-ink",
            render: (addOn) => addOn.name,
          },
          {
            key: "procedure",
            header: "Procedure",
            render: (addOn) => (
              <span className="text-slate-600">
                {procedureNameById.get(addOn.procedure_id) ??
                  "Unknown procedure"}
              </span>
            ),
          },
          {
            key: "price",
            header: "Price",
            align: "right",
            cellClassName: "font-bold text-primary",
            render: (addOn) => formatPrice(addOn.price),
          },
          {
            key: "duration",
            header: "Duration",
            render: (addOn) => (
              <span className="text-slate-600">
                {addOn.duration_mins != null
                  ? `${addOn.duration_mins} min`
                  : "—"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Status",
            render: (addOn) => (
              <Badge tone={addOn.is_active ? "success" : "neutral"}>
                {addOn.is_active ? "Active" : "Inactive"}
              </Badge>
            ),
          },
          {
            key: "actions",
            header: "Actions",
            render: (addOn) => (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddOn(addOn);
                    setShowForm(true);
                  }}
                  aria-label={`Edit add-on ${addOn.name}`}
                  className="rounded-lg text-sm font-medium text-slate-700 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => setPendingDelete(addOn)}
                  aria-label={`Delete add-on ${addOn.name}`}
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
        title="Delete add-on?"
        description="Are you sure you want to delete this add-on? This action cannot be undone."
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

export default AddOnManager;
