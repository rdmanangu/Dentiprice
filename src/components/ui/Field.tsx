import { cloneElement, isValidElement } from "react";
import type { HTMLAttributes, ReactNode } from "react";

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
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ");

  let control = children;

  if (isValidElement<HTMLAttributes<HTMLElement>>(children)) {
    control = cloneElement(children, {
      ...(describedBy ? { "aria-describedby": describedBy } : {}),
      ...(error ? { "aria-invalid": true, "aria-errormessage": errorId } : {}),
    });
  }

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
        <p id={hintId} className="mt-1 text-xs text-slate-500">
          {hint}
        </p>
      )}

      <div className="mt-2">{control}</div>

      {error && (
        <p
          id={errorId}
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
