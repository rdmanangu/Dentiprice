import { useEffect, useMemo, useRef, useState } from "react";
import { getAddOnsForProcedure, type AddOn } from "../../services/addons";
import { Button, Card, LoadingState } from "../ui";
import { formatPrice } from "../../lib/formatPrice";
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

  // Cache already-loaded add-ons so re-selecting a treatment does not
  // issue another database request for the same procedure.
  const addOnsCache = useRef(new Map<string, AddOn[]>());

  useEffect(() => {
    if (!procedure) {
      return;
    }

    const procedureId = procedure.id;
    let cancelled = false;

    async function loadAddOns() {
      const cached = addOnsCache.current.get(procedureId);

      setAddOnError(null);
      setSelectedAddOnIds([]);

      if (cached) {
        if (!cancelled) {
          setAddOns(cached);
        }
        setLoadingAddOns(false);
        return;
      }

      setLoadingAddOns(true);
      // Clear the previous treatment's add-ons so the new list never
      // shows stale options while it is loading.
      setAddOns([]);

      try {
        const data = await getAddOnsForProcedure(procedureId);
        addOnsCache.current.set(procedureId, data);

        if (!cancelled) {
          setAddOns(data);
        }
      } catch (error) {
        console.error(error);
        if (!cancelled) {
          setAddOnError("Unable to load add-ons.");
        }
      } finally {
        if (!cancelled) {
          setLoadingAddOns(false);
        }
      }
    }

    void loadAddOns();
    return () => {
      cancelled = true;
    };
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
      <Card aria-label="Price estimator">
        <h2 className="text-xl font-bold text-ink">Price estimator</h2>

        <p className="mt-2 text-sm text-slate-500">
          Select a treatment to calculate your estimated price.
        </p>
      </Card>
    );
  }

  return (
    <Card aria-label="Price estimator">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cta">
            Selected treatment
          </p>

          <h2 className="mt-1 text-xl font-bold text-ink">
            {procedure.name}
          </h2>
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={onClear}
          className="text-sm"
        >
          Clear selection
        </Button>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-5">
        <span className="text-slate-600">Base price</span>

        <span className="text-xl font-bold text-primary">
          {formatPrice(procedure.base_price)}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm text-slate-500">Estimated duration</span>

        <span className="text-sm font-medium text-slate-700">
          {procedure.estimated_duration_mins} min
        </span>
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <h3 className="font-semibold text-ink">Optional add-ons</h3>
        <p className="mt-1 text-xs text-slate-500">
          Optional. Add any items that apply to your treatment.
        </p>

        {loadingAddOns && <LoadingState className="mt-3" label="Loading add-ons..." />}

        {addOnError && (
          <p role="alert" className="mt-3 text-sm font-medium text-error">
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
              className="flex cursor-pointer items-center justify-between gap-4 rounded-control border border-border p-4 hover:bg-bg"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedAddOnIds.includes(addOn.id)}
                  onChange={() => toggleAddOn(addOn.id)}
                  className="h-4 w-4 accent-cta"
                />

                <span className="font-medium text-ink">{addOn.name}</span>
              </div>

              <span className="font-semibold text-slate-700">
                +{formatPrice(addOn.price)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-card bg-gradient-to-br from-primary to-primary-hover p-5 text-white">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/70">Base price</span>
          <span className="font-medium">{formatPrice(procedure.base_price)}</span>
        </div>

        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-white/70">Add-ons</span>
          <span className="font-medium">
            +{formatPrice(addOnsTotal)}
          </span>
        </div>

        <div className="mt-4 border-t border-white/20 pt-4">
          <p className="text-sm text-white/70">Estimated total</p>
          <p
            aria-live="polite"
            className="mt-1 text-3xl font-bold text-white"
          >
            {formatPrice(totalPrice)}
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="cta"
        onClick={() =>
          onRequestConsultation(
            procedure,
            selectedAddOns,
            totalPrice
          )
        }
        disabled={loadingAddOns}
        className="mt-5 w-full"
      >
        {loadingAddOns ? "Loading add-ons..." : "Request consultation"}
      </Button>
    </Card>
  );
}

export default PriceEstimator;
