import { Input } from "../ui";

type ProcedureSearchProps = {
  value: string;
  onChange: (value: string) => void;
};

function ProcedureSearch({
  value,
  onChange,
}: ProcedureSearchProps) {
  return (
    <div className="relative">
      <label htmlFor="procedure-search" className="sr-only">
        Search treatments
      </label>

      <Input
        id="procedure-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search treatments..."
      />
    </div>
  );
}

export default ProcedureSearch;
