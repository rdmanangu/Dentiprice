import { useEffect, useState } from "react";
import type { Procedure } from "../../types/procedure";
import {
    deleteProcedure,
    getProcedures,
} from "../../services/procedures";

import ProcedureForm from "./ProcedureForm";
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

function ProcedureManager() {
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingProcedure, setEditingProcedure] =
        useState<Procedure | null>(null);

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
        const confirmed = window.confirm(
            `Delete the procedure "${procedure.name}"? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setError(null);
            await deleteProcedure(procedure.id);

            setProcedures((current) =>
                current.filter(
                    (currentProcedure) => currentProcedure.id !== procedure.id
                )
            );
        } catch (err) {
            console.error(err);
            setError(
                isErrorWithMessage(err)
                    ? err.message
                    : "Unable to delete procedure."
            );
        }
    }

    if (loading) {
        return (
            <LoadingLine>
                Loading procedures...
            </LoadingLine>
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

                <button
                    type="button"
                    onClick={() => {
                        setEditingProcedure(null);
                        setShowForm(true);
                    }}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                >
                    Add procedure
                </button>
            </div>

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
                                    .sort((a, b) =>
                                        a.name.localeCompare(b.name)
                                    )
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

            {error && (
                <ErrorAlert className="mt-4">
                    {error}
                </ErrorAlert>
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
                                    <th scope="col" className="px-6 py-4 text-sm font-semibold">
                                        Name
                                    </th>

                                    <th scope="col" className="px-6 py-4 text-sm font-semibold">
                                        Category
                                    </th>

                                    <th scope="col" className="px-6 py-4 text-sm font-semibold">
                                        Price
                                    </th>

                                    <th scope="col" className="px-6 py-4 text-sm font-semibold">
                                        Duration
                                    </th>

                                    <th scope="col" className="px-6 py-4 text-sm font-semibold">
                                        Image
                                    </th>

                                    <th scope="col" className="px-6 py-4 text-sm font-semibold">
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
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900">
                                                {procedure.name}
                                            </p>

                                            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                                                {procedure.description}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4 text-slate-600">
                                            {procedure.category}
                                        </td>

                                        <td className="px-6 py-4">
                                            ₱
                                            {Number(
                                                procedure.base_price ?? 0
                                            ).toLocaleString()}
                                        </td>

                                        <td className="px-6 py-4 text-slate-600">
                                            {procedure.estimated_duration_mins !=
                                            null
                                                ? `${procedure.estimated_duration_mins} min`
                                                : "—"}
                                        </td>

                                        <td className="px-6 py-4">
                                            {procedure.image_url ? (
                                                <a
                                                    href={procedure.image_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    aria-label={`Open image for ${procedure.name}`}
                                                >
                                                    <img
                                                        src={procedure.image_url}
                                                        alt=""
                                                        className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                                                    />
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">
                                                    —
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingProcedure(procedure);
                                                        setShowForm(true);
                                                    }}
                                                    aria-label={`Edit procedure ${procedure.name}`}
                                                    className="rounded-lg text-sm font-medium text-slate-700 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(procedure)}
                                                    aria-label={`Delete procedure ${procedure.name}`}
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

export default ProcedureManager;
