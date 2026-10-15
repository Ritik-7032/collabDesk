import { forwardRef } from "react";

export const Input = forwardRef(function Input(
  {
    label,
    error,
    helperText,
    icon: Icon,
    className = "",
    id,
    type = "text",
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-text mb-1.5 tracking-tight"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <span className="absolute left-3 text-muted pointer-events-none flex items-center">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full rounded-xl border border-border bg-elevated px-3.5 py-2.5 text-sm text-text placeholder:text-muted/60 transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:bg-surface ${
            Icon ? "pl-9" : ""
          } ${error ? "border-danger focus:border-danger focus:ring-danger/20" : ""} ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-danger mt-1 tracking-tight">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted mt-1 leading-normal">{helperText}</p>
      ) : null}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  {
    label,
    error,
    helperText,
    className = "",
    id,
    rows = 3,
    ...props
  },
  ref
) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-medium text-text mb-1.5 tracking-tight"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`w-full rounded-xl border border-border bg-elevated px-3.5 py-2.5 text-sm text-text placeholder:text-muted/60 transition-all duration-150 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:bg-surface resize-y ${
          error ? "border-danger focus:border-danger focus:ring-danger/20" : ""
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-danger mt-1 tracking-tight">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-muted mt-1 leading-normal">{helperText}</p>
      ) : null}
    </div>
  );
});

export default Input;
