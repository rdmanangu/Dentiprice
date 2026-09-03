import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-card border border-border bg-surface p-8 text-center ${className}`}
    >
      <p className="font-semibold text-ink">{title}</p>

      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
