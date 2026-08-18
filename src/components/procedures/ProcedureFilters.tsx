type ProcedureFiltersProps = {
  category: string;
  sort: string;
  categories: string[];
  onCategoryChange: (category: string) => void;
  onSortChange: (sort: string) => void;
};

function ProcedureFilters({
  category,
  sort,
  categories,
  onCategoryChange,
  onSortChange,
}: ProcedureFiltersProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label
          htmlFor="category-filter"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Category
        </label>

        <select
          id="category-filter"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="all">All categories</option>

          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="sort-filter"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Sort by
        </label>

        <select
          id="sort-filter"
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        >
          <option value="name">Name</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="duration-asc">Duration: Shortest First</option>
          <option value="duration-desc">Duration: Longest First</option>
        </select>
      </div>
    </div>
  );
}

export default ProcedureFilters;