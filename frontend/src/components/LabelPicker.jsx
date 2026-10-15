import { useState } from "react";
import { Plus, X } from "lucide-react";
import { LABEL_COLORS, colorFor } from "../lib/labelColors";

export default function LabelPicker({ labels, onChange }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(LABEL_COLORS[0].key);

  const addLabel = () => {
    if (!name.trim()) return;
    onChange([...labels, { name: name.trim(), color }]);
    setName("");
    setColor(LABEL_COLORS[0].key);
    setOpen(false);
  };

  const removeLabel = (idx) => {
    onChange(labels.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {labels.map((l, idx) => {
          const c = colorFor(l.color);
          return (
            <span
              key={`${l.name}-${idx}`}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium tracking-tight ${c.badge || `${c.bg} ${c.text}`}`}
            >
              <span>{l.name}</span>
              <button
                type="button"
                onClick={() => removeLabel(idx)}
                className="opacity-60 hover:opacity-100 cursor-pointer p-0.5"
                aria-label={`Remove ${l.name} label`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-elevated/40 hover:bg-elevated px-2.5 py-1 text-[11px] font-medium text-muted hover:text-text transition-colors cursor-pointer"
        >
          <Plus className="h-3 w-3" /> Label
        </button>
      </div>

      {open && (
        <div className="mt-2.5 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-elevated p-2.5 shadow-card animate-modal-in">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLabel();
              }
            }}
            placeholder="Label name..."
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
          />
          <div className="flex items-center gap-1.5">
            {LABEL_COLORS.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setColor(c.key)}
                className={`h-5 w-5 rounded-full transition-all cursor-pointer ${c.dot || c.bg} ${
                  color === c.key
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-elevated scale-110"
                    : "opacity-60 hover:opacity-100"
                }`}
                aria-label={c.label || c.key}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={addLabel}
            className="rounded-lg bg-primary hover:bg-primary/90 text-white px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors shadow-sm"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
