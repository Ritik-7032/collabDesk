const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const mongoose = require("mongoose");
require("dotenv").config();

process.env.NODE_ENV = "test";
const { app, server } = require("../server");
const dbConnect = require("../config/db");
const ioClient = require("socket.io-client");

describe("CollabDesk API & Integration Test Suite", () => {
  let authToken = "";
  const testEmail = `test_${Date.now()}@collabdesk.test`;
  const testPassword = "StrongTestPassword123!";
  let createdWorkspaceId = "";
  let testHttpServer;
  let testPort;

  before(async () => {
    await dbConnect();
    await new Promise((resolve) => {
      testHttpServer = server.listen(0, () => {
        testPort = testHttpServer.address().port;
        resolve();
      });
    });
  });

  after(async () => {
    // Cleanup created test user if needed
    if (mongoose.connection.readyState === 1) {
      const User = require("../models/User");
      const Workspace = require("../models/Workspace");
      const List = require("../models/List");
      const Task = require("../models/Task");

      const user = await User.findOne({ email: testEmail });
      if (user) {
        await Task.deleteMany({ createdBy: user._id });
        if (createdWorkspaceId) {
          await List.deleteMany({ workspace: createdWorkspaceId });
          await Workspace.findByIdAndDelete(createdWorkspaceId);
        }
        await User.findByIdAndDelete(user._id);
      }
      if (testHttpServer) {
        await new Promise((resolve) => testHttpServer.close(resolve));
      }
      await mongoose.disconnect();
    }
  });

  test("1. Health Check GET / returns 200", async () => {
    const res = await request(app).get("/");
    assert.strictEqual(res.status, 200);
    assert.ok(res.text.includes("CollabDesk"));
  });

  test("2. Auth: User Signup successfully creates account", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Test Developer",
        email: testEmail,
        password: testPassword,
      });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.user);
    assert.strictEqual(res.body.user.email, testEmail);
  });

  test("3. Auth: User Login returns JWT token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: testPassword,
      });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.token);
    authToken = res.body.token;
  });

  test("4. Auth: Invalid login credentials rejected with 401", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: "WrongPassword999",
      });

    assert.strictEqual(res.status, 401);
  });

  test("5. Security: Protected route rejects request without Bearer token", async () => {
    const res = await request(app).get("/api/workspaces");
    assert.strictEqual(res.status, 401);
  });

  test("6. Workspace: Create workspace auto-seeds default lists", async () => {
    const res = await request(app)
      .post("/api/workspaces")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ name: "CI/CD Test Board" });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body._id);
    createdWorkspaceId = res.body._id;

    // Verify default lists created (To do, In progress, Done)
    const listsRes = await request(app)
      .get(`/api/lists/workspace/${createdWorkspaceId}`)
      .set("Authorization", `Bearer ${authToken}`);

    assert.strictEqual(listsRes.status, 200);
    assert.strictEqual(listsRes.body.length, 3);
  });

  test("7. AWS S3: Presigned URL signature generation and Content-Type binding", async () => {
    const res = await request(app)
      .post("/api/upload/presign")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        fileName: "architecture-spec.pdf",
        fileType: "application/pdf",
        fileSize: 1024 * 500, // 500KB
      });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.uploadUrl);
    assert.ok(res.body.fileUrl);
    assert.ok(res.body.uploadUrl.includes("amazonaws.com"));
  });

  test("8. AI: Task breakdown endpoint returns valid checklist schema (with resilient fallback)", async () => {
    const res = await request(app)
      .post("/api/ai/generate-subtasks")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        description: "Set up MongoDB compound indexes and Redis caching layer",
      });

    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.subtasks));
    assert.ok(res.body.subtasks.length >= 2);
  });

  test("9. Auth: Forgot and Reset Password token lifecycle (zero-leak & anti-enumeration)", async () => {
    // 1. Request reset link for existing user
    const forgotRes = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: testEmail });

    assert.strictEqual(forgotRes.status, 200);
    // Assert zero token disclosure in public HTTP response
    assert.strictEqual(forgotRes.body.token, undefined, "Public response must NEVER leak raw reset token");
    assert.strictEqual(forgotRes.body.resetUrl, undefined, "Public response must NEVER leak reset URL");
    assert.ok(forgotRes.body.message.includes("If an account with that email exists"));

    // Anti-enumeration test: non-existent email returns identical 200 message
    const anonRes = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "nonexistent_target_user@fake.test" });
    assert.strictEqual(anonRes.status, 200);
    assert.strictEqual(anonRes.body.message, forgotRes.body.message);

    // Retrieve internal test token provided only in test environment
    const resetToken = forgotRes.body._testToken;
    assert.ok(resetToken, "Test harness token should be present in test environment");

    // 2. Set new password with cryptographic token
    const newPassword = "BrandNewSuperSecurePass456!";
    const resetRes = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: resetToken, password: newPassword });

    assert.strictEqual(resetRes.status, 200);

    // 3. Verify login works with new password
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: newPassword });

    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.body.token);
  });

  test("10. Multi-tenant Isolation: User B cannot access or modify User A's workspace", async () => {
    // Register User B
    const userBEmail = `userb_${Date.now()}@collabdesk.test`;
    await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Intruder User B",
        email: userBEmail,
        password: testPassword,
      });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: userBEmail, password: testPassword });
    const userBToken = loginRes.body.token;

    // User B tries to read User A's lists
    const readListsRes = await request(app)
      .get(`/api/lists/workspace/${createdWorkspaceId}`)
      .set("Authorization", `Bearer ${userBToken}`);
    assert.strictEqual(readListsRes.status, 403);

    // User B tries to inject a task into User A's workspace
    const injectTaskRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${userBToken}`)
      .send({
        title: "Malicious Task Injection",
        workspace: createdWorkspaceId,
        list: new mongoose.Types.ObjectId(),
      });
    assert.strictEqual(injectTaskRes.status, 403);

    // Cleanup User B
    const User = require("../models/User");
    await User.findOneAndDelete({ email: userBEmail });
  });

  test("11. S3 Presign Security: Rejects non-whitelisted MIME types and oversized files", async () => {
    // Disallowed executable MIME type
    const badMimeRes = await request(app)
      .post("/api/upload/presign")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        fileName: "malware.exe",
        fileType: "application/x-msdownload",
        fileSize: 1024,
      });
    assert.strictEqual(badMimeRes.status, 400);

    // File exceeds 10MB limit
    const oversizeRes = await request(app)
      .post("/api/upload/presign")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        fileName: "giant-archive.zip",
        fileType: "application/zip",
        fileSize: 20 * 1024 * 1024, // 20MB
      });
    assert.strictEqual(oversizeRes.status, 400);

    // Missing mandatory fileSize
    const missingSizeRes = await request(app)
      .post("/api/upload/presign")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        fileName: "doc.pdf",
        fileType: "application/pdf",
      });
    assert.strictEqual(missingSizeRes.status, 400);
  });

  test("12. Atomic Batch Reorder: Unauthorized user cannot reorder tasks", async () => {
    // Create an unauthorized user
    const userCEmail = `userc_${Date.now()}@collabdesk.test`;
    await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Unauthorized User C",
        email: userCEmail,
        password: testPassword,
      });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: userCEmail, password: testPassword });
    const userCToken = loginRes.body.token;

    // Attempt unauthorized task reorder
    const reorderRes = await request(app)
      .put("/api/tasks/reorder/bulk")
      .set("Authorization", `Bearer ${userCToken}`)
      .send({
        updates: [
          {
            _id: new mongoose.Types.ObjectId(),
            list: new mongoose.Types.ObjectId(),
            position: 0,
          },
        ],
      });
    // Task does not exist or user forbidden
    assert.ok([403, 404].includes(reorderRes.status));

    // Cleanup User C
    const User = require("../models/User");
    await User.findOneAndDelete({ email: userCEmail });
  });

  test("13. Performance Metrics: Response includes high-resolution X-Response-Time header", async () => {
    const res = await request(app).get("/");
    assert.strictEqual(res.status, 200);
    assert.ok(res.headers["x-response-time"]);
    assert.ok(res.headers["x-response-time"].endsWith("ms"));
    const msValue = parseFloat(res.headers["x-response-time"]);
    assert.ok(!isNaN(msValue) && msValue >= 0);
  });

  test("14. Rate Limiting: Strict auth limiter returns HTTP 429 when threshold exceeded", async () => {
    // Send 16 requests with x-test-rate-limit to trigger authLimiter (max 15)
    let lastStatus = 200;
    for (let i = 0; i < 16; i++) {
      const res = await request(app)
        .post("/api/auth/login")
        .set("x-test-rate-limit", "true")
        .send({ email: "rate_limit_probe@test.com", password: "wrong" });
      lastStatus = res.status;
      if (lastStatus === 429) {
        assert.ok(res.body.message.includes("Too many"));
        break;
      }
    }
    assert.strictEqual(lastStatus, 429);
  });

  test("15. Optimistic Concurrency Control: Updating task with stale expectedVersion returns HTTP 409 Conflict", async () => {
    const List = require("../models/List");
    const lists = await List.find({ workspace: createdWorkspaceId });
    assert.ok(lists.length > 0);
    const targetList = lists[0];

    // Create task with initial version 1
    const createRes = await request(app)
      .post("/api/tasks")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "OCC Baseline Task",
        workspace: createdWorkspaceId,
        list: targetList._id,
      });
    assert.strictEqual(createRes.status, 201);
    const taskId = createRes.body._id;
    assert.strictEqual(createRes.body.version, 1);

    // Update with expectedVersion 1 (succeeds, bumps version to 2)
    const validUpdateRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "OCC Task Version 2",
        expectedVersion: 1,
      });
    assert.strictEqual(validUpdateRes.status, 200);
    assert.strictEqual(validUpdateRes.body.version, 2);

    // Concurrent user attempts update with stale expectedVersion 1 (fails with 409 Conflict)
    const conflictRes = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        title: "Conflicting Concurrent Update",
        expectedVersion: 1,
      });
    assert.strictEqual(conflictRes.status, 409);
    assert.ok(conflictRes.body.message.includes("Conflict"));
    assert.strictEqual(conflictRes.body.currentVersion, 2);
  });

  test("16. Real-Time Socket Isolation: Fail-closed room authorization and zero-leak event privacy", async () => {
    // 1. Create outsider User B
    const userBEmail = `userb_socket_${Date.now()}@collabdesk.test`;
    await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Socket Intruder B",
        email: userBEmail,
        password: testPassword,
      });
    const loginBRes = await request(app)
      .post("/api/auth/login")
      .send({ email: userBEmail, password: testPassword });
    const userBToken = loginBRes.body.token;

    // 2. Connect Client A (member) and Client B (outsider)
    const socketA = ioClient(`http://localhost:${testPort}`, {
      auth: { token: authToken },
      transports: ["websocket"],
      forceNew: true,
    });
    const socketB = ioClient(`http://localhost:${testPort}`, {
      auth: { token: userBToken },
      transports: ["websocket"],
      forceNew: true,
    });

    try {
      await Promise.all([
        new Promise((resolve) => socketA.on("connect", resolve)),
        new Promise((resolve) => socketB.on("connect", resolve)),
      ]);

      // 3. User B attempts unauthorized room join -> rejected with error
      const bErrorPromise = new Promise((resolve) => {
        socketB.once("error", (err) => resolve(err));
      });
      socketB.emit("joinWorkspace", createdWorkspaceId);
      const bError = await bErrorPromise;
      assert.ok(
        bError.message.includes("Unauthorized") ||
        bError.message.includes("Access denied") ||
        bError.message.includes("not a member")
      );

      // 4. User A joins valid room
      socketA.emit("joinWorkspace", createdWorkspaceId);
      await new Promise((r) => setTimeout(r, 60));

      // 5. Track event delivery across sockets
      let eventReceivedA = false;
      let eventReceivedB = false;
      socketA.on("taskCreated", () => {
        eventReceivedA = true;
      });
      socketB.on("taskCreated", () => {
        eventReceivedB = true;
      });

      // 6. Trigger workspace mutation via REST API
      const List = require("../models/List");
      const lists = await List.find({ workspace: createdWorkspaceId });
      await request(app)
        .post("/api/tasks")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          title: "Confidential Workspace Event",
          workspace: createdWorkspaceId,
          list: lists[0]._id,
        });

      // Wait for real-time propagation cycle
      await new Promise((r) => setTimeout(r, 200));

      // Member received event; outsider received zero events
      assert.strictEqual(eventReceivedA, true);
      assert.strictEqual(eventReceivedB, false);
    } finally {
      socketA.disconnect();
      socketB.disconnect();
      const User = require("../models/User");
      await User.findOneAndDelete({ email: userBEmail });
    }
  });

  test("17. Dual-Mode Auth: httpOnly cookie login, cookie-authenticated access, and logout", async () => {
    const dualEmail = `cookie_${Date.now()}@collabdesk.test`;
    const dualPass = "DualModePass123!";

    await request(app)
      .post("/api/auth/signup")
      .send({
        name: "Cookie Tester",
        email: dualEmail,
        password: dualPass,
      });

    // 1. Login sets Set-Cookie with httpOnly token
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({
        email: dualEmail,
        password: dualPass,
      });

    assert.strictEqual(loginRes.status, 200);
    const cookies = loginRes.headers["set-cookie"];
    assert.ok(cookies && cookies.length > 0, "Set-Cookie header should be present");
    const tokenCookie = cookies.find((c) => c.startsWith("token="));
    assert.ok(tokenCookie, "token cookie should be set");
    assert.ok(tokenCookie.toLowerCase().includes("httponly"), "token cookie must be HttpOnly");

    // Extract cookie value for subsequent request
    const cookieHeaderVal = tokenCookie.split(";")[0];

    // 2. Access protected endpoint using cookie ONLY (no Bearer header)
    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Cookie", cookieHeaderVal);

    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meRes.body.email, dualEmail);

    // 3. Logout endpoint clears the cookie
    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookieHeaderVal);

    assert.strictEqual(logoutRes.status, 200);
    const logoutCookies = logoutRes.headers["set-cookie"];
    assert.ok(logoutCookies && logoutCookies.length > 0);
    const clearedCookie = logoutCookies.find((c) => c.startsWith("token="));
    assert.ok(
      clearedCookie.includes("token=;") ||
      clearedCookie.includes("Max-Age=0") ||
      clearedCookie.toLowerCase().includes("expires"),
      "Logout should clear or expire the token cookie"
    );

    const User = require("../models/User");
    await User.findOneAndDelete({ email: dualEmail });
  });

  test("18. Payment Security: Order user-binding and replay attack prevention", async () => {
    const Order = require("../models/Order");
    const crypto = require("crypto");

    // 1. User A creates an order
    const orderRes = await request(app)
      .post("/api/payment/create-order")
      .set("Authorization", `Bearer ${authToken}`);

    assert.strictEqual(orderRes.status, 200);
    const orderId = orderRes.body.id;
    assert.ok(orderId);

    // 2. Generate valid HMAC-SHA256 signature for this order
    const paymentId = `pay_${Date.now()}`;
    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "rzp_test_secret_123")
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    // 3. Register User Attacker who attempts to replay/steal User A's order
    const attackerEmail = `attacker_${Date.now()}@collabdesk.test`;
    await request(app).post("/api/auth/signup").send({
      name: "Payment Attacker",
      email: attackerEmail,
      password: "AttackerPassword123!",
    });
    const attackerLogin = await request(app).post("/api/auth/login").send({
      email: attackerEmail,
      password: "AttackerPassword123!",
    });
    const attackerToken = attackerLogin.body.token;

    // Attacker tries to verify User A's order
    const replayRes = await request(app)
      .post("/api/payment/verify-payment")
      .set("Authorization", `Bearer ${attackerToken}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

    assert.strictEqual(replayRes.status, 403, "Replaying another user's order must be forbidden");

    // 4. Legitimate User A verifies their own order
    const validVerifyRes = await request(app)
      .post("/api/payment/verify-payment")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

    assert.strictEqual(validVerifyRes.status, 200);

    // 5. User A tries to replay the same order a second time
    const duplicateRes = await request(app)
      .post("/api/payment/verify-payment")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });

    assert.strictEqual(duplicateRes.status, 409, "Duplicate payment verification must return 409 Conflict");

    // Cleanup
    await Order.deleteMany({ orderId });
    const User = require("../models/User");
    await User.findOneAndDelete({ email: attackerEmail });
  });

  test("19. Slack Webhook Security: URL masked from non-owners and update restricted to owner", async () => {
    // 1. Owner sets Slack webhook
    const setHookRes = await request(app)
      .put(`/api/workspaces/${createdWorkspaceId}/slack-webhook`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ slackWebhookUrl: "https://hooks.slack.com/services/T00/B00/X00SECRETKEY" });

    assert.strictEqual(setHookRes.status, 200);

    // 2. Register member user and add to workspace
    const memberEmail = `slackmember_${Date.now()}@collabdesk.test`;
    await request(app).post("/api/auth/signup").send({
      name: "Slack Member",
      email: memberEmail,
      password: "MemberPass123!",
    });
    const memberLogin = await request(app).post("/api/auth/login").send({
      email: memberEmail,
      password: "MemberPass123!",
    });
    const memberToken = memberLogin.body.token;

    await request(app)
      .post(`/api/workspaces/${createdWorkspaceId}/members`)
      .set("Authorization", `Bearer ${authToken}`)
      .send({ email: memberEmail });

    // 3. Member reads workspace: secret Slack webhook URL must be masked to "configured"
    const memberViewRes = await request(app)
      .get(`/api/workspaces/${createdWorkspaceId}`)
      .set("Authorization", `Bearer ${memberToken}`);

    assert.strictEqual(memberViewRes.status, 200);
    assert.strictEqual(
      memberViewRes.body.slackWebhookUrl,
      "configured",
      "Secret Slack webhook URL must be masked from non-owners"
    );

    // 4. Member attempts to update Slack webhook: must be rejected with 403 Forbidden
    const memberUpdateRes = await request(app)
      .put(`/api/workspaces/${createdWorkspaceId}/slack-webhook`)
      .set("Authorization", `Bearer ${memberToken}`)
      .send({ slackWebhookUrl: "https://hooks.slack.com/services/MALICIOUS/HOOK/999" });

    assert.strictEqual(memberUpdateRes.status, 403, "Non-owners must not be permitted to update Slack webhooks");

    const User = require("../models/User");
    await User.findOneAndDelete({ email: memberEmail });
  });

  test("20. Auth Normalization: Email case-insensitivity across signup, login, and queries", async () => {
    const mixedEmail = `MixedCase_${Date.now()}@CollabDesk.TEST`;
    const lowerEmail = mixedEmail.toLowerCase();
    const pass = "MixedCasePass123!";

    // 1. Signup with mixed uppercase email
    const signupRes = await request(app)
      .post("/api/auth/signup")
      .send({ name: "Mixed Case User", email: mixedEmail, password: pass });

    assert.strictEqual(signupRes.status, 201);
    assert.strictEqual(signupRes.body.user.email, lowerEmail);

    // 2. Login with all lowercase email succeeds
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: lowerEmail, password: pass });

    assert.strictEqual(loginRes.status, 200);

    // 3. Login with all uppercase email succeeds
    const upperLoginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: mixedEmail.toUpperCase(), password: pass });

    assert.strictEqual(upperLoginRes.status, 200);

    const User = require("../models/User");
    await User.findOneAndDelete({ email: lowerEmail });
  });
});


