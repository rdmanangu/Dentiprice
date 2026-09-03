type ErrorStateProps = {
  children: React.ReactNode;
  className?: string;
};

export function ErrorState({
  children,
  className = "",
}: ErrorStateProps) {
  return (
    <p
      role="alert"
      className={`rounded-card border border-error-border bg-error-bg p-4 text-sm font-medium text-error ${className}`}
    >
      {children}
    </p>
  );
}

export default ErrorState;
