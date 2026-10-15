export const LABEL_COLORS = [
  {
    key: "amber",
    label: "Amber",
    badge: "bg-warning/15 text-warning border border-warning/25",
    dot: "bg-warning",
    // Fallback for older components
    bg: "bg-warning/15 border border-warning/25",
    text: "text-warning",
  },
  {
    key: "teal",
    label: "Teal",
    badge: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25",
    dot: "bg-cyan-400",
    bg: "bg-cyan-500/15 border border-cyan-500/25",
    text: "text-cyan-600 dark:text-cyan-400",
  },
  {
    key: "blue",
    label: "Blue",
    badge: "bg-primary/15 text-primary border border-primary/25",
    dot: "bg-primary",
    bg: "bg-primary/15 border border-primary/25",
    text: "text-primary",
  },
  {
    key: "green",
    label: "Green",
    badge: "bg-success/15 text-success border border-success/25",
    dot: "bg-success",
    bg: "bg-success/15 border border-success/25",
    text: "text-success",
  },
  {
    key: "red",
    label: "Red",
    badge: "bg-danger/15 text-danger border border-danger/25",
    dot: "bg-danger",
    bg: "bg-danger/15 border border-danger/25",
    text: "text-danger",
  },
];

export function colorFor(key) {
  return LABEL_COLORS.find((c) => c.key === key) || LABEL_COLORS[0];
}
