import { useEffect, useMemo, useState } from "react";
import { getAddOnsForProcedure, type AddOn } from "../../services/addons";
import type { Procedure } from "../../types/procedure";

type PriceEstimatorProps = {
  procedure: Procedure | null;
  onClear: () => void;
  onRequestConsultation: (
    procedure: Procedure,
    selectedAddOns: AddOn[],
    totalPrice: number
  ) => void;
};

function PriceEstimator({
  procedure,
  onClear,
  onRequestConsultation,
}: PriceEstimatorProps) {
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [loadingAddOns, setLoadingAddOns] = useState(false);
  const [addOnError, setAddOnError] = useState<string | null>(null);

useEffect(() => {
    if (!procedure) {
        return;
    }

    const procedureId = procedure.id;

    async function loadAddOns() {
        try {
        setLoadingAddOns(true);
        setAddOnError(null);
        setSelectedAddOnIds([]);

        const data = await getAddOnsForProcedure(procedureId);

        setAddOns(data);
        } catch (error) {
        console.error(error);
        setAddOnError("Unable to load add-ons.");
        } finally {
        setLoadingAddOns(false);
        }
    }

    loadAddOns();
    }, [procedure]);

  const selectedAddOns = useMemo(() => {
    return addOns.filter((addOn) =>
      selectedAddOnIds.includes(addOn.id)
    );
  }, [addOns, selectedAddOnIds]);

  const addOnsTotal = useMemo(() => {
    return selectedAddOns.reduce(
      (total, addOn) => total + Number(addOn.price),
      0
    );
  }, [selectedAddOns]);

  const totalPrice =
    (procedure?.base_price ?? 0) + addOnsTotal;

  function toggleAddOn(addOnId: string) {
    setSelectedAddOnIds((current) => {
      if (current.includes(addOnId)) {
        return current.filter((id) => id !== addOnId);
      }

      return [...current, addOnId];
    });
  }

  if (!procedure) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Price estimator
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Select a treatment to calculate your estimated price.
        </p>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Price estimator"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">
            Selected treatment
          </p>

          <h2 className="mt-1 text-xl font-bold text-slate-900">
            {procedure.name}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          Clear
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
        <span className="text-slate-600">
          Base price
        </span>

        <span className="text-xl font-bold text-slate-900">
          ₱{Number(procedure.base_price).toLocaleString()}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-slate-500">
          Estimated duration
        </span>

        <span className="text-sm font-medium text-slate-700">
          {procedure.estimated_duration_mins} min
        </span>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-5">
        <h3 className="font-semibold text-slate-900">
          Optional add-ons
        </h3>

        {loadingAddOns && (
          <p className="mt-3 text-sm text-slate-500">
            Loading add-ons...
          </p>
        )}

        {addOnError && (
          <p
            role="alert"
            className="mt-3 text-sm text-red-600"
          >
            {addOnError}
          </p>
        )}

        {!loadingAddOns &&
          !addOnError &&
          addOns.length === 0 && (
            <p className="mt-3 text-sm text-slate-500">
              No add-ons are available for this treatment.
            </p>
          )}

        <div className="mt-3 space-y-3">
          {addOns.map((addOn) => (
            <label
              key={addOn.id}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedAddOnIds.includes(addOn.id)}
                  onChange={() => toggleAddOn(addOn.id)}
                  className="h-4 w-4"
                />

                <span className="font-medium text-slate-800">
                  {addOn.name}
                </span>
              </div>

              <span className="font-semibold text-slate-900">
                +₱{Number(addOn.price).toLocaleString()}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-slate-900 p-5 text-white">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-300">
            Base price
          </span>

          <span>
            ₱{Number(procedure.base_price).toLocaleString()}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-slate-300">
            Add-ons
          </span>

          <span>
            +₱{addOnsTotal.toLocaleString()}
          </span>
        </div>

        <div className="mt-4 border-t border-slate-700 pt-4">
          <p className="text-sm text-slate-300">
            Estimated total
          </p>

          <p className="mt-1 text-3xl font-bold">
            ₱{totalPrice.toLocaleString()}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() =>
          onRequestConsultation(
            procedure,
            selectedAddOns,
            totalPrice
          )
        }
        className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-slate-700"
      >
        Request consultation
      </button>
    </aside>
  );
}

export default PriceEstimator;
