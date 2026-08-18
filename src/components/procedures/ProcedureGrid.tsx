import ProcedureCard from "./ProcedureCard";
import type { Procedure } from "../../types/procedure";

type ProcedureGridProps = {
  procedures: Procedure[];
  onSelect?: (procedure: Procedure) => void;
};

function ProcedureGrid({
  procedures,
  onSelect,
}: ProcedureGridProps) {
  if (procedures.length === 0) {
    return (
      <p className="py-12 text-center text-slate-500">
        No treatments found.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {procedures.map((procedure) => (
        <ProcedureCard
          key={procedure.id}
          procedure={procedure}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default ProcedureGrid;
