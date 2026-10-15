import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(
    (message, type = "info", duration = 3500) => {
      const id = ++idCounter;
      setToasts((t) => [...t, { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const toast = {
    success: (msg) => push(msg, "success"),
    error: (msg) => push(msg, "error"),
    info: (msg) => push(msg, "info"),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 w-[calc(100%-2rem)] max-w-sm pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            onClick={() => dismiss(t.id)}
            className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-elevated backdrop-blur-md cursor-pointer transition-all hover:opacity-95 ${
              t.type === "success"
                ? "bg-surface border-success/30 text-text shadow-success/5"
                : t.type === "error"
                ? "bg-surface border-danger/30 text-text shadow-danger/5"
                : "bg-surface border-border text-text"
            }`}
          >
            <span className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="h-4 w-4 text-success" />}
              {t.type === "error" && <AlertCircle className="h-4 w-4 text-danger" />}
              {t.type === "info" && <Info className="h-4 w-4 text-primary" />}
            </span>
            <p className="flex-1 text-xs leading-relaxed font-medium">{t.message}</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                dismiss(t.id);
              }}
              className="text-muted hover:text-text p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
