import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

export default function ChecklistEditor({ items, onChange }) {
  const [draft, setDraft] = useState("");

  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  const addItem = () => {
    if (!draft.trim()) return;
    onChange([...items, { text: draft.trim(), done: false }]);
    setDraft("");
  };

  const toggleItem = (idx) => {
    onChange(items.map((it, i) => (i === idx ? { ...it, done: !it.done } : it)));
  };

  const removeItem = (idx) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2.5">
      {items.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated border border-border/40">
            <div
              className="h-full rounded-full bg-success transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="font-mono text-xs font-medium text-muted">{pct}%</span>
        </div>
      )}

      <div className="space-y-1">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="group flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 hover:bg-elevated/70 transition-colors"
          >
            <input
              type="checkbox"
              id={`checklist-item-${idx}`}
              checked={item.done}
              onChange={() => toggleItem(idx)}
              className="h-4 w-4 rounded border-border text-primary accent-primary cursor-pointer shrink-0"
            />
            <label
              htmlFor={`checklist-item-${idx}`}
              className={`flex-1 text-xs cursor-pointer select-none break-words leading-relaxed ${
                item.done ? "text-muted line-through" : "text-text"
              }`}
            >
              {item.text}
            </label>
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-danger rounded transition-all cursor-pointer"
              aria-label="Remove item"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder="Add an item and press Enter..."
          className="min-w-0 flex-1 rounded-xl border border-border bg-elevated px-3 py-2 text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
        />
        <button
          type="button"
          onClick={addItem}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-elevated hover:bg-surface px-3 py-2 text-xs font-medium text-text transition-colors cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
    </div>
  );
}
