const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createTask,
  getTasksByWorkspace,
  updateTask,
  reorderTasksBulk,
  addComment,
  deleteTask,
} = require("../controllers/taskController");

router.post("/", protect, createTask);
router.get("/workspace/:workspaceId", protect, getTasksByWorkspace);
router.put("/reorder/bulk", protect, reorderTasksBulk);
router.put("/:id", protect, updateTask);
router.post("/:id/comments", protect, addComment);
router.delete("/:id", protect, deleteTask);

module.exports = router;
