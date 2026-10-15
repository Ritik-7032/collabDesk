import { useEffect } from "react";
import { X } from "lucide-react";

export function Modal({
  isOpen = true,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
  showClose = true,
  className = "",
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Dialog Surface */}
      <div
        className={`relative w-full ${maxWidth} animate-modal-in rounded-2xl border border-border bg-surface text-text shadow-elevated z-10 overflow-hidden my-auto ${className}`}
      >
        {(title || showClose) && (
          <div className="flex items-start justify-between border-b border-border/80 px-6 py-4.5">
            <div>
              {title && (
                <h2 className="text-base font-semibold text-text tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-muted mt-0.5 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="rounded-lg p-1 text-muted hover:text-text hover:bg-elevated transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        <div className="px-6 py-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
