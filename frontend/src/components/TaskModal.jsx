import { useRef, useState } from "react";
import api, { getErrorMessage } from "../lib/api";
import { useToast } from "../context/ToastContext";
import {
  Loader2,
  Paperclip,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import LabelPicker from "./LabelPicker";
import ChecklistEditor from "./ChecklistEditor";
import CommentSection from "./CommentSection";
import Button from "./ui/Button";

export default function TaskModal({
  mode,
  workspaceId,
  task,
  code,
  members = [],
  lists = [],
  defaultListId,
  onClose,
  onCreated,
  onUpdated,
  onDeleteRequest,
}) {
  const toast = useToast();
  const isEdit = mode === "edit";
  const fileInputRef = useRef(null);

  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [listId, setListId] = useState(task?.list || defaultListId || lists[0]?._id || "");
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo || "");
  const [attachmentUrl] = useState(task?.attachmentUrl || "");
  const [file, setFile] = useState(null);
  const [labels, setLabels] = useState(task?.labels || []);
  const [dueDate, setDueDate] = useState(
    task?.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ""
  );
  const [checklist, setChecklist] = useState(task?.checklist || []);
  const [comments, setComments] = useState(task?.comments || []);
  const [currentTaskId, setCurrentTaskId] = useState(task?._id || null);

  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFilePick = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const uploadFile = async () => {
    if (!file) return attachmentUrl;
    setUploading(true);
    try {
      try {
        const fileMime = file.type || "application/pdf";
        const presignRes = await api.post("/upload/presign", {
          fileName: file.name,
          fileType: fileMime,
          fileSize: file.size,
        });
        const { uploadUrl, fileUrl } = presignRes.data;
        await fetch(uploadUrl, {
          method: "PUT",
          body: file,
          headers: { "Content-Type": fileMime },
        });
        toast.success("File uploaded to S3");
        return fileUrl;
      } catch (presignErr) {
        console.warn("Presigned upload fallback to server:", presignErr.message);
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/upload", formData);
        toast.success("File uploaded");
        return res.data.url;
      }
    } catch (err) {
      toast.error(getErrorMessage(err, "Upload failed"));
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateSubtasks = async () => {
    if (!description.trim()) {
      toast.error("Add a description first so AI has something to break down");
      return;
    }
    setAiLoading(true);
    try {
      const res = await api.post("/ai/generate-subtasks", { description });
      const subtasks = res.data.subtasks || [];
      if (subtasks.length === 0) {
        toast.info("AI didn't return any subtasks");
        return;
      }
      setChecklist((prev) => [...prev, ...subtasks.map((s) => ({ text: s, done: false }))]);
      toast.success(`Generated ${subtasks.length} actionable subtasks with AI`);
    } catch (err) {
      toast.error(getErrorMessage(err, "AI subtask generation failed"));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Give the task a title");
      return;
    }
    if (!listId) {
      toast.error("Pick a list for this task");
      return;
    }
    setSaving(true);
    try {
      const finalUrl = await uploadFile();
      const payload = {
        title: title.trim(),
        description: description.trim(),
        attachmentUrl: finalUrl,
        assignedTo: assignedTo || null,
        labels,
        dueDate: dueDate || null,
        checklist,
      };

      if (isEdit) {
        const res = await api.put(`/tasks/${task._id}`, {
          ...payload,
          list: listId,
          expectedVersion: task.version,
        });
        onUpdated(res.data);
        toast.success("Task updated");
      } else {
        const res = await api.post("/tasks", { ...payload, workspace: workspaceId, list: listId });
        onCreated(res.data);
        toast.success("Task created");
      }
      onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error("Conflict: This task was updated by another teammate. Please reopen the card to see latest changes.");
      } else {
        toast.error(getErrorMessage(err, "Couldn't save task"));
      }
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || uploading;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Surface */}
      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[92vh] w-full max-w-xl flex-col animate-modal-in rounded-2xl border border-border bg-surface text-text shadow-elevated z-10 overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4.5 bg-surface">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-text tracking-tight">
                {isEdit ? "Edit Task" : "Create New Task"}
              </h2>
              {isEdit && code && (
                <span className="font-mono text-xs text-muted px-2 py-0.5 rounded-md bg-elevated border border-border">
                  {code}
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">
              {isEdit ? "Update details, checklist or attachments" : "Fill in task details and collaborate"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-1 text-muted hover:text-text hover:bg-elevated transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* Title Input */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text tracking-tight">
              Task Title <span className="text-danger">*</span>
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Architect Redis cache layer for workspace rooms"
              className="w-full rounded-xl border border-border bg-elevated px-3.5 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>

          {/* Labels Picker */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text tracking-tight">
              Labels & Tags
            </label>
            <LabelPicker labels={labels} onChange={setLabels} />
          </div>

          {/* Description & AI Subtask Button */}
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <label className="block text-xs font-semibold text-text tracking-tight">
                Description
              </label>

              {/* Distinct AI Subtask Button with isolated gradient */}
              <button
                type="button"
                onClick={handleGenerateSubtasks}
                disabled={aiLoading}
                className="ai-gradient-bg inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-950 shadow-sm hover:brightness-105 active:scale-95 disabled:opacity-60 transition-all cursor-pointer"
              >
                {aiLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{aiLoading ? "Breaking down…" : "Generate subtasks with AI"}</span>
              </button>
            </div>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write a clear summary of work required..."
              className="w-full resize-none rounded-xl border border-border bg-elevated px-3.5 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all font-sans leading-relaxed"
            />
            <p className="mt-1 text-[11px] text-muted">
              Clicking the AI button breaks this description down into actionable checklist items below.
            </p>
          </div>

          {/* Subtasks Checklist */}
          <div className="rounded-2xl border border-border/80 bg-elevated/30 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text tracking-tight">
                Subtasks Checklist
              </label>
            </div>
            <ChecklistEditor items={checklist} onChange={setChecklist} />
          </div>

          {/* List and Due Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text tracking-tight">
                Column / List <span className="text-danger">*</span>
              </label>
              <select
                value={listId}
                onChange={(e) => setListId(e.target.value)}
                className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
              >
                {lists.map((l) => (
                  <option key={l._id} value={l._id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text tracking-tight">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
              />
            </div>
          </div>

          {/* Assignee */}
          {members.length > 0 && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-text tracking-tight">
                Assignee
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full rounded-xl border border-border bg-elevated px-3 py-2.5 text-sm text-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all cursor-pointer"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* File Attachment */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text tracking-tight">
              File Attachment (Direct-to-S3)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFilePick}
              className="hidden"
            />
            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
              >
                {file ? "Change file" : "Upload file"}
              </Button>
              {(file || attachmentUrl) && (
                <div className="flex items-center gap-1.5 rounded-xl border border-border bg-elevated px-3 py-1.5 text-xs text-text max-w-full">
                  <Paperclip className="h-3.5 w-3.5 text-ai shrink-0" />
                  <span className="truncate max-w-[220px]">
                    {file ? file.name : attachmentUrl.split("/").pop()}
                  </span>
                  {file && (
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-muted hover:text-danger p-0.5 ml-1"
                      aria-label="Remove pending file"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Comments Section (in edit mode) */}
          {isEdit && (
            <div className="pt-2 border-t border-border/80">
              <label className="mb-2 block text-xs font-semibold text-text tracking-tight">
                Team Discussion
              </label>
              <CommentSection
                taskId={currentTaskId}
                comments={comments}
                onAdded={(updatedTask) => {
                  setComments(updatedTask.comments || []);
                  setCurrentTaskId(updatedTask._id);
                  onUpdated(updatedTask);
                }}
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border/80 px-6 py-4 bg-surface">
          {isEdit ? (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={() => onDeleteRequest(task)}
            >
              Delete
            </Button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-2.5">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={busy}
              disabled={busy}
            >
              {uploading ? "Uploading file…" : isEdit ? "Save changes" : "Create task"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
