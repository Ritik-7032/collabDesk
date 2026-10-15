import { CheckSquare } from "lucide-react";
import { Badge } from "./ui/Badge";

const MOCK_COLUMNS = [
  {
    name: "To do",
    dot: "bg-muted",
    count: 2,
    cards: [
      {
        code: "CD-001",
        title: "Design onboarding flow",
        priority: "medium",
        labels: ["UI Design"],
        checklist: "2/5",
      },
      {
        code: "CD-002",
        title: "Set up S3 presigned URL policies",
        priority: "high",
        labels: ["Cloud"],
      },
    ],
  },
  {
    name: "In progress",
    dot: "bg-primary",
    count: 2,
    cards: [
      {
        code: "CD-003",
        title: "AI task breakdown generator",
        priority: "high",
        labels: ["Gemini AI"],
        checklist: "4/6",
        due: "Oct 22",
        ai: true,
      },
      {
        code: "CD-004",
        title: "Real-time socket.io rooms",
        priority: "low",
        labels: ["WebSocket"],
      },
    ],
  },
  {
    name: "Done",
    dot: "bg-success",
    count: 1,
    cards: [
      {
        code: "CD-005",
        title: "Google OAuth 2.0 flow",
        priority: "low",
        labels: ["Auth"],
        checklist: "3/3",
      },
    ],
  },
];

export default function BoardMockup() {
  return (
    <div className="relative rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-elevated overflow-hidden">
      {/* Window chrome header */}
      <div className="mb-4 flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/80" />
          <span className="ml-2 font-mono text-xs text-muted">
            CollabDesk &middot; Live Team Workspace
          </span>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-2.5 py-0.5 text-[10px] font-medium text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          Live
        </span>
      </div>

      {/* Columns Container */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {MOCK_COLUMNS.map((col) => (
          <div
            key={col.name}
            className="flex flex-col rounded-xl border border-border/80 bg-elevated/40 p-3"
          >
            <div className="mb-2.5 flex items-center justify-between px-1">
              <div className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${col.dot}`} />
                <span className="text-xs font-semibold text-text tracking-tight">
                  {col.name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-muted">{col.count}</span>
            </div>

            <div className="space-y-2">
              {col.cards.map((card) => (
                <div
                  key={card.code}
                  className="rounded-xl border border-border bg-surface p-3 shadow-subtle hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span className="font-mono text-[10px] text-muted">{card.code}</span>
                    <Badge variant={card.priority} size="xs" dot>
                      {card.priority.charAt(0).toUpperCase() + card.priority.slice(1)}
                    </Badge>
                  </div>

                  <p className="text-xs font-medium text-text leading-snug mb-2">
                    {card.title}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-muted pt-1 border-t border-border/40">
                    <span className="rounded bg-elevated px-1.5 py-0.5 text-[9px] font-medium">
                      {card.labels[0]}
                    </span>
                    {card.checklist && (
                      <span className="inline-flex items-center gap-1">
                        <CheckSquare className="h-2.5 w-2.5" />
                        {card.checklist}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
