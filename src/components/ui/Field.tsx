import type { ReactNode } from "react";

type FieldProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  children: ReactNode;
};

export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: FieldProps) {
  const descriptionId = error ? `${htmlFor}-error` : undefined;

  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-ink"
      >
        {label}
        {required && (
          <span className="text-cta" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </label>

      {hint && (
        <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}

      <div className="mt-2">{children}</div>

      {error && (
        <p
          id={descriptionId}
          role="alert"
          className="mt-1.5 text-sm font-medium text-error"
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default Field;
