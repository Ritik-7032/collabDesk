const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  addMember,
  removeMember,
  updateSlackWebhook,
  testSlackWebhook,
} = require("../controllers/workspaceController");

router.post("/", protect, createWorkspace);
router.get("/", protect, getWorkspaces);
router.get("/:id", protect, getWorkspaceById);

// Team member management
router.post("/:id/members", protect, addMember);
router.delete("/:id/members/:memberId", protect, removeMember);

// Slack Webhook integration
router.patch("/:id/slack-webhook", protect, updateSlackWebhook);
router.put("/:id/slack-webhook", protect, updateSlackWebhook);
router.post("/:id/slack-test", protect, testSlackWebhook);

module.exports = router;