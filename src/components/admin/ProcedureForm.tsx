import { useState } from "react";
import type { Procedure } from "../../types/procedure";
import {
  createProcedure,
  updateProcedure,
} from "../../services/procedures";

type ProcedureFormProps = {
  procedure?: Procedure;
  onSaved: (procedure: Procedure) => void;
  onCancel: () => void;
};

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
    procedure
      ? String(procedure.estimated_duration_mins)
      : ""
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

    if (
      !Number.isFinite(durationMins) ||
      durationMins <= 0
    ) {
      setError("Enter a valid duration.");
      return;
    }

    try {
      setLoading(true);

      let savedProcedure: Procedure;

      if (procedure) {
        savedProcedure = await updateProcedure(
          procedure.id,
          {
            name: name.trim(),
            category: category.trim(),
            description: description.trim(),
            base_price: price,
            estimated_duration_mins: durationMins,
            image_url: imageUrl.trim() || null,
          }
        );
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
        procedure
          ? "Unable to update procedure."
          : "Unable to create procedure."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-900">
          {procedure ? "Edit procedure" : "Add procedure"}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {procedure
            ? "Update this treatment."
            : "Add a new treatment to the Dentiprice menu."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="procedure-name"
            className="block text-sm font-medium text-slate-700"
          >
            Procedure name
          </label>

          <input
            id="procedure-name"
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Dental Cleaning"
          />
        </div>

        <div>
          <label
            htmlFor="procedure-category"
            className="block text-sm font-medium text-slate-700"
          >
            Category
          </label>

          <input
            id="procedure-category"
            type="text"
            value={category}
            onChange={(event) =>
              setCategory(event.target.value)
            }
            required
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Preventive"
          />
        </div>

        <div>
          <label
            htmlFor="procedure-description"
            className="block text-sm font-medium text-slate-700"
          >
            Description
          </label>

          <textarea
            id="procedure-description"
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            required
            rows={4}
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="Describe the treatment..."
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="procedure-price"
              className="block text-sm font-medium text-slate-700"
            >
              Base price (₱)
            </label>

            <input
              id="procedure-price"
              type="number"
              min="0"
              step="0.01"
              value={basePrice}
              onChange={(event) =>
                setBasePrice(event.target.value)
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="1500"
            />
          </div>

          <div>
            <label
              htmlFor="procedure-duration"
              className="block text-sm font-medium text-slate-700"
            >
              Duration (minutes)
            </label>

            <input
              id="procedure-duration"
              type="number"
              min="1"
              step="1"
              value={duration}
              onChange={(event) =>
                setDuration(event.target.value)
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              placeholder="60"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="procedure-image"
            className="block text-sm font-medium text-slate-700"
          >
            Image URL
          </label>

          <input
            id="procedure-image"
            type="url"
            value={imageUrl}
            onChange={(event) =>
              setImageUrl(event.target.value)
            }
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
            placeholder="https://..."
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : procedure
                ? "Save changes"
                : "Create procedure"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProcedureForm;