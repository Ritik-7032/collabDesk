// One-time migration: run this ONCE after deploying the new List-based schema.
// It creates default lists (To do / In progress / Done) for any workspace
// that doesn't have lists yet, and re-points old tasks (which only had a
// `status` field) to the matching new list.
//
// Usage:  node scripts/migrateLists.js

require("dotenv").config();
const dbConnect = require("../config/db");
const Workspace = require("../models/Workspace");
const List = require("../models/List");
const Task = require("../models/Task");

const DEFAULT_LISTS = [
  { name: "To do", color: "teal", status: "todo" },
  { name: "In progress", color: "blue", status: "in-progress" },
  { name: "Done", color: "green", status: "done" },
];

async function migrate() {
  await dbConnect();
  console.log("Connected. Starting migration...");

  const workspaces = await Workspace.find({});
  let workspacesMigrated = 0;
  let tasksMigrated = 0;

  for (const workspace of workspaces) {
    let lists = await List.find({ workspace: workspace._id }).sort("position");

    if (lists.length === 0) {
      lists = await List.insertMany(
        DEFAULT_LISTS.map((l, i) => ({
          name: l.name,
          color: l.color,
          workspace: workspace._id,
          position: i,
        }))
      );
      workspacesMigrated++;
    }

    const statusToListId = {};
    DEFAULT_LISTS.forEach((d) => {
      const match = lists.find((l) => l.name === d.name);
      if (match) statusToListId[d.status] = match._id;
    });

    const tasksWithoutList = await Task.find({
      workspace: workspace._id,
      $or: [{ list: { $exists: false } }, { list: null }],
    });

    for (const task of tasksWithoutList) {
      const targetList = statusToListId[task.status] || lists[0]._id;
      const count = await Task.countDocuments({ list: targetList });
      task.list = targetList;
      task.position = count;
      await task.save();
      tasksMigrated++;
    }
  }

  console.log(`Done. Workspaces given default lists: ${workspacesMigrated}. Tasks migrated: ${tasksMigrated}.`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
