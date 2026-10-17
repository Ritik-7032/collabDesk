/**
 * CollabDesk Cross-Instance Horizontal Scaling & Distributed Invalidation Suite
 *
 * Verifies real CollabDesk application logic across two distinct server nodes:
 * 1. Redis pub/sub room event propagation (Instance B -> Redis -> Instance A -> Client Socket).
 * 2. Cross-instance RemoteSocket eviction via socket.data.user serialization (Instance B evicts socket on Instance A).
 * 3. Cross-instance cache invalidation: REST removeMember on Instance B publishes to Redis,
 *    immediately purging the in-memory memberCache on Instance A so subsequent REST calls return HTTP 403.
 */

const http = require("http");
const { Server } = require("socket.io");
const ioClient = require("socket.io-client");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const request = require("supertest");
const assert = require("assert");

process.env.NODE_ENV = "test";
require("dotenv").config();

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const JWT_SECRET = process.env.JWT_SECRET || "ci_hermetic_super_secret_jwt_key_12345";
const REQUIRE_REDIS = process.env.REQUIRE_REDIS === "true" || process.argv.includes("--require-redis");

const dbConnect = require("../config/db");
const User = require("../models/User");
const Workspace = require("../models/Workspace");
const List = require("../models/List");
const Task = require("../models/Task");
const { invalidateMembershipCache } = require("../middleware/workspaceAccess");

// Factory to create a fully configured CollabDesk server instance
function createCollabDeskInstance(pubClient, subClient) {
  const express = require("express");
  const cors = require("cors");
  const cookieParser = require("cookie-parser");
  const helmet = require("helmet");

  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: { origin: "*", credentials: true },
  });

  io.adapter(createAdapter(pubClient, subClient));
  app.set("io", io);
  app.set("redisPub", pubClient);

  // Distributed cluster cache invalidation subscriber
  subClient.subscribe("collabdesk:cache:invalidate", (message) => {
    try {
      const { wsId, userId } = JSON.parse(message);
      invalidateMembershipCache(wsId, userId);
    } catch (e) {
      console.warn("Subscriber error:", e.message);
    }
  });

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: true, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());

  // Mount CollabDesk application routes
  app.use("/api/auth", require("../routes/authRoutes"));
  app.use("/api/workspaces", require("../routes/workspaceRoutes"));
  app.use("/api/tasks", require("../routes/taskRoutes"));
  app.use("/api/lists", require("../routes/listRoutes"));

  // CollabDesk socket handshake with socket.data.user serialization
  io.use((socket, next) => {
    let token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token && socket.handshake.headers?.cookie) {
      const match = socket.handshake.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
      if (match) token = decodeURIComponent(match[1]);
    }
    if (!token) return next(new Error("Unauthorized: Missing auth token"));
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      socket.data.user = decoded;
      next();
    } catch {
      next(new Error("Unauthorized: Invalid token"));
    }
  });

  // CollabDesk fail-closed room join
  io.on("connection", (socket) => {
    socket.on("joinWorkspace", async (workspaceId) => {
      if (!workspaceId || !mongoose.isValidObjectId(workspaceId)) {
        return socket.emit("error", { message: "Invalid workspace ID" });
      }
      try {
        const isMember = await Workspace.exists({
          _id: workspaceId,
          members: socket.user?.id,
        });
        if (!isMember) {
          return socket.emit("error", { message: "Unauthorized workspace access" });
        }
        socket.join(`workspace:${workspaceId}`);
      } catch {
        socket.emit("error", { message: "Could not join workspace" });
      }
    });
  });

  return { app, server, io };
}

