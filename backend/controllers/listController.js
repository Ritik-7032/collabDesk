const mongoose = require("mongoose");
const List = require("../models/List");
const Task = require("../models/Task");
const Workspace = require("../models/Workspace");

const createList = async (req, res) => {
  try {
    const { name, workspace } = req.body;
    if (!name || !workspace) {
      return res.status(400).json({ message: "name and workspace are required" });
    }

    const count = await List.countDocuments({ workspace });
    const list = await List.create({ name, workspace, position: count });

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${list.workspace}`).emit("listCreated", list);
    }

    res.status(201).json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getListsByWorkspace = async (req, res) => {
  try {
    const lists = await List.find({ workspace: req.params.workspaceId }).sort("position");
    res.json(lists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reorderLists = async (req, res) => {
  try {
    const { updates } = req.body; // [{ _id, position }]
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: "updates array is required" });
    }

    const ids = updates.map((u) => u._id);
    if (ids.some((id) => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ message: "Invalid list ID in updates" });
    }

    const lists = await List.find({ _id: { $in: ids } }).select("workspace");
    if (lists.length !== ids.length) {
      return res.status(404).json({ message: "One or more lists not found" });
    }

    const wsId = lists[0].workspace.toString();
    const isCrossWorkspace = lists.some((l) => l.workspace.toString() !== wsId);
    if (isCrossWorkspace) {
      return res.status(400).json({ message: "Lists must belong to the same workspace" });
    }

    const isMember = await Workspace.exists({ _id: wsId, members: req.user._id });
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: You are not a member of this workspace" });
    }

    const bulkOps = updates.map((u) => ({
      updateOne: {
        filter: { _id: u._id, workspace: wsId },
        update: { $set: { position: u.position } },
      },
    }));
    await List.bulkWrite(bulkOps);

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${wsId}`).emit("listsReordered", updates);
    }

    res.json({ message: "Lists reordered" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateList = async (req, res) => {
  try {
    const { name } = req.body;
    const list = await List.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!list) return res.status(404).json({ message: "List not found" });

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${list.workspace}`).emit("listUpdated", list);
    }

    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteList = async (req, res) => {
  try {
    const list = await List.findByIdAndDelete(req.params.id);
    if (!list) return res.status(404).json({ message: "List not found" });

    const deletedTasks = await Task.find({ list: list._id }, "_id");
    await Task.deleteMany({ list: list._id });

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${list.workspace}`).emit("listDeleted", {
        _id: list._id,
        workspace: list.workspace,
      });
      deletedTasks.forEach((t) => {
        io.to(`workspace:${list.workspace}`).emit("taskDeleted", {
          _id: t._id,
          workspace: list.workspace,
        });
      });
    }

    res.json({ message: "List deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createList,
  getListsByWorkspace,
  reorderLists,
  updateList,
  deleteList,
};
