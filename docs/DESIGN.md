# 🧠 CollabDesk — System Design Decisions & Architectural Tradeoffs

This document provides a comprehensive technical breakdown of the architectural decisions, trade-offs, and failure modes across CollabDesk's distributed stack.

---

## 1. Real-Time Transport: WebSockets vs. HTTP Long-Polling

### Design Tradeoff
Modern client browsers enforce a strict **Mixed Content security policy**: an HTTPS page (like Vercel `https://...`) cannot establish unencrypted WebSocket connections (`ws://`) or insecure HTTP requests to an IP-only backend (`http://...`). Furthermore, Vercel's Serverless Edge Reverse Proxy does not support persistent TCP WebSocket upgrades (HTTP 101 Switching Protocols).

### Architectural Solution
CollabDesk handles real-time synchronization through a dual-transport strategy via **Socket.io**:
1. **Primary Gateway Transport (HTTP Long-Polling via Vercel Reverse Proxy):**
   - Socket.io client routes connection requests through `/socket.io/*` on the Vercel edge domain.
   - Vercel forwards the polling cycles securely over HTTPS to the Dockerized Express backend on AWS EC2.
   - Real-time updates propagate across connected clients with sub-second delivery and zero mixed-content warnings.
2. **Native WebSocket (WSS) Upgrade Path:**
   - For direct full-duplex TCP WebSockets without intermediate polling, TLS termination occurs directly on the backend host (via Nginx or Cloudflare Tunnel with valid SSL/TLS certificates).
   - This decouples serverless edge routing from long-lived socket lifecycles.

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

## 5. Asynchronous Slack Webhooks: Fire-and-Forget Resiliency

### Design Tradeoff
Third-party notification APIs (such as Slack Webhooks) are subject to external network latency, rate limits, and service outages. Blocking the core Express API response until Slack acknowledges the webhook introduces external latency and creates a single point of failure for task creation.

### Architectural Solution
Slack notifications are dispatched using an asynchronous **fire-and-forget** pattern:
- The database mutation commits to MongoDB and responds to the client immediately.
- The webhook dispatcher executes in the background with an isolated `.catch()` error handler.
- If Slack returns HTTP 429 (Rate Limited) or encounters network downtime, the error is logged to cloud monitoring without failing the user's primary HTTP transaction.

---

## 6. Optimistic UI Updates & Error Rollback

### Design Tradeoff
Awaiting full server round-trips before re-rendering Kanban drag-and-drop actions introduces visual latency and sluggishness, degrading perceived user experience.

### Architectural Solution
1. When a user drags a task card to another column, the frontend immediately reorders local React state snapshots for instantaneous visual feedback.
2. An asynchronous batch reorder request is dispatched to `PUT /api/tasks/reorder/bulk`.
3. If the server rejects the request (e.g., network disconnect or database error), the catch handler restores the pre-drag snapshot in React state and displays an error toast alert to the user.

---

## 7. Payment Integrity: Server-Side HMAC-SHA256 Verification

### Design Tradeoff
Client-side payment callbacks cannot be trusted, as users can intercept and spoof frontend payment success responses.

### Architectural Solution
1. The frontend initiates an order via `POST /api/payment/create-order` and receives a verified `order_id` from the Razorpay API.
2. Upon user payment completion in Razorpay's checkout modal, the client receives `razorpay_payment_id` and `razorpay_signature`.
3. The client submits these credentials to `POST /api/payment/verify-payment`.
4. The server independently recalculates the expected signature:
   $$\text{HMAC-SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
5. The workspace is upgraded in MongoDB only upon a strict cryptographic match.

---

## 8. Automated Testing Strategy & Third-Party Isolation

### Design Tradeoff
End-to-end integration tests that call live external cloud APIs (e.g., AWS S3, Google Gemini, Slack) lead to flaky CI test runs caused by quota limits, credential expiration, or transient network delays.

### Architectural Solution
1. **Multi-Tenant Isolation Testing:** Verifies that uninvited users cannot read or inject tasks into another tenant's workspace (HTTP 403).
2. **S3 Security & Presign Signature Testing:** Validates that non-whitelisted MIME types (e.g. executables) and files exceeding 10MB are rejected with HTTP 400.
3. **Atomic Reorder Authorization Testing:** Verifies that unauthorized batch reorders are rejected.
4. **Deterministic S3 Testing:** Validates the cryptographic signature computation and endpoint schema generated by `@aws-sdk/s3-request-presigner` locally, requiring zero external AWS network roundtrips.
5. **Resilient AI Subtask Testing:** The Gemini AI controller features an internal resilient decomposition fallback, guaranteeing valid structured JSON checklist schemas during automated test runs without depending on external Google API uptime.
6. **Database Isolation:** Integration tests operate on dedicated test collections with automated teardown hooks (`after()`) ensuring zero persistent test artifact pollution.
