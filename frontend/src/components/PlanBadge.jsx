import { Crown } from "lucide-react";

export default function PlanBadge({ premium }) {
  if (premium) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary tracking-tight">
        <Crown className="h-3.5 w-3.5 text-primary" />
        Premium
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-elevated px-2.5 py-1 text-xs font-medium text-muted tracking-tight">
      Free plan
    </span>
  );
}
