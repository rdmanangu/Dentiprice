import type { ReactNode } from "react";
import { Card } from "./Card";
import { EmptyState } from "./EmptyState";
import { LoadingState } from "./LoadingState";
import { ErrorState } from "./ErrorState";

type DataTableColumn<T> = {
  key: string;
  header: string;
  align?: "left" | "right" | "center";
  headerClassName?: string;
  cellClassName?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  rowClassName?: (row: T) => string;
  onRowClick?: (row: T) => void;
  className?: string;
  loading?: boolean;
  loadingLabel?: string;
  error?: string | null;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  ariaLabel?: string;
};

const alignClasses = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

function DataTable<T>({
  columns,
  rows,
  getRowId,
  rowClassName,
  onRowClick,
  className = "",
  loading = false,
  loadingLabel = "Loading...",
  error = null,
  emptyTitle = "No records found.",
  emptyDescription,
  emptyAction,
  ariaLabel,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <LoadingState label={loadingLabel} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <ErrorState>{error}</ErrorState>
      </Card>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={className}>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
        />
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-card border border-border bg-surface shadow-card ${className}`}
    >
      <div className="overflow-x-auto">
        <table
          className="min-w-full border-collapse text-left"
          aria-label={ariaLabel}
        >
          <thead>
            <tr className="border-b border-border bg-bg">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-600 ${alignClasses[column.align ?? "left"]} ${column.headerClassName ?? ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const interactive = Boolean(onRowClick);

              return (
                <tr
                  key={getRowId(row)}
                  onClick={
                    onRowClick
                      ? () => onRowClick(row)
                      : undefined
                  }
                  className={`border-b border-border last:border-b-0 ${
                    interactive
                      ? "cursor-pointer transition-colors hover:bg-bg focus-visible:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                      : ""
                  } ${rowClassName ? rowClassName(row) : ""}`}
                  tabIndex={interactive ? 0 : undefined}
                  onKeyDown={
                    interactive
                      ? (event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            event.preventDefault();
                            onRowClick?.(row);
                          }
                        }
                      : undefined
                  }
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 ${alignClasses[column.align ?? "left"]} ${column.cellClassName ?? ""}`}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { DataTable };
export default DataTable;
