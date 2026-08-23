import { useState } from "react";
import type { Procedure } from "../../types/procedure";
import {
  createAddOn,
  updateAddOn,
  type AddOn,
} from "../../services/addons";
import { ErrorAlert } from "./primitives";

type AddOnFormProps = {
  procedures: Procedure[];
  addOn?: AddOn;
  onSaved: (addOn: AddOn) => void;
  onCancel: () => void;
};

function isErrorWithMessage(err: unknown): err is { message: string } {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof err.message === "string"
  );
}

function AddOnForm({
  procedures,
  addOn,
  onSaved,
  onCancel,
}: AddOnFormProps) {
  const [name, setName] = useState(addOn?.name ?? "");
  const [procedureId, setProcedureId] = useState(
    addOn?.procedure_id ?? ""
  );
  const [price, setPrice] = useState(
    addOn ? String(addOn.price) : ""
  );
  const [durationMins, setDurationMins] = useState(
    addOn ? String(addOn.duration_mins) : ""
  );
  const [isActive, setIsActive] = useState(
    addOn?.is_active ?? true
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    const parsedPrice = Number(price);
    const parsedDuration = Number(durationMins);

    if (!name.trim()) {
      setError("Add-on name is required.");
      return;
    }

    if (!procedureId) {
      setError("Select the procedure this add-on belongs to.");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Enter a valid price.");
      return;
    }

    if (
      !Number.isFinite(parsedDuration) ||
      parsedDuration <= 0
    ) {
      setError("Enter a valid duration.");
      return;
    }

    try {
      setLoading(true);

      let savedAddOn: AddOn;

      if (addOn) {
        savedAddOn = await updateAddOn(addOn.id, {
          procedure_id: procedureId,
          name: name.trim(),
          price: parsedPrice,
          duration_mins: parsedDuration,
          is_active: isActive,
        });
      } else {
        savedAddOn = await createAddOn({
          procedure_id: procedureId,
          name: name.trim(),
          price: parsedPrice,
          duration_mins: parsedDuration,
          is_active: isActive,
        });
      }

      onSaved(savedAddOn);
    } catch (err) {
      console.error(err);
      setError(
        isErrorWithMessage(err)
          ? err.message
          : addOn
            ? "Unable to update add-on."
            : "Unable to create add-on."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">
          {addOn ? "Edit add-on" : "Add add-on"}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {addOn
            ? "Update this optional extra."
            : "Add a new optional extra to a treatment."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="add-on-name"
            className="block text-sm font-medium text-slate-700"
          >
            Add-on name
          </label>

          <input
            id="add-on-name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Teeth whitening boost"
          />
        </div>

        <div>
          <label
            htmlFor="add-on-procedure"
            className="block text-sm font-medium text-slate-700"
          >
            Procedure
          </label>

          <select
            id="add-on-procedure"
            value={procedureId}
            onChange={(event) =>
              setProcedureId(event.target.value)
            }
            required
            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
          >
            <option value="">
              Select a procedure…
            </option>

            {procedures.map((procedure) => (
              <option
                key={procedure.id}
                value={procedure.id}
              >
                {procedure.name}
              </option>
            ))}
          </select>

          {procedures.length === 0 && (
            <p className="mt-2 text-sm text-red-700">
              Create a procedure first — add-ons must be linked to one.
            </p>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="add-on-price"
              className="block text-sm font-medium text-slate-700"
            >
              Price (₱)
            </label>

            <input
              id="add-on-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) =>
                setPrice(event.target.value)
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="500"
            />
          </div>

          <div>
            <label
              htmlFor="add-on-duration"
              className="block text-sm font-medium text-slate-700"
            >
              Duration (minutes)
            </label>

            <input
              id="add-on-duration"
              type="number"
              min="1"
              step="1"
              value={durationMins}
              onChange={(event) =>
                setDurationMins(event.target.value)
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="15"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="add-on-active"
            type="checkbox"
            checked={isActive}
            onChange={(event) =>
              setIsActive(event.target.checked)
            }
            className="h-4 w-4 rounded border-slate-300"
          />

          <label
            htmlFor="add-on-active"
            className="text-sm font-medium text-slate-700"
          >
            Active (visible to patients in the price estimator)
          </label>
        </div>

        {error && (
          <ErrorAlert>{error}</ErrorAlert>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading || procedures.length === 0}
            className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            {loading
              ? "Saving..."
              : addOn
                ? "Save changes"
                : "Create add-on"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddOnForm;
