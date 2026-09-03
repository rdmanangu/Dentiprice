type LoadingStateProps = {
  label?: string;
  className?: string;
};

export function LoadingState({
  label = "Loading...",
  className = "",
}: LoadingStateProps) {
  return (
    <p className={`text-sm text-slate-500 ${className}`} role="status">
      {label}
    </p>
  );
}

export default LoadingState;
