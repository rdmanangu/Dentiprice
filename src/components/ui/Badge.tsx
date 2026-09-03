type BadgeTone = "success" | "warning" | "error" | "info" | "neutral";

type BadgeProps = {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
};

const toneClasses: Record<BadgeTone, string> = {
  success: "border border-success-border bg-success-bg text-success",
  warning: "border border-warning-border bg-warning-bg text-warning",
  error: "border border-error-border bg-error-bg text-error",
  info: "border border-info-border bg-info-bg text-info",
  neutral: "border border-border bg-slate-100 text-slate-600",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-xs font-semibold ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Badge;
