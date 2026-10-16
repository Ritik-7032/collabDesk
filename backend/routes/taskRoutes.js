const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  viaWorkspaceParam,
  viaBodyWorkspace,
  viaTaskId,
} = require("../middleware/workspaceAccess");
const {
  createTask,
  getTasksByWorkspace,
  updateTask,
  reorderTasksBulk,
  addComment,
  deleteTask,
} = require("../controllers/taskController");

router.post("/", protect, viaBodyWorkspace, createTask);
router.get("/workspace/:workspaceId", protect, viaWorkspaceParam, getTasksByWorkspace);
router.put("/reorder/bulk", protect, reorderTasksBulk);
router.put("/:id", protect, viaTaskId, updateTask);
router.post("/:id/comments", protect, viaTaskId, addComment);
router.delete("/:id", protect, viaTaskId, deleteTask);

module.exports = router;
