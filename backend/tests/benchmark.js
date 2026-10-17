process.env.NODE_ENV = "test";
const autocannon = require("autocannon");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { server } = require("../server");
const dbConnect = require("../config/db");
const User = require("../models/User");
const Workspace = require("../models/Workspace");
const List = require("../models/List");
const Task = require("../models/Task");

async function runBenchmark() {
  await dbConnect();

  // 1. Seed benchmark user & workspace
  const user = await User.create({
    name: "Load Test User",
    email: `load_${Date.now()}@collabdesk.benchmark`,
    password: "TestPassword123!",
  });

  const workspace = await Workspace.create({
    name: "Benchmark Board",
    owner: user._id,
    members: [user._id],
  });

  const list = await List.create({
    name: "Sprint In Progress",
    workspace: workspace._id,
    position: 0,
  });

  // Seed 20 realistic task documents
  const tasks = [];
  for (let i = 0; i < 20; i++) {
    tasks.push({
      title: `Task Item #${i + 1}`,
      description: "Index retrieval test card with labels and checklists",
      workspace: workspace._id,
      list: list._id,
      position: i,
      createdBy: user._id,
      labels: [{ name: "Engineering", color: "blue" }],
    });
  }
  await Task.insertMany(tasks);

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "ci_hermetic_super_secret_jwt_key_12345", {
    expiresIn: "1h",
  });

  // 2. Start server on dynamic port
  const testServer = server.listen(0);
  const port = testServer.address().port;
  const targetUrl = `http://localhost:${port}/api/tasks/workspace/${workspace._id}`;

  console.log(`Starting real MongoDB benchmark against: ${targetUrl}`);
  console.log("Simulating 10 concurrent connections (typical sprint team) for 5s...\n");

  const result = await autocannon({
    url: targetUrl,
    connections: 10,
    duration: 5,
    pipelining: 1,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(autocannon.printResult(result));

  // 3. Clean up database & close server
  await Task.deleteMany({ workspace: workspace._id });
  await List.deleteMany({ workspace: workspace._id });
  await Workspace.findByIdAndDelete(workspace._id);
  await User.findByIdAndDelete(user._id);

  testServer.close();
  await mongoose.disconnect();
  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
