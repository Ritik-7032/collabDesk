const mongoose = require("mongoose");
const Task = require("../models/Task");
const Workspace = require("../models/Workspace");
const List = require("../models/List");
const User = require("../models/User");
const { notifyTaskEvent } = require("../utils/slackNotifier");

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      workspace,
      list,
      assignedTo,
      attachmentUrl,
      labels,
      dueDate,
    } = req.body;

    if (!list) {
      return res.status(400).json({ message: "list is required" });
    }

    // Verify target list belongs to this workspace
    const listDoc = await List.findById(list);
    if (!listDoc || listDoc.workspace.toString() !== String(workspace)) {
      return res.status(400).json({ message: "Target list does not belong to this workspace" });
    }

    const count = await Task.countDocuments({ list });

    const task = await Task.create({
      title,
      description,
      workspace,
      list,
      position: count,
      assignedTo,
      attachmentUrl,
      labels,
      dueDate: dueDate || null,
      createdBy: req.user._id,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${task.workspace}`).emit("taskCreated", task);
    }

    // Asynchronously send Slack alert if configured
    (async () => {
      try {
        const ws = await Workspace.findById(workspace);
        if (ws?.slackWebhookUrl) {
          let assigneeName = null;
          if (assignedTo) {
            const assigneeUser = await User.findById(assignedTo);
            assigneeName = assigneeUser?.name;
          }
          notifyTaskEvent({
            workspace: ws,
            eventType: "task_created",
            task,
            listName: listDoc?.name,
            actorName: req.user.name,
            assigneeName,
          });
        }
      } catch (err) {
        console.warn("Slack notification error:", err.message);
      }
    })();

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTasksByWorkspace = async (req, res) => {
  try {
    const tasks = await Task.find({ workspace: req.params.workspaceId }).sort("position");
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const {
      status,
      title,
      description,
      attachmentUrl,
      assignedTo,
      list,
      position,
      labels,
      dueDate,
      checklist,
    } = req.body;

    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Prevent cross-workspace list relocation
    if (list && list.toString() !== oldTask.list.toString()) {
      const targetList = await List.findById(list);
      if (!targetList || targetList.workspace.toString() !== oldTask.workspace.toString()) {
        return res.status(400).json({ message: "Target list does not belong to this workspace" });
      }
    }

    const update = {};
    if (status !== undefined) update.status = status;
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (attachmentUrl !== undefined) update.attachmentUrl = attachmentUrl;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (list !== undefined) update.list = list;
    if (position !== undefined) update.position = position;
    if (labels !== undefined) update.labels = labels;
    if (dueDate !== undefined) update.dueDate = dueDate;
    if (checklist !== undefined) update.checklist = checklist;

    const isListChanged = list && oldTask.list && list.toString() !== oldTask.list.toString();
    const task = await Task.findByIdAndUpdate(req.params.id, update, { new: true });

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${task.workspace}`).emit("taskUpdated", task);
    }

    // If list changed, send Slack notification
    if (isListChanged) {
      (async () => {
        try {
          const ws = await Workspace.findById(task.workspace);
          if (ws?.slackWebhookUrl) {
            const listDoc = await List.findById(task.list);
            notifyTaskEvent({
              workspace: ws,
              eventType: "task_moved",
              task,
              listName: listDoc?.name,
              actorName: req.user.name,
            });
          }
        } catch (err) {
          console.warn("Slack task move notification error:", err.message);
        }
      })();
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reorderTasksBulk = async (req, res) => {
  try {
    const { updates } = req.body; // [{ _id, list, position }]
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "updates array is required" });
    }

    const ids = updates.map((u) => u._id);
    if (ids.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: "Invalid task ID in updates" });
    }

    const tasks = await Task.find({ _id: { $in: ids } }).select("workspace list");
    if (tasks.length !== ids.length) {
      return res.status(404).json({ message: "One or more tasks not found" });
    }

    const wsId = tasks[0].workspace.toString();
    const isCrossWorkspace = tasks.some((t) => t.workspace.toString() !== wsId);
    if (isCrossWorkspace) {
      return res.status(400).json({ message: "Tasks must belong to the same workspace" });
    }

    const isMember = await Workspace.exists({ _id: wsId, members: req.user._id });
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: You are not a member of this workspace" });
    }

    const bulkOps = updates.map((u) => ({
      updateOne: {
        filter: { _id: u._id, workspace: wsId },
        update: { $set: { list: u.list, position: u.position } },
      },
    }));
    await Task.bulkWrite(bulkOps);

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${wsId}`).emit("tasksReordered", updates);
    }

    res.json({ message: "Tasks reordered" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          comments: {
            text: text.trim(),
            author: req.user._id,
            authorName: req.user.name,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!task) return res.status(404).json({ message: "Task not found" });

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${task.workspace}`).emit("taskUpdated", task);
    }

    // Slack comment notification
    (async () => {
      try {
        const ws = await Workspace.findById(task.workspace);
        if (ws?.slackWebhookUrl) {
          notifyTaskEvent({
            workspace: ws,
            eventType: "comment_added",
            task: { ...task.toObject(), description: text.trim() },
            actorName: req.user.name,
          });
        }
      } catch (err) {
        console.warn("Slack comment notification error:", err.message);
      }
    })();

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (task) {
      const io = req.app.get("io");
      if (io) {
        io.to(`workspace:${task.workspace}`).emit("taskDeleted", {
          _id: task._id,
          workspace: task.workspace,
        });
      }
    }

    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasksByWorkspace,
  updateTask,
  reorderTasksBulk,
  addComment,
  deleteTask,
};
