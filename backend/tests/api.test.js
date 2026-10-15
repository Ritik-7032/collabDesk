const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const request = require("supertest");
const mongoose = require("mongoose");
require("dotenv").config();

process.env.NODE_ENV = "test";
const { app } = require("../server");
const dbConnect = require("../config/db");

describe("CollabDesk API & Integration Test Suite", () => {
  let authToken = "";
  const testEmail = `test_${Date.now()}@collabdesk.test`;
  const testPassword = "StrongTestPassword123!";
  let createdWorkspaceId = "";

  before(async () => {
    await dbConnect();
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

  test("7. AWS S3: Presigned URL generated without server buffering", async () => {
    const res = await request(app)
      .post("/api/upload/presign")
      .set("Authorization", `Bearer ${authToken}`)
      .send({
        fileName: "architecture-spec.pdf",
        fileType: "application/pdf",
      });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.uploadUrl);
    assert.ok(res.body.fileUrl);
    assert.ok(res.body.uploadUrl.includes("amazonaws.com"));
  });

  test("8. AI: Gemini generates structured subtask checklist", async () => {
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

  test("9. Auth: Forgot and Reset Password token lifecycle", async () => {
    // 1. Request reset link
    const forgotRes = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: testEmail });

    assert.strictEqual(forgotRes.status, 200);
    assert.ok(forgotRes.body.token);
    const resetToken = forgotRes.body.token;

    // 2. Set new password with token
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
});
