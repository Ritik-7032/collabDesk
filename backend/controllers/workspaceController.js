const Workspace = require("../models/Workspace");
const List = require("../models/List");
const User = require("../models/User");
const { sendSlackTest } = require("../utils/slackNotifier");

const DEFAULT_LISTS = [
  { name: "To do", color: "teal" },
  { name: "In progress", color: "blue" },
  { name: "Done", color: "green" },
];

const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Workspace name is required" });
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      owner: req.user._id,
      members: [req.user._id],
    });

    await List.insertMany(
      DEFAULT_LISTS.map((l, i) => ({
        name: l.name,
        color: l.color,
        workspace: workspace._id,
        position: i,
      }))
    );

    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ members: req.user._id }).populate(
      "members",
      "name email"
    );
    res.json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWorkspaceById = async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      members: req.user._id,
    }).populate("members", "name email");

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addMember = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const workspace = await Workspace.findOne({
      _id: req.params.id,
      members: req.user._id,
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found or unauthorized" });
    }

    const userToAdd = await User.findOne({ email: email.trim().toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({
        message: "No user found with this email. Ask them to sign up on CollabDesk first!",
      });
    }

    if (workspace.members.some((m) => m.toString() === userToAdd._id.toString())) {
      return res.status(400).json({ message: "User is already a member of this workspace" });
    }

    workspace.members.push(userToAdd._id);
    await workspace.save();

    const updatedWorkspace = await Workspace.findById(workspace._id).populate(
      "members",
      "name email"
    );

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${workspace._id}`).emit("workspaceUpdated", updatedWorkspace);
      io.emit("workspaceUpdated", updatedWorkspace);
    }

    res.status(200).json({
      message: `${userToAdd.name} added to workspace successfully!`,
      members: updatedWorkspace.members,
      workspace: updatedWorkspace,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.id);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const isOwner = workspace.owner.toString() === req.user._id.toString();
    const isSelf = req.params.memberId === req.user._id.toString();

    if (!isOwner && !isSelf) {
      return res.status(403).json({ message: "Only workspace owner can remove other members" });
    }

    if (req.params.memberId === workspace.owner.toString()) {
      return res.status(400).json({ message: "Cannot remove the workspace owner" });
    }

    workspace.members = workspace.members.filter(
      (m) => m.toString() !== req.params.memberId
    );
    await workspace.save();

    const updatedWorkspace = await Workspace.findById(workspace._id).populate(
      "members",
      "name email"
    );

    const io = req.app.get("io");
    if (io) {
      io.to(`workspace:${workspace._id}`).emit("workspaceUpdated", updatedWorkspace);
      io.emit("workspaceUpdated", updatedWorkspace);
    }

    res.json({ message: "Member removed", members: updatedWorkspace.members });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSlackWebhook = async (req, res) => {
  try {
    const { slackWebhookUrl } = req.body;
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      members: req.user._id,
    });

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    if (slackWebhookUrl && !slackWebhookUrl.startsWith("https://hooks.slack.com/")) {
      return res.status(400).json({
        message: "Invalid Slack Webhook URL. Must start with https://hooks.slack.com/",
      });
    }

    workspace.slackWebhookUrl = (slackWebhookUrl || "").trim();
    await workspace.save();

    res.json({
      message: "Slack webhook URL updated",
      slackWebhookUrl: workspace.slackWebhookUrl,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const testSlackWebhook = async (req, res) => {
  try {
    const workspace = await Workspace.findOne({
      _id: req.params.id,
      members: req.user._id,
    });

    if (!workspace || !workspace.slackWebhookUrl) {
      return res.status(400).json({ message: "No Slack webhook configured for this workspace" });
    }

    await sendSlackTest(workspace.slackWebhookUrl, workspace.name, req.user.name);

    res.json({ message: "Test alert sent to Slack channel successfully!" });
  } catch (error) {
    res.status(500).json({ message: `Slack delivery failed: ${error.message}` });
  }
};

module.exports = {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  addMember,
  removeMember,
  updateSlackWebhook,
  testSlackWebhook,
};
