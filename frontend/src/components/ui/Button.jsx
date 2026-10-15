import { forwardRef } from "react";
import { Loader2 } from "lucide-react";

const variants = {
  primary:
    "bg-primary text-white shadow-sm hover:opacity-90 active:scale-[0.98] border border-primary/20",
  secondary:
    "bg-elevated text-text border border-border hover:bg-surface hover:border-muted/40 active:scale-[0.98]",
  ghost:
    "bg-transparent text-muted hover:text-text hover:bg-elevated/70 active:scale-[0.98]",
  danger:
    "bg-danger/10 text-danger border border-danger/25 hover:bg-danger/20 active:scale-[0.98]",
  ai:
    "ai-gradient-bg text-slate-950 font-semibold shadow-md hover:brightness-105 active:scale-[0.98] border border-cyan-400/30",
  outline:
    "bg-transparent text-text border border-border hover:bg-elevated active:scale-[0.98]",
};

const sizes = {
  xs: "px-2.5 py-1 text-xs rounded-lg gap-1.5",
  sm: "px-3 py-1.5 text-xs font-medium rounded-xl gap-1.5",
  md: "px-4 py-2 text-sm font-medium rounded-xl gap-2",
  lg: "px-5 py-2.5 text-base font-medium rounded-xl gap-2.5",
};

export const Button = forwardRef(function Button(
  {
    children,
    variant = "primary",
    size = "md",
    className = "",
    loading = false,
    disabled = false,
    icon: Icon,
    type = "button",
    ...props
  },
  ref
) {
  const baseClasses =
    "inline-flex items-center justify-center font-sans tracking-tight select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer";
  const variantClass = variants[variant] || variants.primary;
  const sizeClass = sizes[size] || sizes.md;

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="h-4 w-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
});

export default Button;
