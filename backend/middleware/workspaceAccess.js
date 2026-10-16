const mongoose = require("mongoose");
const Workspace = require("../models/Workspace");
const List = require("../models/List");
const Task = require("../models/Task");

/**
 * Middleware factory to enforce workspace membership.
 * Verifies that the authenticated user (req.user._id) is a member of the resolved workspace.
 */
const requireMember = (getWsId, notFoundMessage = "Workspace not found") => async (req, res, next) => {
  try {
    const wsId = await getWsId(req);
    if (!wsId || !mongoose.isValidObjectId(wsId)) {
      return res.status(404).json({ message: notFoundMessage });
    }

    const isMember = await Workspace.exists({
      _id: wsId,
      members: req.user._id,
    });

    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: You are not a member of this workspace" });
    }

    req.workspaceId = String(wsId);
    next();
  } catch (error) {
    next(error);
  }
};

// Extractor middlewares
const viaWorkspaceParam = requireMember(
  (req) => req.params.workspaceId,
  "Workspace not found"
);

const viaBodyWorkspace = requireMember(
  (req) => req.body.workspace,
  "Workspace not found"
);

const viaTaskId = requireMember(
  async (req) => {
    if (!mongoose.isValidObjectId(req.params.id)) return null;
    const task = await Task.findById(req.params.id).select("workspace");
    return task?.workspace;
  },
  "Task not found"
);

const viaListId = requireMember(
  async (req) => {
    if (!mongoose.isValidObjectId(req.params.id)) return null;
    const list = await List.findById(req.params.id).select("workspace");
    return list?.workspace;
  },
  "List not found"
);

module.exports = {
  requireMember,
  viaWorkspaceParam,
  viaBodyWorkspace,
  viaTaskId,
  viaListId,
};
