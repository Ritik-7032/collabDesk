import { useState } from "react";
import TaskCard from "./TaskCard";
import { GripVertical, MoreHorizontal, Plus, Trash2, Edit2 } from "lucide-react";
import { colorFor } from "../lib/labelColors";

const TASK_MIME = "application/x-task-id";
const LIST_MIME = "application/x-list-id";

export default function ListColumn({
  list,
  tasks,
  members,
  codeFor,
  onOpenTask,
  onDeleteTask,
  onAddTask,
  onRenameList,
  onDeleteList,
  onDropTask,
  onListDragStart,
  onListDrop,
  isListDragTarget,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(list.name);
  const [cardDragOverIdx, setCardDragOverIdx] = useState(null);
  const [columnDragOver, setColumnDragOver] = useState(false);

  const dotColor = colorFor(list.color);

  const commitRename = () => {
    setRenaming(false);
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== list.name) {
      onRenameList(list, trimmed);
    } else {
      setNameDraft(list.name);
    }
  };

  const handleCardDrop = (e, idx) => {
    e.preventDefault();
    e.stopPropagation();
    setCardDragOverIdx(null);
    const taskId = e.dataTransfer.getData(TASK_MIME);
    if (taskId) onDropTask(list._id, idx, taskId);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (e.dataTransfer.types.includes(LIST_MIME)) setColumnDragOver(true);
      }}
      onDragLeave={() => setColumnDragOver(false)}
      onDrop={(e) => {
        if (e.dataTransfer.types.includes(LIST_MIME)) {
          e.preventDefault();
          setColumnDragOver(false);
          onListDrop(list);
          return;
        }
        handleCardDrop(e, tasks.length);
      }}
      className={`flex w-[300px] shrink-0 flex-col rounded-2xl border bg-elevated/40 dark:bg-surface/60 p-3.5 transition-all duration-150 backdrop-blur-sm ${
        columnDragOver || isListDragTarget
          ? "border-primary/60 bg-primary/5 shadow-card"
          : "border-border/80"
      }`}
    >
      {/* Column Header */}
      <div className="mb-3 flex items-center justify-between gap-2 px-1">
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(LIST_MIME, list._id);
            onListDragStart(list);
          }}
          className="flex min-w-0 flex-1 cursor-grab items-center gap-2 active:cursor-grabbing group/header"
        >
          <span className="text-muted/50 group-hover/header:text-muted transition-colors">
            <GripVertical className="h-4 w-4" />
          </span>
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${
              dotColor.dot || "bg-primary"
            }`}
          />
          {renaming ? (
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setNameDraft(list.name);
                  setRenaming(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="min-w-0 flex-1 rounded-lg border border-primary bg-surface px-2 py-0.5 text-sm font-medium text-text focus:outline-none"
            />
          ) : (
            <span
              onDoubleClick={() => setRenaming(true)}
              className="truncate text-sm font-semibold text-text tracking-tight cursor-pointer"
              title="Double-click to rename"
            >
              {list.name}
            </span>
          )}
          <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-full bg-surface border border-border text-[11px] font-mono font-medium text-muted">
            {tasks.length}
          </span>
        </div>

        {/* Options Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="List actions"
            className="rounded-lg p-1 text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-50 mt-1.5 w-44 animate-modal-in rounded-xl border border-border bg-surface p-1 shadow-card">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setRenaming(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-text hover:bg-elevated transition-colors cursor-pointer"
                >
                  <Edit2 className="h-3.5 w-3.5 text-muted" /> Rename list
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onDeleteList(list);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete list
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task Cards Container */}
      <div className="flex min-h-[80px] flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5">
        {tasks.map((task, idx) => (
          <div key={task._id}>
            <div
              onDragOver={(e) => {
                if (e.dataTransfer.types.includes(TASK_MIME)) {
                  e.preventDefault();
                  e.stopPropagation();
                  setCardDragOverIdx(idx);
                }
              }}
              onDrop={(e) => handleCardDrop(e, idx)}
              className={`transition-all duration-150 ${
                cardDragOverIdx === idx
                  ? "border-t-2 border-primary pt-2.5"
                  : ""
              }`}
            >
              <TaskCard
                task={task}
                code={codeFor(task._id)}
                assignee={members.find((m) => m._id === task.assignedTo)}
                onOpen={onOpenTask}
                onDelete={onDeleteTask}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(TASK_MIME, task._id);
                }}
              />
            </div>
          </div>
        ))}

        <div
          onDragOver={(e) => {
            if (e.dataTransfer.types.includes(TASK_MIME)) {
              e.preventDefault();
              setCardDragOverIdx(tasks.length);
            }
          }}
          onDrop={(e) => handleCardDrop(e, tasks.length)}
          className={`min-h-[40px] flex-1 rounded-xl transition-all ${
            cardDragOverIdx === tasks.length
              ? "border-t-2 border-primary pt-2.5"
              : ""
          }`}
        >
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 py-7 text-center">
              <p className="text-xs font-medium text-muted">No tasks yet</p>
              <p className="text-[11px] text-muted/70 mt-0.5">Drop cards here</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Add Task Action */}
      <button
        type="button"
        onClick={() => onAddTask(list._id)}
        className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-surface/40 hover:bg-surface hover:border-primary/50 px-3 py-2 text-xs font-medium text-muted hover:text-text transition-all duration-150 cursor-pointer"
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Add task</span>
      </button>
    </div>
  );
}
