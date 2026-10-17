const mongoose = require("mongoose");

const labelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, required: true },
  },
  { _id: false }
);

const checklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  done: { type: Boolean, default: false },
});

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  authorName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    // Legacy field kept for backwards compatibility with older clients/data.
    status: {
      type: String,
      enum: ["todo", "in-progress", "done"],
      default: "todo",
    },
    list: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "List",
      required: true,
    },
    position: {
      type: Number,
      default: 0,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    attachmentUrl: {
      type: String,
      default: "",
    },
    labels: {
      type: [labelSchema],
      default: [],
    },
    dueDate: {
      type: Date,
      default: null,
    },
    checklist: {
      type: [checklistItemSchema],
      default: [],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

taskSchema.index({ workspace: 1, list: 1, position: 1 });
taskSchema.index({ workspace: 1, position: 1 });
taskSchema.index({ list: 1, position: 1 });

module.exports = mongoose.model("Task", taskSchema);
