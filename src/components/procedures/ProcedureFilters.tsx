import { Select } from "../ui";

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
          className="mb-2 block text-sm font-medium text-ink"
        >
          Category
        </label>

        <Select
          id="category-filter"
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
        >
          <option value="all">All categories</option>

          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label
          htmlFor="sort-filter"
          className="mb-2 block text-sm font-medium text-ink"
        >
          Sort by
        </label>

        <Select
          id="sort-filter"
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
        >
          <option value="name">Name</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="duration-asc">Duration: Shortest First</option>
          <option value="duration-desc">Duration: Longest First</option>
        </Select>
      </div>
    </div>
  );
}

export default ProcedureFilters;
