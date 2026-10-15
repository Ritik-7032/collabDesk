const mongoose = require("mongoose");

const listSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    position: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "amber",
    },
  },
  { timestamps: true }
);

listSchema.index({ workspace: 1, position: 1 });

module.exports = mongoose.model("List", listSchema);
