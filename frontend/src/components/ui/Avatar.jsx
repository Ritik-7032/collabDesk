export function Avatar({
  name = "",
  src = "",
  size = "md",
  className = "",
  title,
}) {
  const initial = name?.trim()?.[0]?.toUpperCase() || "?";

  const sizeClasses = {
    xs: "h-5 w-5 text-[10px]",
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-xs",
    lg: "h-10 w-10 text-sm",
    xl: "h-12 w-12 text-base",
  };

  return (
    <div
      title={title || name}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-elevated border border-border font-semibold text-text select-none overflow-hidden ${
        sizeClasses[size] || sizeClasses.md
      } ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="h-full w-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <span className={src ? "sr-only" : ""}>{initial}</span>
    </div>
  );
}

export function AvatarGroup({
  members = [],
  max = 4,
  size = "sm",
  className = "",
}) {
  const visible = members.slice(0, max);
  const remaining = members.length - max;

  return (
    <div className={`flex items-center -space-x-1.5 ${className}`}>
      {visible.map((m, i) => (
        <Avatar
          key={m._id || m.id || i}
          name={m.name || m.email}
          src={m.avatar}
          size={size}
          className="ring-2 ring-surface border-0"
        />
      ))}
      {remaining > 0 && (
        <div
          title={`${remaining} more members`}
          className={`inline-flex shrink-0 items-center justify-center rounded-full bg-surface-3 ring-2 ring-surface text-[10px] font-medium text-muted ${
            size === "xs"
              ? "h-5 w-5"
              : size === "md"
              ? "h-8 w-8 text-xs"
              : "h-6 w-6"
          }`}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

export default Avatar;
