import { Button } from "../ui";
import { formatPrice } from "../../lib/formatPrice";
import type { Procedure } from "../../types/procedure";

type ProcedureCardProps = {
  procedure: Procedure;
  selected?: boolean;
  onSelect?: (procedure: Procedure) => void;
};

function ProcedureCard({
  procedure,
  selected = false,
  onSelect,
}: ProcedureCardProps) {
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-card border bg-surface shadow-card transition hover:-translate-y-1 hover:shadow-md ${
        selected
          ? "border-accent ring-2 ring-accent/30"
          : "border-border"
      }`}
    >
      {procedure.image_url ? (
        <img
          src={procedure.image_url}
          alt=""
          className="h-48 w-full object-cover"
        />
      ) : (
        <div
          className="flex h-48 items-center justify-center bg-gradient-to-br from-primary to-cta text-sm text-white/80"
          aria-hidden="true"
        >
          DentiPrice treatment
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-cta">
            {procedure.category}
          </span>

          {selected && (
            <span className="inline-flex items-center gap-1 rounded-pill bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
              ✓ Selected
            </span>
          )}
        </div>

        <h3 className="text-xl font-semibold text-ink">
          {procedure.name}
        </h3>

        <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
          {procedure.description}
        </p>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Starting at</p>

            <p className="text-xl font-bold text-primary">
              {formatPrice(procedure.base_price)}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">Duration</p>

            <p className="text-sm font-medium text-slate-700">
              {procedure.estimated_duration_mins != null
                ? `${procedure.estimated_duration_mins} min`
                : "—"}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="cta"
          onClick={() => onSelect?.(procedure)}
          disabled={selected}
          className="mt-5 w-full"
        >
          {selected ? "Selected" : "Select treatment"}
        </Button>
      </div>
    </article>
  );
}

export default ProcedureCard;
