import { useState } from "react";
import api, { getErrorMessage } from "../lib/api";
import { useToast } from "../context/ToastContext";
import { Mail, Trash2, X, LogOut } from "lucide-react";
import Button from "./ui/Button";
import { Avatar } from "./ui/Avatar";
import { Badge } from "./ui/Badge";

export default function InviteModal({
  workspaceId,
  workspaceName,
  members = [],
  ownerId,
  currentUserId,
  onMembersUpdated,
  onClose,
}) {
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState(null);
  const toast = useToast();

  const isOwner = ownerId === currentUserId;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setInviting(true);
    try {
      const res = await api.post(`/workspaces/${workspaceId}/members`, { email: email.trim() });
      toast.success(res.data.message || "Member invited to workspace!");
      setEmail("");
      if (onMembersUpdated) onMembersUpdated(res.data.members);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to add member"));
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId) => {
    setRemovingId(memberId);
    try {
      const res = await api.delete(`/workspaces/${workspaceId}/members/${memberId}`);
      toast.success(res.data.message || "Member removed");
      if (onMembersUpdated) onMembersUpdated(res.data.members);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to remove member"));
    } finally {
      setRemovingId(null);
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

      <div className="relative w-full max-w-md animate-modal-in rounded-2xl border border-border bg-surface text-text shadow-elevated z-10 overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 px-6 py-4.5 bg-surface">
          <div>
            <h2 className="text-base font-semibold text-text tracking-tight">Team Members</h2>
            <p className="text-xs text-muted mt-0.5">Collaborators on {workspaceName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:text-text hover:bg-elevated transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Invite form */}
          <form onSubmit={handleInvite} className="flex gap-2.5">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted pointer-events-none" />
              <input
                type="email"
                autoFocus
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-elevated pl-10 pr-3.5 py-2.5 text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={inviting}
              disabled={inviting || !email.trim()}
            >
              Invite
            </Button>
          </form>

          {/* Members list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-text tracking-tight">
                Active Members ({members.length})
              </label>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {members.map((m) => {
                const memberIsOwner = m._id === ownerId;
                const canRemove = (isOwner && !memberIsOwner) || m._id === currentUserId;

                return (
                  <div
                    key={m._id}
                    className="flex items-center justify-between rounded-xl border border-border/80 bg-elevated/40 hover:bg-elevated/80 px-3.5 py-2.5 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={m.name || m.email} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-text truncate">
                          {m.name} {m._id === currentUserId && <span className="text-[10px] text-muted">(You)</span>}
                        </p>
                        <p className="text-[11px] text-muted truncate">{m.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {memberIsOwner ? (
                        <Badge variant="primary" size="xs">
                          Owner
                        </Badge>
                      ) : (
                        canRemove && (
                          <button
                            type="button"
                            onClick={() => handleRemove(m._id)}
                            disabled={removingId === m._id}
                            className="rounded-lg p-1.5 text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                            title={m._id === currentUserId ? "Leave workspace" : "Remove member"}
                          >
                            {m._id === currentUserId ? (
                              <LogOut className="h-3.5 w-3.5" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
