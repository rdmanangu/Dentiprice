import { useState } from "react";
import type { Procedure } from "../../types/procedure";
import {
  createAddOn,
  updateAddOn,
  type AddOn,
} from "../../services/addons";
import { Button, Card, Field, Input, Select } from "../ui";
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

    if (!Number.isFinite(parsedDuration) || parsedDuration <= 0) {
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
    <Card>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-ink">
          {addOn ? "Edit add-on" : "Add add-on"}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {addOn
            ? "Update this optional extra."
            : "Add a new optional extra to a treatment."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Add-on name" htmlFor="add-on-name" required>
          <Input
            id="add-on-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Teeth whitening boost"
          />
        </Field>

        <Field label="Procedure" htmlFor="add-on-procedure" required>
          <Select
            id="add-on-procedure"
            value={procedureId}
            onChange={(event) => setProcedureId(event.target.value)}
            required
          >
            <option value="">Select a procedure…</option>

            {procedures.map((procedure) => (
              <option key={procedure.id} value={procedure.id}>
                {procedure.name}
              </option>
            ))}
          </Select>

          {procedures.length === 0 && (
            <p className="mt-2 text-sm font-medium text-error">
              Create a procedure first — add-ons must be linked to one.
            </p>
          )}
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Price (₱)" htmlFor="add-on-price" required>
            <Input
              id="add-on-price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
              placeholder="500"
            />
          </Field>

          <Field label="Duration (minutes)" htmlFor="add-on-duration" required>
            <Input
              id="add-on-duration"
              type="number"
              min="1"
              step="1"
              value={durationMins}
              onChange={(event) => setDurationMins(event.target.value)}
              required
              placeholder="15"
            />
          </Field>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="add-on-active"
            type="checkbox"
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />

          <label
            htmlFor="add-on-active"
            className="text-sm font-medium text-slate-700"
          >
            Active (visible to patients in the price estimator)
          </label>
        </div>

        {error && <ErrorAlert>{error}</ErrorAlert>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading || procedures.length === 0}>
            {loading
              ? "Saving..."
              : addOn
                ? "Save changes"
                : "Create add-on"}
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default AddOnForm;
