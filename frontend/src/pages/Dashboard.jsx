import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { getErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AppShell from "../components/AppShell";
import UpgradeModal from "../components/UpgradeModal";
import { Card } from "../components/ui/Card";
import { AvatarGroup } from "../components/ui/Avatar";
import { Skeleton } from "../components/ui/Skeleton";
import Button from "../components/ui/Button";
import {
  Crown,
  Kanban,
  Layers,
  Plus,
  ArrowRight,
  FolderPlus,
  Users,
} from "lucide-react";

function WorkspaceCard({ workspace, onOpen }) {
  const memberCount = workspace.members?.length || 1;
  const createdStr = new Date(workspace.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card
      clickable
      onClick={() => onOpen(workspace)}
      className="group flex flex-col justify-between p-6 transition-all duration-200 hover:border-primary/40 hover:shadow-card hover:-translate-y-1"
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 transition-transform group-hover:scale-105">
            <Kanban className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-mono text-muted">{createdStr}</span>
        </div>

        <h3 className="text-base font-semibold text-text group-hover:text-primary transition-colors tracking-tight truncate mb-1">
          {workspace.name}
        </h3>
        <p className="text-xs text-muted leading-relaxed">
          Real-time collaborative Kanban board
        </p>
      </div>

      <div className="flex items-center justify-between pt-5 mt-4 border-t border-border/70">
        <div className="flex items-center gap-2">
          {workspace.members && workspace.members.length > 0 ? (
            <AvatarGroup members={workspace.members} max={3} size="xs" />
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Users className="h-3.5 w-3.5" />
              <span>{memberCount} member</span>
            </span>
          )}
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted group-hover:text-primary transition-colors">
          Open board <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { user, isPremium } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get("/workspaces");
      setWorkspaces(res.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't load workspaces"));
    }
  };

  useEffect(() => {
    fetchWorkspaces().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const res = await api.post("/workspaces", { name: name.trim() });
      setWorkspaces((w) => [res.data, ...w]);
      setName("");
      toast.success("Workspace created successfully");
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't create workspace"));
    } finally {
      setCreating(false);
    }
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "there";

  return (
    <AppShell onUpgradeClick={() => setShowUpgrade(true)}>
      {/* Welcome Banner Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text">
            Welcome back, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed">
            Select a project board or spin up a new collaborative workspace.
          </p>
        </div>
      </div>

      {/* Free Plan Upgrade Banner */}
      {!isPremium && (
        <div className="mb-8 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle">
          <div className="flex items-center gap-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary border border-primary/25">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-text tracking-tight">
                Unlock CollabDesk Pro
              </p>
              <p className="text-xs text-muted mt-0.5">
                Enjoy unlimited AI task breakdowns, direct S3 uploads, and instant Slack notifications.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={Crown}
            onClick={() => setShowUpgrade(true)}
            className="self-start sm:self-auto shrink-0"
          >
            Upgrade Plan
          </Button>
        </div>
      )}

      {/* Create Workspace Inline Bar */}
      <form
        onSubmit={handleCreate}
        className="mb-8 flex flex-col sm:flex-row gap-3 rounded-2xl border border-border bg-surface p-3.5 sm:p-4 shadow-subtle"
      >
        <div className="relative flex-1">
          <Layers className="absolute left-3.5 top-3 h-4 w-4 text-muted pointer-events-none" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name your new workspace (e.g. Q4 Growth Sprint)..."
            className="w-full rounded-xl border border-border bg-elevated pl-10 pr-3.5 py-2.5 text-sm text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          size="md"
          icon={Plus}
          loading={creating}
          disabled={creating || !name.trim()}
        >
          Create workspace
        </Button>
      </form>

      {/* Workspaces Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-6 space-y-4">
              <div className="flex justify-between items-center">
                <Skeleton className="h-10 w-10 rounded-2xl" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="pt-4 border-t border-border/60 flex justify-between">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-border bg-surface/40 py-16 px-4 text-center max-w-lg mx-auto">
          <span className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-elevated border border-border text-muted mb-4">
            <FolderPlus className="h-6 w-6" />
          </span>
          <h3 className="text-base font-semibold text-text tracking-tight mb-1">
            No workspaces yet
          </h3>
          <p className="text-xs text-muted leading-relaxed max-w-xs mx-auto mb-5">
            Create your first workspace using the bar above to start planning tasks with your team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((ws) => (
            <WorkspaceCard
              key={ws._id}
              workspace={ws}
              onOpen={(w) =>
                navigate(`/workspace/${w._id}`, { state: { workspaceName: w.name } })
              }
            />
          ))}
        </div>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </AppShell>
  );
}
