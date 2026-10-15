import { Calendar, CheckSquare, Paperclip, Trash2 } from "lucide-react";
import { colorFor } from "../lib/labelColors";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";

function formatDue(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function isOverdue(dateStr, done) {
  if (done) return false;
  return new Date(dateStr).setHours(23, 59, 59, 999) < Date.now();
}

export default function TaskCard({
  task,
  code,
  assignee,
  onOpen,
  onDelete,
  draggable,
  onDragStart,
}) {
  const checklist = task.checklist || [];
  const checklistDone = checklist.filter((c) => c.done).length;
  const isDone = checklist.length > 0 && checklistDone === checklist.length;
  const overdue = task.dueDate && isOverdue(task.dueDate, isDone);

  // Priority detection: from task.priority or fallback
  const priority = task.priority?.toLowerCase() || (task.labels?.some(l => l.name?.toLowerCase().includes("urgent") || l.name?.toLowerCase().includes("bug")) ? "high" : null);

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(task);
        }
      }}
      className="group relative cursor-grab rounded-2xl border border-border bg-surface p-4 shadow-subtle transition-all duration-150 hover:-translate-y-0.5 hover:border-border/90 hover:shadow-card active:cursor-grabbing active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 select-none"
    >
      {/* Top Header: Code, Priority, Assignee & Delete */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[11px] font-medium text-muted tracking-tight">
            {code}
          </span>
          {priority && (
            <Badge variant={priority} size="xs" dot>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {assignee && (
            <Avatar
              name={assignee.name || assignee.email}
              size="xs"
              title={assignee.name || assignee.email}
            />
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task);
            }}
            aria-label="Delete task"
            className="opacity-0 group-hover:opacity-100 rounded-md p-1 text-muted hover:text-danger hover:bg-danger/10 transition-all duration-150 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium text-text leading-snug mb-1.5 break-words tracking-tight">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.description && (
        <p className="text-xs text-muted line-clamp-2 mb-3 leading-relaxed break-words">
          {task.description}
        </p>
      )}

      {/* Labels */}
      {task.labels?.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {task.labels.map((l, idx) => {
            const c = colorFor(l.color);
            return (
              <span
                key={idx}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium tracking-tight ${c.badge || `${c.bg} ${c.text}`}`}
              >
                {l.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Meta Footer (File, Checklist count, Due Date) */}
      {(task.attachmentUrl || checklist.length > 0 || task.dueDate) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-2 border-t border-border/50 text-[11px]">
          {task.attachmentUrl && (
            <a
              href={task.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-ai hover:underline"
              title="Attachment"
            >
              <Paperclip className="h-3 w-3" />
              <span>File</span>
            </a>
          )}

          {checklist.length > 0 && (
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                isDone ? "text-success" : "text-muted"
              }`}
            >
              <CheckSquare className="h-3 w-3" />
              <span>
                {checklistDone}/{checklist.length}
              </span>
            </span>
          )}

          {task.dueDate && (
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                overdue ? "text-danger font-semibold" : "text-muted"
              }`}
            >
              <Calendar className="h-3 w-3" />
              <span>{formatDue(task.dueDate)}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
