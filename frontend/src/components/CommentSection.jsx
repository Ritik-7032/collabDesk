import { useState } from "react";
import api, { getErrorMessage } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { Loader2, Send } from "lucide-react";
import { Avatar } from "./ui/Avatar";

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function CommentSection({ taskId, comments = [], onAdded }) {
  const toast = useToast();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim() || !taskId) return;
    setSending(true);
    try {
      const res = await api.post(`/tasks/${taskId}/comments`, { text });
      onAdded(res.data);
      setText("");
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't post comment"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
        {comments.length === 0 && (
          <p className="text-xs text-muted/70 italic py-2">No comments yet. Start the conversation.</p>
        )}
        {comments.map((c, idx) => (
          <div key={idx} className="flex items-start gap-2.5">
            <Avatar name={c.authorName || "?"} size="xs" className="mt-0.5" />
            <div className="min-w-0 flex-1 rounded-xl bg-elevated/60 border border-border/60 p-2.5">
              <div className="flex items-center justify-between gap-1.5 mb-1">
                <span className="text-xs font-semibold text-text tracking-tight">{c.authorName}</span>
                <span className="text-[10px] text-muted">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="text-xs text-text leading-relaxed break-words whitespace-pre-line">{c.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit(e);
            }
          }}
          placeholder={taskId ? "Write a comment…" : "Save task first to comment"}
          disabled={!taskId}
          className="min-w-0 flex-1 rounded-xl border border-border bg-elevated px-3 py-2 text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!taskId || sending || !text.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-white px-3.5 py-2 text-xs font-medium transition-all disabled:opacity-50 cursor-pointer shadow-sm"
        >
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          <span>Post</span>
        </button>
      </div>
    </div>
  );
}
