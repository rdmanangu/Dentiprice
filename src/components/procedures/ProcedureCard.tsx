type Procedure = {
  id: string;
  name: string;
  category: string;
  description: string;
  base_price: number;
  estimated_duration_mins: number;
  image_url: string | null;
};

type ProcedureCardProps = {
  procedure: Procedure;
  onSelect?: (procedure: Procedure) => void;
};

function ProcedureCard({
  procedure,
  onSelect,
}: ProcedureCardProps) {
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      {procedure.image_url ? (
        <img
          src={procedure.image_url}
          alt=""
          className="h-48 w-full object-cover"
        />
      ) : (
        <div
          className="flex h-48 items-center justify-center bg-slate-100 text-sm text-slate-400"
          aria-hidden="true"
        >
          Dental treatment
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <span className="mb-2 text-sm font-medium text-slate-500">
          {procedure.category}
        </span>

        <h2 className="text-xl font-semibold text-slate-900">
          {procedure.name}
        </h2>

        <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">
          {procedure.description}
        </p>

        <div className="mt-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500">Starting at</p>

            <p className="text-lg font-bold text-slate-900">
              ₱{procedure.base_price.toLocaleString()}
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-500">Duration</p>

            <p className="text-sm font-medium text-slate-700">
              {procedure.estimated_duration_mins} min
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSelect?.(procedure)}
          className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
        >
          Select treatment
        </button>
      </div>
    </article>
  );
}

export default ProcedureCard;