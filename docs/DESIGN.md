# 🧠 CollabDesk — System Design Decisions & Architectural Tradeoffs

This document provides a comprehensive technical breakdown of the architectural decisions, trade-offs, and failure modes across CollabDesk's distributed stack.

---

## 1. Real-Time Transport: WebSockets vs. HTTP Long-Polling

### Design Tradeoff
Modern client browsers enforce a strict **Mixed Content security policy**: an HTTPS page (like Vercel `https://...`) cannot establish unencrypted WebSocket connections (`ws://`) or insecure HTTP requests to an IP-only backend (`http://...`). Furthermore, Vercel's Serverless Edge Reverse Proxy does not support persistent TCP WebSocket upgrades (HTTP 101 Switching Protocols).

### Architectural Solution
CollabDesk handles real-time synchronization and API routing through a two-tiered architectural strategy:
1. **Staging / Demo Gateway (HTTP Long-Polling via Vercel Edge Reverse Proxy):**
   - Socket.io client routes connection requests through `/socket.io/*` and REST calls through `/api/*` on the Vercel edge domain.
   - Vercel forwards requests to the Dockerized Express backend on AWS EC2.
   - Real-time updates propagate across connected clients with sub-second delivery and zero mixed-content warnings in client browsers.
   - *Transit Note:* In the free-tier live demo, Vercel edge proxies to the public EC2 host over HTTP. While browser-to-Vercel communication is encrypted via TLS with `SameSite=Lax` cookies, end-to-end encryption for production requires host-level TLS termination.
2. **Production End-to-End TLS Termination Gateway (Nginx + Certbot):**
   - For complete end-to-end encryption and direct full-duplex TCP WebSockets (`wss://`), `docker-compose.yml` provides a production-grade Nginx reverse proxy gateway accompanied by an automated Let's Encrypt Certbot renewal container (`docker compose --profile production up -d`).
   - Nginx handles TLS termination (TLSv1.2/1.3, strict HSTS, secure ciphers) and load balances traffic across internal backend replicas with HTTP 101 WebSocket connection upgrade headers.

---

## 2. Direct-to-Cloud Uploads: Presigned PUT with Cryptographic Content-Length Binding

### Design Tradeoff
Streaming file uploads directly through Node.js (`multer.memoryStorage`) buffers raw binary data in heap memory. In concurrent upload scenarios (e.g., 50 simultaneous 20MB attachments), Node.js server RAM surges by over 1GB, risking garbage collection pauses or Out-Of-Memory (OOM) crashes.

### Architectural Solution
CollabDesk utilizes AWS S3 Presigned URLs with three layers of security:
1. **Strict MIME Whitelisting:** The `/api/upload/presign` endpoint verifies incoming `fileType` against an explicit whitelist of safe content types (images, PDFs, text, zip, json), immediately rejecting untrusted executables.
2. **Strict Integer Bounds & Byte Size Validation:** File sizes must be positive integers not exceeding 10MB (`fileSize <= 10 * 1024 * 1024`).
3. **Cryptographic ContentLength Signature Binding:** The server computes an AWS S3 `PutObjectCommand` presigned signature with `ContentLength` and `ContentType` bound directly into the AWS request signature. Any client attempt to upload a payload exceeding the declared byte count is cryptographically rejected by AWS S3 (`SignatureDoesNotMatch` or `403 Forbidden`).
4. **User & Workspace Namespace Isolation:** Keys are organized under `uploads/${userId}/${timestamp}-${sanitizedFileName}` to prevent namespace collisions and unauthorized overwrites across tenants.

---

## 3. Real-Time Security: Fail-Closed Rooms, Dynamic Eviction & Zero-Leak Isolation

### Design Tradeoff
In a multi-tenant workspace platform, a naive `io.emit()` broadcast leaks internal task mutations and member activity across unrelated organizations. Furthermore, allowing unauthenticated connections or non-members to join socket rooms creates severe data exposure vulnerabilities.

### Architectural Solution
CollabDesk enforces a four-tier real-time security model:
1. **Strict JWT Handshake Verification:**
   - Incoming socket connections are intercepted via an authentication middleware (`io.use`).
   - The token provided in `socket.handshake.auth.token` is cryptographically verified against `JWT_SECRET`. Unauthenticated or expired tokens fail the handshake immediately.
