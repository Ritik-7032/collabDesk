import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api, { getErrorMessage } from "../lib/api";
import { getSocket } from "../lib/socket";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import AppShell from "../components/AppShell";
import ListColumn from "../components/ListColumn";
import TaskModal from "../components/TaskModal";
import UpgradeModal from "../components/UpgradeModal";
import ConfirmDialog from "../components/ConfirmDialog";
import InviteModal from "../components/InviteModal";
import SlackModal from "../components/SlackModal";
import { KanbanColumnSkeleton } from "../components/ui/Skeleton";
import { AvatarGroup } from "../components/ui/Avatar";
import Button from "../components/ui/Button";
import {
  ArrowLeft,
  Plus,
  Search,
  UserPlus,
} from "lucide-react";

function codePrefix(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CD";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [workspaceName, setWorkspaceName] = useState(location.state?.workspaceName || "");
  const [ownerId, setOwnerId] = useState("");
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");
  const [members, setMembers] = useState([]);
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // { mode: 'create' | 'edit', task?, defaultListId? }
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [listToDelete, setListToDelete] = useState(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [addingList, setAddingList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [draggedListId, setDraggedListId] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [listsRes, tasksRes] = await Promise.all([
        api.get(`/lists/workspace/${workspaceId}`),
        api.get(`/tasks/workspace/${workspaceId}`),
      ]);
      setLists(listsRes.data);
      setTasks(tasksRes.data);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't load board"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  useEffect(() => {
    api
      .get(`/workspaces/${workspaceId}`)
      .then((res) => {
        setWorkspaceName(res.data.name);
        setOwnerId(res.data.owner);
        setSlackWebhookUrl(res.data.slackWebhookUrl || "");
        setMembers(res.data.members || []);
      })
      .catch(() => {});
  }, [workspaceId]);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();
    socket.emit("joinWorkspace", workspaceId);

    const onConnectError = (err) => {
      console.warn("Socket connection error:", err.message);
      if (err.message && err.message.toLowerCase().includes("unauthorized")) {
        navigate("/login");
      }
    };
    socket.on("connect_error", onConnectError);

    const sameWorkspace = (entity) => entity.workspace === workspaceId;

    const onTaskUpdated = (task) => {
      if (!sameWorkspace(task)) return;
      setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)));
    };
    const onTaskCreated = (task) => {
      if (!sameWorkspace(task)) return;
      setTasks((prev) => (prev.some((t) => t._id === task._id) ? prev : [...prev, task]));
    };
    const onTaskDeleted = (payload) => {
      setTasks((prev) => prev.filter((t) => t._id !== payload._id));
    };
    const onTasksReordered = () => {
      fetchAll();
    };
    const onListCreated = (list) => {
      if (!sameWorkspace(list)) return;
      setLists((prev) => (prev.some((l) => l._id === list._id) ? prev : [...prev, list]));
    };
    const onListUpdated = (list) => {
      setLists((prev) => prev.map((l) => (l._id === list._id ? list : l)));
    };
    const onListDeleted = (payload) => {
      setLists((prev) => prev.filter((l) => l._id !== payload._id));
    };
    const onListsReordered = () => {
      fetchAll();
    };
    const onWorkspaceUpdated = (updatedWs) => {
      if (updatedWs._id === workspaceId) {
        setMembers(updatedWs.members || []);
        setWorkspaceName(updatedWs.name || "");
      }
    };

    socket.on("taskUpdated", onTaskUpdated);
    socket.on("taskCreated", onTaskCreated);
    socket.on("taskDeleted", onTaskDeleted);
    socket.on("tasksReordered", onTasksReordered);
    socket.on("listCreated", onListCreated);
    socket.on("listUpdated", onListUpdated);
    socket.on("listDeleted", onListDeleted);
    socket.on("listsReordered", onListsReordered);
    socket.on("workspaceUpdated", onWorkspaceUpdated);

    return () => {
      socket.off("taskUpdated", onTaskUpdated);
      socket.off("taskCreated", onTaskCreated);
      socket.off("taskDeleted", onTaskDeleted);
      socket.off("tasksReordered", onTasksReordered);
      socket.off("listCreated", onListCreated);
      socket.off("listUpdated", onListUpdated);
      socket.off("listDeleted", onListDeleted);
      socket.off("listsReordered", onListsReordered);
      socket.off("workspaceUpdated", onWorkspaceUpdated);
      socket.off("connect_error", onConnectError);
      socket.emit("leaveWorkspace", workspaceId);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId, fetchAll]);

  const prefix = useMemo(() => codePrefix(workspaceName), [workspaceName]);

  const uniqueTasks = useMemo(() => {
    const seen = new Set();
    return tasks.filter((t) => {
      if (!t?._id || seen.has(t._id)) return false;
      seen.add(t._id);
      return true;
    });
  }, [tasks]);

  const sortedTasks = useMemo(
    () => [...uniqueTasks].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    [uniqueTasks]
  );

  const codeFor = useCallback(
    (taskId) => {
      const idx = sortedTasks.findIndex((t) => t._id === taskId);
      return `${prefix}-${String(idx + 1).padStart(3, "0")}`;
    },
    [sortedTasks, prefix]
  );

  const sortedLists = useMemo(() => [...lists].sort((a, b) => a.position - b.position), [lists]);

  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return uniqueTasks;
    const q = searchQuery.toLowerCase();
    return uniqueTasks.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        codeFor(t._id).toLowerCase().includes(q) ||
        t.labels?.some((l) => l.name?.toLowerCase().includes(q))
    );
  }, [uniqueTasks, searchQuery, codeFor]);

  const tasksForList = useCallback(
    (listId) =>
      filteredTasks
        .filter((t) => t.list === listId)
        .sort((a, b) => a.position - b.position),
    [filteredTasks]
  );

  const handleDropTask = async (destListId, destIndex, taskId) => {
    const movedTask = tasks.find((t) => t._id === taskId);
    if (!movedTask) return;

    const destTasksExcludingMoved = tasksForList(destListId).filter((t) => t._id !== taskId);
    const newOrder = [...destTasksExcludingMoved];
    newOrder.splice(destIndex, 0, { ...movedTask, list: destListId });

    const updates = newOrder.map((t, idx) => ({ _id: t._id, list: destListId, position: idx }));

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => {
        const u = updates.find((up) => up._id === t._id);
        return u ? { ...t, list: u.list, position: u.position } : t;
      })
    );

    try {
      await api.put("/tasks/reorder/bulk", { updates });
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't move task"));
      fetchAll();
    }
  };

  const handleListDrop = async (targetList) => {
    if (!draggedListId || draggedListId === targetList._id) {
      setDraggedListId(null);
      return;
    }
    const current = sortedLists.filter((l) => l._id !== draggedListId);
    const draggedList = sortedLists.find((l) => l._id === draggedListId);
    const targetIdx = current.findIndex((l) => l._id === targetList._id);
    current.splice(targetIdx, 0, draggedList);

    const updates = current.map((l, idx) => ({ _id: l._id, position: idx }));
    setLists((prev) =>
      prev.map((l) => {
        const u = updates.find((up) => up._id === l._id);
        return u ? { ...l, position: u.position } : l;
      })
    );
    setDraggedListId(null);

    try {
      await api.put("/lists/reorder", { updates });
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't reorder lists"));
      fetchAll();
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    try {
      const res = await api.post("/lists", { name: newListName.trim(), workspace: workspaceId });
      setLists((prev) => (prev.some((l) => l._id === res.data._id) ? prev : [...prev, res.data]));
      setNewListName("");
      setAddingList(false);
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't create list"));
    }
  };

  const handleRenameList = async (list, name) => {
    setLists((prev) => prev.map((l) => (l._id === list._id ? { ...l, name } : l)));
    try {
      await api.put(`/lists/${list._id}`, { name });
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't rename list"));
      fetchAll();
    }
  };

  const handleDeleteList = async () => {
    if (!listToDelete) return;
    try {
      await api.delete(`/lists/${listToDelete._id}`);
      setLists((prev) => prev.filter((l) => l._id !== listToDelete._id));
      setTasks((prev) => prev.filter((t) => t.list !== listToDelete._id));
      toast.success("List deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't delete list"));
    } finally {
      setListToDelete(null);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete._id}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskToDelete._id));
      toast.success("Task deleted");
    } catch (err) {
      toast.error(getErrorMessage(err, "Couldn't delete task"));
    } finally {
      setTaskToDelete(null);
      setModal(null);
    }
  };

  return (
    <AppShell onUpgradeClick={() => setShowUpgrade(true)}>
      {/* Breadcrumb / Back button */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-text transition-colors cursor-pointer group"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Workspaces</span>
        </button>
      </div>

      {/* Board Top Header Toolbar */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-text truncate max-w-md">
              {workspaceName || "Project Board"}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-2.5 py-0.5 text-[11px] font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Live Sync
            </span>
          </div>
          <p className="font-mono text-xs text-muted">
            {prefix} · {tasks.length} task{tasks.length === 1 ? "" : "s"} · {members.length} member{members.length === 1 ? "" : "s"}
          </p>
        </div>

        {/* Action Controls & Team Stack */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted pointer-events-none" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter tasks..."
              className="w-40 sm:w-48 rounded-xl border border-border bg-elevated/70 pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
            />
          </div>

          {/* Member Stack */}
          {members.length > 0 && (
            <AvatarGroup members={members} max={4} size="sm" className="mr-1" />
          )}

          {/* Invite Member */}
          <Button
            variant="secondary"
            size="sm"
            icon={UserPlus}
            onClick={() => setShowInviteModal(true)}
          >
            Invite
          </Button>

          {/* Slack Webhook Config */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowSlackModal(true)}
            className="relative"
          >
            <span className="text-[#ECB22E] font-bold text-xs">#</span>
            <span>Slack</span>
            {slackWebhookUrl && (
              <span className="h-1.5 w-1.5 rounded-full bg-success" title="Slack integration active" />
            )}
          </Button>

          {/* Add Task Primary Action */}
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            disabled={sortedLists.length === 0}
            onClick={() => setModal({ mode: "create", defaultListId: sortedLists[0]?._id })}
          >
            Add task
          </Button>
        </div>
      </div>

      {/* Board Columns Area */}
      {loading ? (
        <div className="flex items-start gap-4 overflow-x-auto pb-6">
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
          <KanbanColumnSkeleton />
        </div>
      ) : (
        <div className="flex items-start gap-4 overflow-x-auto pb-6 min-h-[500px]">
          {sortedLists.map((list) => (
            <ListColumn
              key={list._id}
              list={list}
              tasks={tasksForList(list._id)}
              members={members}
              codeFor={codeFor}
              onOpenTask={(t) => setModal({ mode: "edit", task: t })}
              onDeleteTask={(t) => setTaskToDelete(t)}
              onAddTask={(listId) => setModal({ mode: "create", defaultListId: listId })}
              onRenameList={handleRenameList}
              onDeleteList={(l) => setListToDelete(l)}
              onDropTask={handleDropTask}
              onListDragStart={(l) => setDraggedListId(l._id)}
              onListDrop={handleListDrop}
              isListDragTarget={false}
            />
          ))}

          {/* New Column Creator */}
          <div className="w-[300px] shrink-0">
            {addingList ? (
              <form
                onSubmit={handleCreateList}
                className="rounded-2xl border border-primary/50 bg-surface p-4 shadow-card animate-modal-in"
              >
                <input
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  onBlur={() => {
                    if (!newListName.trim()) setAddingList(false);
                  }}
                  placeholder="Column name (e.g. In Review)..."
                  className="w-full rounded-xl border border-border bg-elevated px-3 py-2 text-xs font-medium text-text placeholder:text-muted/60 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40"
                />
                <div className="mt-2.5 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setAddingList(false);
                      setNewListName("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="xs">
                    Add column
                  </Button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAddingList(true)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-surface/30 hover:bg-surface hover:border-primary/50 px-4 py-3.5 text-xs font-medium text-muted hover:text-text transition-all duration-150 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add column</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Task Modal (Create & Edit) */}
      {modal && (
        <TaskModal
          mode={modal.mode}
          task={modal.task}
          code={modal.task ? codeFor(modal.task._id) : null}
          workspaceId={workspaceId}
          members={members}
          lists={sortedLists}
          defaultListId={modal.defaultListId}
          onClose={() => setModal(null)}
          onCreated={(task) =>
            setTasks((prev) => (prev.some((t) => t._id === task._id) ? prev : [...prev, task]))
          }
          onUpdated={(task) => setTasks((prev) => prev.map((t) => (t._id === task._id ? task : t)))}
          onDeleteRequest={(task) => setTaskToDelete(task)}
        />
      )}

      {/* Confirmation Dialogs */}
      {taskToDelete && (
        <ConfirmDialog
          title="Delete this task?"
          message={`"${taskToDelete.title}" will be permanently removed for everyone in this workspace.`}
          confirmLabel="Delete task"
          danger
          onCancel={() => setTaskToDelete(null)}
          onConfirm={handleDeleteTask}
        />
      )}

      {listToDelete && (
        <ConfirmDialog
          title="Delete this column?"
          message={`"${listToDelete.name}" and all ${tasksForList(listToDelete._id).length} task(s) in it will be removed for everyone.`}
          confirmLabel="Delete column"
          danger
          onCancel={() => setListToDelete(null)}
          onConfirm={handleDeleteList}
        />
      )}

      {/* Modals for Upgrade, Invites, Slack */}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {showInviteModal && (
        <InviteModal
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          members={members}
          ownerId={ownerId}
          currentUserId={user?._id || user?.id}
          onMembersUpdated={(newMembers) => setMembers(newMembers)}
          onClose={() => setShowInviteModal(false)}
        />
      )}

      {showSlackModal && (
        <SlackModal
          workspaceId={workspaceId}
          initialWebhookUrl={slackWebhookUrl}
          onWebhookUpdated={(url) => setSlackWebhookUrl(url)}
          onClose={() => setShowSlackModal(false)}
        />
      )}
    </AppShell>
  );
}
