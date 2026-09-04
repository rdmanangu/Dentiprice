import ProcedureManager from "../components/admin/ProcedureManager";
import AddOnManager from "../components/admin/AddOnManager";

function TreatmentsPage() {
  return (
    <div className="space-y-10">
      <ProcedureManager />
      <AddOnManager />
    </div>
  );
}

export default TreatmentsPage;