2. **Fail-Closed Database Room Authorization:**
   - Clients request to join rooms strictly isolated to `workspace:${workspaceId}`.
   - The server verifies valid MongoDB ObjectId formats, checks user authentication, and performs an atomic database existence query (`Workspace.exists({ _id: workspaceId, members: socket.user.id })`).
   - If the user is not a verified member, or if a database timeout occurs, the request fails closed and `socket.join()` is strictly withheld.
3. **Real-Time Dynamic Member Eviction:**
   - When a member is removed via `DELETE /api/workspaces/:id/members/:mId`, the server uses `io.in(roomName).fetchSockets()` to locate the member's active socket connections.
   - The server immediately evicts the socket (`s.leave(roomName)`) and emits an access revocation event, terminating real-time event reception without requiring a manual server restart.
4. **Zero-Leak Room Scoping:**
   - All controller mutations (task creation, updates, deletes, batch reorders, list actions) emit exclusively to `io.to("workspace:" + wsId)`. Global `io.emit()` broadcasts are completely eliminated from the codebase.

---

## 4. Multi-Tenant Authorization Middleware & Atomic Batch Reordering

### Design Tradeoff
Batch operations such as Kanban card and column reordering can be exploited via IDOR (Insecure Direct Object Reference) if an attacker injects task IDs belonging to another user's workspace or performs cross-workspace drag operations.

### Architectural Solution
1. **`workspaceAccess` Authorization Middleware:**
   - Reusable Express middleware (`viaWorkspaceParam`, `viaBodyWorkspace`, `viaTaskId`, `viaListId`) verifies that the authenticated user (`req.user._id`) belongs to the target entity's workspace before reaching the controller.
2. **Atomic Batch Reorder with MongoDB `bulkWrite`:**
   - Batch reorder endpoints (`reorderTasksBulk`, `reorderLists`) query all target IDs simultaneously, assert that `tasks.length === ids.length`, verify that all items belong to a single workspace, and check user workspace membership.
   - Reordering writes are dispatched in a single atomic `bulkWrite` operation, eliminating partial write anomalies and network roundtrip overhead.
3. **Cross-Workspace Boundary Assertion:**
   - When moving a task to a different list via `PUT /api/tasks/:id`, the controller validates that the destination `list.workspace` matches `task.workspace`, preventing cross-workspace task teleportation.

---

## 5. Database Indexing Strategy: B-Tree Optimization for Kanban Workloads

### Design Tradeoff
A Kanban board generates high-frequency read and sort queries on every page visit and drag-and-drop sync: `Task.find({ workspace }).sort('position')` and `List.find({ workspace }).sort('position')`. Without compound indexes, MongoDB executes full collection scans (`COLLSCAN`), causing severe CPU spikes as task counts scale into thousands.

### Architectural Solution
CollabDesk establishes strategic compound B-Tree indexes:
1. **`Task` Compound Indexes:**
   - `{ workspace: 1, position: 1 }`: Optimizes the primary board view retrieval, enabling index-covered sorting with zero in-memory sort stages.
   - `{ list: 1, position: 1 }`: Accelerates column-level task counts and column drag-and-drop operations.
   - `{ workspace: 1, list: 1, position: 1 }`: Covers cross-column movement filters.
2. **`Workspace` Membership Indexes:**
   - `{ members: 1 }`: Transforms tenant authorization checks (`Workspace.exists({ _id, members })`) and dashboard workspace queries into instant index lookups.
   - `{ owner: 1 }`: Speeds up ownership role verification on member management routes.
3. **`User` Sparse Token Index:**
   - `{ resetPasswordToken: 1 }` (Sparse): Allows instant 15-minute password reset verification without indexing null values.

---

## 6. Multi-Tier API Rate Limiting & High-Resolution Metrics

### Design Tradeoff
Public APIs face brute-force credential stuffing on authentication endpoints, distributed denial-of-service (DDoS) traffic spikes, and upstream financial cost overruns on AI breakdown endpoints (Google Gemini API quotas).

