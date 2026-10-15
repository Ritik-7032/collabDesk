export function Badge({
  children,
  variant = "neutral",
  size = "sm",
  dot = false,
  className = "",
  ...props
}) {
  const variants = {
    neutral: "bg-elevated text-muted border border-border",
    primary: "bg-primary/10 text-primary border border-primary/20",
    high: "bg-danger/10 text-danger border border-danger/25",
    medium: "bg-warning/10 text-warning border border-warning/25",
    low: "bg-success/10 text-success border border-success/25",
    success: "bg-success/10 text-success border border-success/25",
    warning: "bg-warning/10 text-warning border border-warning/25",
    danger: "bg-danger/10 text-danger border border-danger/25",
    ai: "bg-cyan-500/10 text-cyan-500 border border-cyan-500/25",
  };

  const dots = {
    neutral: "bg-muted",
    primary: "bg-primary",
    high: "bg-danger",
    medium: "bg-warning",
    low: "bg-success",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    ai: "bg-cyan-400",
  };

  const sizes = {
    xs: "px-1.5 py-0.5 text-[10px]",
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-sans font-medium rounded-full tracking-tight ${variants[variant] || variants.neutral} ${sizes[size] || sizes.sm} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dots[variant] || dots.neutral}`}
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
