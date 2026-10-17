const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    slackWebhookUrl: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

workspaceSchema.index({ members: 1 });
workspaceSchema.index({ owner: 1 });

module.exports = mongoose.model("Workspace", workspaceSchema);