### Architectural Solution
CollabDesk implements tiered rate limiting via `express-rate-limit` with reverse-proxy trust (`app.set("trust proxy", 1)`):
1. **Auth Limiter:** Strict limit of 15 attempts per 15 minutes per IP on `/api/auth/login`, `/api/auth/signup`, and `/api/auth/forgot-password` to halt brute-force credential attacks.
2. **AI Quota Limiter:** 20 requests per 10 minutes per IP on `/api/ai/*` to protect Google Gemini API quotas.
3. **Upload Presign Limiter:** 30 requests per 10 minutes per IP on `/api/upload/*` to prevent S3 presigned URL harvesting.
4. **Global API Limiter:** 200 requests per minute per IP for general REST endpoints.
5. **High-Resolution Response Metrics:** Custom `requestMetrics` middleware tracks elapsed nanoseconds via `process.hrtime.bigint()` and attaches an `X-Response-Time` header (e.g. `12.45ms`) to all outgoing HTTP responses.

---

## 7. Asynchronous Slack Webhooks: Fire-and-Forget Resiliency

### Design Tradeoff
Third-party notification APIs (such as Slack Webhooks) are subject to external network latency, rate limits, and service outages. Blocking the core Express API response until Slack acknowledges the webhook introduces external latency and creates a single point of failure for task creation.

### Architectural Solution
Slack notifications are dispatched using an asynchronous **fire-and-forget** pattern:
- The database mutation commits to MongoDB and responds to the client immediately.
- The webhook dispatcher executes in the background with an isolated `.catch()` error handler.
- If Slack returns HTTP 429 (Rate Limited) or encounters network downtime, the error is logged to cloud monitoring without failing the user's primary HTTP transaction.

---

## 8. Optimistic UI Updates & Error Rollback

### Design Tradeoff
Awaiting full server round-trips before re-rendering Kanban drag-and-drop actions introduces visual latency and sluggishness, degrading perceived user experience.

### Architectural Solution
1. When a user drags a task card to another column, the frontend immediately reorders local React state snapshots for instantaneous visual feedback.
2. An asynchronous batch reorder request is dispatched to `PUT /api/tasks/reorder/bulk`.
3. If the server rejects the request (e.g., network disconnect or database error), the catch handler restores the pre-drag snapshot in React state and displays an error toast alert to the user.

---

## 9. Payment Integrity: Server-Side HMAC-SHA256 Verification & Atomic Anti-Replay

### Design Tradeoff
Client-side payment callbacks cannot be trusted, as malicious actors can intercept frontend network payloads, spoof success responses, or attempt replay attacks by re-submitting previously processed payment IDs across multiple user accounts.

