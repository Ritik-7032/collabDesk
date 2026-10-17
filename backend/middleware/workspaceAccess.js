const mongoose = require("mongoose");
const Workspace = require("../models/Workspace");
const List = require("../models/List");
const Task = require("../models/Task");

const memberCache = new Map();
const MEMBER_CACHE_TTL_MS = 15000;

const invalidateMembershipCache = (wsId, userId) => {
  if (wsId && userId) {
    memberCache.delete(`${wsId}:${userId}`);
  } else if (wsId) {
    for (const key of memberCache.keys()) {
      if (key.startsWith(`${wsId}:`)) memberCache.delete(key);
    }
  }
};

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

    const cacheKey = `${wsId}:${req.user._id}`;
    const now = Date.now();
    const cached = memberCache.get(cacheKey);
    let isMember;

    if (cached && cached.exp > now) {
      isMember = cached.isMember;
    } else {
      isMember = await Workspace.exists({
        _id: wsId,
        members: req.user._id,
      });
      memberCache.set(cacheKey, { isMember: !!isMember, exp: now + MEMBER_CACHE_TTL_MS });
    }

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
  invalidateMembershipCache,
};
