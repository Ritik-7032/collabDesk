import { Button } from "./ui/Button";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  danger,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={onCancel}
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm animate-modal-in rounded-2xl border border-border bg-surface p-6 shadow-elevated z-10">
        <h3 className="text-base font-semibold text-text tracking-tight mb-2">
          {title}
        </h3>
        <p className="text-xs text-muted leading-relaxed mb-6">{message}</p>
        <div className="flex justify-end gap-2.5">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="sm"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
