import { useId } from "react";
import { useDialogBehavior } from "../../lib/useDialogBehavior";

type ModalProps = {
  title: string;
  subtitle?: string;
  description?: string;
  onClose: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  labelledBy?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl";
};

const widthClasses: Record<NonNullable<ModalProps["maxWidth"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

export function Modal({
  title,
  subtitle,
  description,
  onClose,
  children,
  footer,
  labelledBy,
  maxWidth = "md",
}: ModalProps) {
  const generatedId = useId();
  const titleId = labelledBy ?? generatedId;
  const descriptionId = useId();
  const dialogRef = useDialogBehavior(onClose);

  function handleBackdropClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`mx-auto mt-10 w-full ${widthClasses[maxWidth]} rounded-card bg-surface shadow-lg focus:outline-none`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-6">
          <div>
            <h2 id={titleId} className="text-xl font-bold text-ink">
              {title}
            </h2>

            {subtitle && (
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-slate-500 hover:bg-bg hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {description && (
            <p id={descriptionId} className="text-sm text-slate-600">
              {description}
            </p>
          )}

          {children}
        </div>

        {footer && <div className="border-t border-border p-6">{footer}</div>}
      </div>
    </div>
  );
}

export default Modal;