### Architectural Solution
1. **User-Bound Order Creation:** When the client calls `POST /api/payment/create-order`, the backend creates a Razorpay order and immediately persists an `Order` document (`backend/models/Order.js`) binding `orderId`, the authenticated `user: req.user._id`, and `status: "created"`.
2. **Cryptographic HMAC-SHA256 Signature Verification:**
   Upon payment completion, the client submits `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature` to `POST /api/payment/verify-payment`. The server recalculates:
   $$\text{HMAC-SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
   Any signature tampering results in immediate rejection and status transition to `"failed"`.
3. **Atomic Single-Query State Transition (Anti-Replay TOCTOU Defense):**
   To prevent parallel race conditions where two simultaneous verification requests attempt to redeem the same order, the backend executes an atomic MongoDB find-and-update:
   ```javascript
   const order = await Order.findOneAndUpdate(
     { orderId: razorpay_order_id, user: req.user._id, status: "created" },
     { $set: { status: "paid", paymentId: razorpay_payment_id, paidAt: new Date() } },
     { returnDocument: "after" }
   );
   ```
   If `order` is null, the handler checks if the order was already marked `"paid"` (returning HTTP 409 Conflict) or belonged to a different user (HTTP 403 Forbidden). Only upon an atomic `created -> paid` state transition is the user plan upgraded in MongoDB.

---

## 10. Automated Testing Strategy & Third-Party Isolation

### Design Tradeoff
End-to-end integration tests that call live external cloud APIs (e.g., AWS S3, Google Gemini, Slack) lead to flaky CI test runs caused by quota limits, credential expiration, or transient network delays.

### Architectural Solution
1. **Multi-Tenant Isolation Testing:** Verifies that uninvited users cannot read or inject tasks into another tenant's workspace (HTTP 403).
2. **S3 Security & Presign Signature Testing:** Validates that non-whitelisted MIME types (e.g. executables), missing fileSize, and files exceeding 10MB are rejected with HTTP 400.
3. **Atomic Reorder Authorization Testing:** Verifies that unauthorized batch reorders are rejected.
4. **Performance Metric Testing:** Asserts that every API response includes a valid `X-Response-Time` header.
5. **Rate Limiter Enforcement Testing:** Verifies that exceeding request thresholds triggers HTTP 429 (Too Many Requests).
6. **Optimistic Concurrency Control Testing:** Asserts that updating a task with a stale `expectedVersion` triggers HTTP 409 Conflict.
7. **Real-Time Socket Isolation Testing:** End-to-end integration test with live socket clients asserting that outsiders are rejected from workspace rooms and receive zero real-time mutation events.
8. **Hermetic CI Environment:** Configured with a dedicated MongoDB 6 service container and fallback credentials, allowing forkers and automated CI pipelines to execute tests with 100% pass rates without external cloud dependencies.

---

## 11. Optimistic Concurrency Control (OCC) & Conflict Resolution

### Design Tradeoff
In a collaborative multi-user Kanban environment, two teammates may open and edit the same task card simultaneously. A last-write-wins (LWW) strategy blindly overwrites the previous user's changes without warning, causing silent data loss.

### Architectural Solution
CollabDesk implements schema-level, atomic Optimistic Concurrency Control:
1. Every task document includes an integer `version` field (defaulting to `1`).
2. Updates execute via single-query atomic operations:
   ```javascript
   const task = await Task.findOneAndUpdate(
     { _id: taskId, version: expectedVersion },
     { $set: updateFields, $inc: { version: 1 } },
     { returnDocument: "after", runValidators: true }
   );
   ```
3. By leveraging MongoDB WiredTiger document-level locking, the read and write occur in a single atomic database engine transaction. If a concurrent writer has already incremented the version, the filter matches 0 documents and the server returns **HTTP 409 Conflict** with `{ message, currentVersion, expectedVersion }`, completely eliminating TOCTOU race windows.
4. The frontend catches HTTP 409 and prompts the user with an actionable toast alert to refresh and review the latest edits.

---

## 12. Engineering Postmortem: Cross-Workspace Socket Broadcast Leakage

### Incident Overview
During initial real-time architecture auditing, an architectural vulnerability was identified: while controllers emitted room-scoped events (`io.to('workspace:' + wsId).emit(...)`), they simultaneously issued duplicate global broadcasts (`io.emit(...)`) across 11 controller endpoints.

### Impact
Any connected client—regardless of authentication or workspace membership—received real-time entity payloads (task creation, updates, deletes, column additions) originating from unrelated workspaces across the platform.

### Root Cause Analysis
During early prototype development, global broadcasts were added as a temporary fallback to verify frontend re-rendering before room-joining logic had stabilized. When workspace-scoped rooms were later introduced, the global broadcast calls were not removed, resulting in dual emission.

### Remediation & Architectural Hardening
1. **Complete Global Emission Purge:** Grepped and eliminated all 11 global `io.emit()` occurrences across `taskController`, `listController`, and `workspaceController`.
2. **Fail-Closed Room Joins:** Converted socket room join handler to strictly verify active MongoDB workspace membership before granting room admission.
3. **Dynamic Socket Eviction:** Implemented `io.in(roomName).fetchSockets()` on member removal to evict revoked users from socket rooms in real time.
4. **Automated Verification:** Added an automated integration test (Test 16) that connects a member socket and an outsider socket, creates an entity via REST API, and asserts that the outsider received zero socket events.

---

## 13. Engineering Postmortem: Multi-Instance RemoteSocket Eviction & Redis Cluster Scaling

### Incident Overview
When scaling CollabDesk horizontally across multiple backend instances via `@socket.io/redis-adapter`, member eviction appeared to succeed locally but failed to evict revoked users connected to replica instances.

### Root Cause Analysis
In a single-instance deployment, user credentials decoded from the JWT handshake are stored directly on the socket instance:
```javascript
socket.user = decoded;
```
When `io.in(roomName).fetchSockets()` is called across a multi-instance Redis cluster, Socket.io returns `RemoteSocket` instances for sockets connected to other nodes. **RemoteSocket does not serialize custom top-level socket attributes**. As a result, reading `s.user?.id` on peer nodes evaluated to `undefined`, silently bypassing the eviction loop for all remote sockets!

### Remediation & Architectural Hardening
1. **`socket.data` Serialization:** Socket.io explicitly guarantees that the `socket.data` property is serialized across the cluster. Handshake middleware now assigns:
   ```javascript
   socket.user = decoded;
   socket.data.user = decoded; // Serialized across Redis adapter nodes
   ```
2. **Defensive Eviction Traversal:** `removeMember` checks both properties:
   ```javascript
   const userId = s.data?.user?.id || s.user?.id;
   if (userId && String(userId) === String(req.params.memberId)) {
     s.leave(roomName);
   }
   ```
3. **Automated Cross-Instance Test:** Added `backend/tests/cross-instance-test.js` (`npm run test:cluster`) verifying cross-node pub/sub broadcast and cross-instance remote member eviction.

---

## 14. WAN Network Round-Trip Time (RTT) & Sequential Query Optimization

### Problem Statement & Latency Breakdown
Initial load testing against MongoDB Atlas in AWS `ap-south-1` from a development client exhibited high read latency (median $202\text{ms}$, average $291\text{ms}$) despite efficient B-Tree index scans ($< 2\text{ms}$ query execution time inside the database engine).

### Root Cause: Sequential Public WAN Round-Trips
Public internet round-trip time between the client test runner and MongoDB Atlas averages ~50–60ms per TCP/TLS query. A single authenticated board read request executes **3 sequential database operations**:
1. **User Authentication:** `protect` middleware executes `User.findById(decoded.id)`. (Hop 1: ~55ms)
2. **Workspace Access Authorization:** `workspaceAccess` middleware executes `Workspace.exists({ _id, members })`. (Hop 2: ~55ms)
3. **Task Document Retrieval:** `taskController` executes `Task.find({ workspace }).populate(...)`. (Hop 3: ~55ms)

$$\text{Minimum Theoretical Latency Floor} = 3 \times 55\text{ms} = 165\text{ms}$$

Network physical transport—not Node.js compute or MongoDB query indexing—dominated 85% of total request latency.

### Optimization: In-Memory TTL Session & Membership Micro-Caching
CollabDesk introduces a high-performance in-memory micro-cache with a 15-second TTL:
- `sessionCache` in `authMiddleware.js`: caches verified user sessions for 15 seconds.
- `memberCache` in `workspaceAccess.js`: caches workspace membership booleans for 15 seconds.
- `broadcastCacheInvalidation`: executed on member removal, publishing across Redis Pub/Sub (`collabdesk:cache:invalidate`) to immediately purge cached authorizations on all peer cluster instances.

### Measured Impact & Bottleneck Breakdown
Consecutive sprint board queries collapse from **3 sequential network hops down to 1 single hop** (the tasks query itself):
- **Throughput:** Increased from $33.8\text{ req/s}$ to **$105.0\text{ req/s}$** ($+210\%$)
- **Median Latency (p50):** Decreased from $202\text{ms}$ to **$64\text{ms}$** ($-68\%$)
- **Average Latency:** Decreased from $291.8\text{ms}$ to **$97.9\text{ms}$** ($-66\%$)
- **99th Percentile Latency (p99):** Decreased from $861\text{ms}$ to **$497\text{ms}$** ($-42\%$)

### Tail Latency & Distributed Tradeoff Analysis
- **Tail Latency Persistence:** While median latency dropped by 68%, high-percentile tail latency ($p97.5$ at $433\text{ms}$, $p99$ at $497\text{ms}$) reflects public WAN TCP transmission jitter and TLS renegotiation to the remote Atlas replica set. In production deployments where Node.js instances are co-located in the same AWS VPC with direct private peering to MongoDB, network latency drops to $< 2\text{ms}$.
- **Authorization Staleness Tradeoff:** Without Redis connected, cache invalidation is process-local, meaning peer instances can serve reads for up to 15 seconds before the TTL expires. When Redis is connected, `broadcastCacheInvalidation` forces immediate distributed eviction across all nodes.