async function runClusterVerification() {
  console.log("============================================================");
  console.log("CollabDesk Multi-Instance Cross-Node Verification Suite");
  console.log(`Connecting to Redis: ${REDIS_URL}`);
  console.log("============================================================");

  // 1. Probe Redis Connectivity
  try {
    const probe = createClient({ url: REDIS_URL });
    await probe.connect();
    await probe.ping();
    await probe.disconnect();
    console.log("✔ Redis cluster broker is healthy.\n");
  } catch (err) {
    if (REQUIRE_REDIS) {
      console.error(`✖ FATAL: Redis is required for cluster test but unreachable at ${REDIS_URL}: ${err.message}`);
      process.exit(1);
    }
    console.warn(`[NOTICE] Redis not reachable on ${REDIS_URL}. Skipping live cluster assertions.`);
    console.warn("To run with live Redis, start container: docker compose up -d redis\n");
    process.exit(0);
  }

  // 2. Connect Database
  await dbConnect();

  // 3. Setup Redis Clients for Instance A & B
  const pubA = createClient({ url: REDIS_URL });
  const subA = pubA.duplicate();
  const pubB = createClient({ url: REDIS_URL });
  const subB = pubB.duplicate();

  await Promise.all([pubA.connect(), subA.connect(), pubB.connect(), subB.connect()]);

  // 4. Instantiate Instance A and Instance B
  const instanceA = createCollabDeskInstance(pubA, subA);
  const instanceB = createCollabDeskInstance(pubB, subB);

  const portA = await new Promise((r) => instanceA.server.listen(0, () => r(instanceA.server.address().port)));
  const portB = await new Promise((r) => instanceB.server.listen(0, () => r(instanceB.server.address().port)));

  console.log(`- Instance A online on port :${portA}`);
  console.log(`- Instance B online on port :${portB}`);

  // 5. Seed Real Workspace and Users in Database
  const owner = await User.create({
    name: "Workspace Owner",
    email: `owner_${Date.now()}@collabdesk.scale`,
    password: "TestPassword123!",
  });

  const member = await User.create({
    name: "Target Member",
    email: `member_${Date.now()}@collabdesk.scale`,
    password: "TestPassword123!",
  });

  const workspace = await Workspace.create({
    name: "Cluster Scale Board",
    owner: owner._id,
    members: [owner._id, member._id],
  });

  const list = await List.create({
    name: "In Progress",
    workspace: workspace._id,
    position: 0,
  });

  const ownerToken = jwt.sign({ id: owner._id.toString() }, JWT_SECRET);
  const memberToken = jwt.sign({ id: member._id.toString() }, JWT_SECRET);

  console.log(`✔ Seeded workspace "${workspace.name}" with Owner and Member.\n`);

  let clientOnInstanceA;
  try {
    // 6. Connect Member's Socket to Instance A
    clientOnInstanceA = ioClient(`http://localhost:${portA}`, {
      auth: { token: memberToken },
      transports: ["websocket"],
    });

    await new Promise((resolve, reject) => {
      clientOnInstanceA.on("connect", resolve);
      clientOnInstanceA.on("connect_error", reject);
    });

    clientOnInstanceA.emit("joinWorkspace", workspace._id.toString());
    await new Promise((r) => setTimeout(r, 100));
    console.log("✔ Member socket joined workspace room on Instance A.");

    // 7. Verify Cross-Node Broadcast: Instance B emits mutation, Client on Instance A receives
    let receivedMutationOnA = null;
    clientOnInstanceA.on("taskCreated", (data) => {
      receivedMutationOnA = data;
    });

    instanceB.io.to(`workspace:${workspace._id}`).emit("taskCreated", {
      title: "Cluster Event From Instance B",
    });

    await new Promise((r) => setTimeout(r, 150));
    assert.ok(receivedMutationOnA, "Client on Instance A must receive event broadcasted from Instance B");
    assert.strictEqual(receivedMutationOnA.title, "Cluster Event From Instance B");
    console.log("✔ Cross-Instance Broadcast verified: Instance B -> Redis -> Instance A -> Client Socket.");

    // 8. Warm Instance A's In-Memory Membership Cache
    const preEvictReadRes = await request(instanceA.app)
      .get(`/api/tasks/workspace/${workspace._id}`)
      .set("Authorization", `Bearer ${memberToken}`);
    assert.strictEqual(preEvictReadRes.status, 200);
    console.log("✔ Instance A in-memory membership cache warmed (status 200).");

    // 9. Execute Real Member Eviction via REST on Instance B
    let evictionNoticeReceived = false;
    clientOnInstanceA.on("error", (err) => {
      if (err.message?.includes("Access revoked")) evictionNoticeReceived = true;
    });

    const removeRes = await request(instanceB.app)
      .delete(`/api/workspaces/${workspace._id}/members/${member._id}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    assert.strictEqual(removeRes.status, 200);
    console.log("✔ Member removed via REST DELETE on Instance B.");

    // Wait for Redis cluster eviction cycle
    await new Promise((r) => setTimeout(r, 200));

    // Verify RemoteSocket eviction
    assert.strictEqual(evictionNoticeReceived, true, "Socket on Instance A should receive access revoked notice");
    console.log("✔ RemoteSocket eviction verified: Instance B evicted socket hosted on Instance A.");

    // 10. Verify Cross-Node Immediate Cache Invalidation
    // Instance B published to 'collabdesk:cache:invalidate' -> Instance A's memberCache is purged immediately!
    const postEvictReadRes = await request(instanceA.app)
      .get(`/api/tasks/workspace/${workspace._id}`)
      .set("Authorization", `Bearer ${memberToken}`);

    assert.strictEqual(
      postEvictReadRes.status,
      403,
      "Instance A must immediately reject removed member with 403 Forbidden via Redis cache bus"
    );
    console.log("✔ Cross-Instance Cache Invalidation verified: Instance A rejected removed member with 403.");

  } finally {
    if (clientOnInstanceA) clientOnInstanceA.disconnect();
    instanceA.server.close();
    instanceB.server.close();

    await Task.deleteMany({ workspace: workspace._id });
    await List.deleteMany({ workspace: workspace._id });
    await Workspace.findByIdAndDelete(workspace._id);
    await User.findByIdAndDelete(owner._id);
    await User.findByIdAndDelete(member._id);

    await Promise.all([pubA.disconnect(), subA.disconnect(), pubB.disconnect(), subB.disconnect()]);
    await mongoose.disconnect();
  }

  console.log("\n============================================================");
  console.log("ALL REAL MULTI-INSTANCE APPLICATION CHECKS PASSED (100% OK) ✔");
  console.log("============================================================\n");
  process.exit(0);
}

runClusterVerification().catch((err) => {
  console.error("Cluster verification failed:", err);
  process.exit(1);
});
