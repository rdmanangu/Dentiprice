import { useEffect, useMemo, useState } from "react";
import type { Procedure } from "../../types/procedure";
import {
  deleteAddOn,
  getAllAddOns,
  type AddOn,
} from "../../services/addons";
import { getProcedures } from "../../services/procedures";
import AddOnForm from "./AddOnForm";
import {
    ErrorAlert,
    LoadingLine,
} from "./primitives";

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
                    await Promise.all([
                        getAllAddOns(),
                        getProcedures(),
                    ]);

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
        const confirmed = window.confirm(
            `Delete the add-on "${addOn.name}"? This cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError(null);
            await deleteAddOn(addOn.id);

            setAddOns((current) =>
                current.filter(
                    (currentAddOn) => currentAddOn.id !== addOn.id
                )
            );
        } catch (err) {
            console.error(err);
            setError(
                isErrorWithMessage(err)
                    ? err.message
                    : "Unable to delete add-on."
            );
        }
    }

    if (loading) {
        return (
            <LoadingLine>
                Loading add-ons...
            </LoadingLine>
        );
    }

    return (
        <section>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-900">
                        Add-ons
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Manage optional extras for each treatment.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => {
                        setEditingAddOn(null);
                        setShowForm(true);
                    }}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                >
                    Add add-on
                </button>
            </div>

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
                                        addOn.id === savedAddOn.id
                                            ? savedAddOn
                                            : addOn
                                    )
                                    .concat(
                                        current.some(
                                            (addOn) =>
                                                addOn.id === savedAddOn.id
                                        )
                                            ? []
                                            : [savedAddOn]
                                    )
                                    .sort((a, b) =>
                                        a.name.localeCompare(b.name)
                                    )
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

            {error && (
                <ErrorAlert className="mt-4">
                    {error}
                </ErrorAlert>
            )}

            {addOns.length === 0 ? (
                <p className="mt-8 rounded-xl bg-white p-6 text-slate-500">
                    No add-ons found.
                </p>
            ) : (
                <div className="mt-6 overflow-hidden rounded-2xl bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="border-b bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-sm font-semibold">
                                        Name
                                    </th>

                                    <th scope="col" className="px-6 py-4 text-sm font-semibold">
                                        Procedure
                                    </th>

                                    <th scope="col" className="px-6 py-4 text-sm font-semibold">
                                        Price
                                    </th>

                                    <th scope="col" className="px-6 py-4 text-sm font-semibold">
                                        Duration
                                    </th>

                                    <th scope="col" className="px-6 py-4 text-sm font-semibold">
                                        Status
                                    </th>

                                    <th scope="col" className="px-6 py-4 text-sm font-semibold">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {addOns.map((addOn) => (
                                    <tr
                                        key={addOn.id}
                                        className="border-b last:border-b-0"
                                    >
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {addOn.name}
                                        </td>

                                        <td className="px-6 py-4 text-slate-600">
                                            {procedureNameById.get(
                                                addOn.procedure_id
                                            ) ?? "Unknown procedure"}
                                        </td>

                                        <td className="px-6 py-4">
                                            ₱
                                            {Number(addOn.price).toLocaleString()}
                                        </td>

                                        <td className="px-6 py-4 text-slate-600">
                                            {addOn.duration_mins != null
                                                ? `${addOn.duration_mins} min`
                                                : "—"}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                                                    addOn.is_active
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-slate-100 text-slate-600"
                                                }`}
                                            >
                                                {addOn.is_active
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingAddOn(addOn);
                                                        setShowForm(true);
                                                    }}
                                                    aria-label={`Edit add-on ${addOn.name}`}
                                                    className="rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(addOn)}
                                                    aria-label={`Delete add-on ${addOn.name}`}
                                                    className="rounded-lg text-sm font-medium text-red-600 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                                                >
                                                    Delete
                                                </button>
                                            </div>
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

export default AddOnManager;
