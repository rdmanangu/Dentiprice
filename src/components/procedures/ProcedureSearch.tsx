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
      <label
        htmlFor="procedure-search"
        className="sr-only"
      >
        Search treatments
      </label>

      <input
        id="procedure-search"
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search treatments..."
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      />
    </div>
  );
}

export default ProcedureSearch;