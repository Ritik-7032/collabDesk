import { forwardRef } from "react";

export const Card = forwardRef(function Card(
  {
    children,
    className = "",
    hoverable = false,
    clickable = false,
    onClick,
    ...props
  },
  ref
) {
  const hoverStyles = hoverable || clickable
    ? "hover:border-border/90 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
    : "";

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`rounded-2xl border border-border bg-surface text-text shadow-subtle ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`p-5 pb-3 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = "", ...props }) => (
  <h3 className={`text-base font-semibold text-text tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = "", ...props }) => (
  <p className={`text-xs text-muted mt-1 leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className = "", ...props }) => (
  <div className={`p-5 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
