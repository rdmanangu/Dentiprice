import ProcedureCard from "./ProcedureCard";
import { EmptyState } from "../ui";
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
      <EmptyState
        title="No treatments found."
        description="Try adjusting your search or filters."
      />
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
