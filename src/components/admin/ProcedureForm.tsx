import { useState } from "react";
import type { Procedure } from "../../types/procedure";
import {
  createProcedure,
  updateProcedure,
} from "../../services/procedures";
import { Button, Card, Field, Input, Textarea } from "../ui";
import { ErrorAlert } from "./primitives";

type ProcedureFormProps = {
  procedure?: Procedure;
  onSaved: (procedure: Procedure) => void;
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

function ProcedureForm({
  procedure,
  onSaved,
  onCancel,
}: ProcedureFormProps) {
  const [name, setName] = useState(procedure?.name ?? "");
  const [category, setCategory] = useState(
    procedure?.category ?? ""
  );
  const [description, setDescription] = useState(
    procedure?.description ?? ""
  );
  const [basePrice, setBasePrice] = useState(
    procedure ? String(procedure.base_price) : ""
  );
  const [duration, setDuration] = useState(
    procedure ? String(procedure.estimated_duration_mins) : ""
  );
  const [imageUrl, setImageUrl] = useState(
    procedure?.image_url ?? ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError(null);

    const price = Number(basePrice);
    const durationMins = Number(duration);

    if (!name.trim()) {
      setError("Procedure name is required.");
      return;
    }

    if (!category.trim()) {
      setError("Category is required.");
      return;
    }

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Enter a valid price.");
      return;
    }

    if (!Number.isFinite(durationMins) || durationMins <= 0) {
      setError("Enter a valid duration.");
      return;
    }

    try {
      setLoading(true);

      let savedProcedure: Procedure;

      if (procedure) {
        savedProcedure = await updateProcedure(procedure.id, {
          name: name.trim(),
          category: category.trim(),
          description: description.trim(),
          base_price: price,
          estimated_duration_mins: durationMins,
          image_url: imageUrl.trim() || null,
        });
      } else {
        savedProcedure = await createProcedure({
          name: name.trim(),
          category: category.trim(),
          description: description.trim(),
          base_price: price,
          estimated_duration_mins: durationMins,
          image_url: imageUrl.trim() || null,
        });
      }

      onSaved(savedProcedure);
    } catch (err) {
      console.error(err);
      setError(
        isErrorWithMessage(err)
          ? err.message
          : procedure
            ? "Unable to update procedure."
            : "Unable to create procedure."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-ink">
          {procedure ? "Edit procedure" : "Add procedure"}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {procedure
            ? "Update this treatment."
            : "Add a new treatment to the Dentiprice menu."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Procedure name" htmlFor="procedure-name" required>
          <Input
            id="procedure-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            placeholder="Dental Cleaning"
          />
        </Field>

        <Field label="Category" htmlFor="procedure-category" required>
          <Input
            id="procedure-category"
            type="text"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
            placeholder="Preventive"
          />
        </Field>

        <Field label="Description" htmlFor="procedure-description" required>
          <Textarea
            id="procedure-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            required
            rows={4}
            placeholder="Describe the treatment..."
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Base price (₱)" htmlFor="procedure-price" required>
            <Input
              id="procedure-price"
              type="number"
              min="0"
              step="0.01"
              value={basePrice}
              onChange={(event) => setBasePrice(event.target.value)}
              required
              placeholder="1500"
            />
          </Field>

          <Field label="Duration (minutes)" htmlFor="procedure-duration" required>
            <Input
              id="procedure-duration"
              type="number"
              min="1"
              step="1"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              required
              placeholder="60"
            />
          </Field>
        </div>

        <Field label="Image URL" htmlFor="procedure-image">
          <Input
            id="procedure-image"
            type="url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://..."
          />
        </Field>

        {error && <ErrorAlert>{error}</ErrorAlert>}

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading
              ? "Saving..."
              : procedure
                ? "Save changes"
                : "Create procedure"}
          </Button>

          <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default ProcedureForm;
