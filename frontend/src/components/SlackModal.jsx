import { useState } from "react";
import api, { getErrorMessage } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { Hash, Send, X, Bell } from "lucide-react";
import Button from "./ui/Button";

export default function SlackModal({
  workspaceId,
  initialWebhookUrl = "",
  onWebhookUpdated,
  onClose,
}) {
  const [webhookUrl, setWebhookUrl] = useState(initialWebhookUrl);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const toast = useToast();

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.patch(`/workspaces/${workspaceId}/slack-webhook`, {
        slackWebhookUrl: webhookUrl.trim(),
      });
      toast.success(res.data.message || "Slack webhook updated!");
      if (onWebhookUpdated) onWebhookUpdated(res.data.slackWebhookUrl);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to save Slack webhook"));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!webhookUrl.trim()) {
      toast.error("Enter a Slack Webhook URL first");
      return;
    }
    setTesting(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/slack-test`);
      toast.success(res.data.message || "Test alert delivered to Slack channel!");
    } catch (err) {
      toast.error(getErrorMessage(err, "Test failed. Make sure URL is saved and valid."));
    } finally {
      setTesting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-lg animate-modal-in rounded-2xl border border-border bg-surface text-text shadow-elevated z-10 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4.5 bg-surface">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4A154B]/20 text-[#E01E5A] border border-[#E01E5A]/20">
              <Hash className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-text tracking-tight">
                Slack Webhook Integration
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Broadcast real-time board events straight into your team channel
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:text-text hover:bg-elevated transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-text block mb-1.5 tracking-tight">
              Incoming Webhook URL
            </label>
            <input
              type="url"
              placeholder="https://hooks.slack.com/services/T.../B.../..."
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full rounded-xl border border-border bg-elevated px-3.5 py-2.5 text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 font-mono transition-all"
            />
            <p className="mt-1.5 text-[11px] text-muted leading-relaxed">
              Generate a webhook in Slack under <strong>Apps &rarr; Incoming Webhooks</strong> and paste it here.
            </p>
          </div>

          <div className="rounded-xl border border-border/80 bg-elevated/40 p-3.5 text-xs text-muted space-y-1.5">
            <p className="font-semibold text-text flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-primary" /> Active Notification Triggers
            </p>
            <ul className="space-y-1 text-[11px] pl-5 list-disc text-muted">
              <li>New tasks created with priority and list mapping</li>
              <li>Cards moved between columns (including marked *Done*)</li>
              <li>Collaborator discussion comments posted</li>
            </ul>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/80">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={Send}
              loading={testing}
              disabled={testing || !webhookUrl.trim()}
              onClick={handleTest}
            >
              Send Test Ping
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={saving}
                disabled={saving}
              >
                Save Webhook
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
