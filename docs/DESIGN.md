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

## 2. Direct-to-Cloud Uploads: Presigned PUT vs. Presigned POST

### Design Tradeoff
Streaming file uploads directly through Node.js (`multer.memoryStorage`) buffers raw binary data in heap memory. In concurrent upload scenarios (e.g., 50 simultaneous 20MB attachments), Node.js server RAM surges by over 1GB, risking garbage collection pauses or Out-Of-Memory (OOM) crashes.

### Architectural Solution
CollabDesk utilizes AWS S3 Presigned URLs:
1. **Server Metadata Validation:** Before generating a signed URL, the `/api/upload/presign` endpoint verifies that the reported `fileSize <= 10MB` and validates the `fileType` against an allowed MIME whitelist (images, PDFs, text, zip).
2. **Signature Locking:** The server computes an AWS S3 `PutObjectCommand` signature bound to the exact `ContentType`. The browser streams the binary payload directly to AWS S3.
3. **Engineering Tradeoff (PUT vs. POST):**
   - *Current Implementation (Presigned PUT):* Completely offloads raw binary streaming from the Node.js server while cryptographically enforcing the `ContentType` header. File size validation is enforced server-side against client-provided metadata.
   - *Production Evolution (Presigned POST):* For hard byte-level size enforcement directly on AWS infrastructure without trusting client metadata, AWS S3 Presigned POST with a `content-length-range` policy condition is the next architectural step.

---

## 3. WebSocket Security: JWT Handshake & Room Partitioning

### Design Tradeoff
In a multi-workspace platform, a naive `io.emit()` broadcast leaks internal task updates across different organizations. Furthermore, allowing unauthenticated connections or arbitrary room joins allows malicious users to eavesdrop on private workspace channels.

### Architectural Solution
CollabDesk enforces a two-tier socket security model:
1. **JWT Handshake Authentication:**
   - Incoming socket connections are intercepted via an authentication middleware (`io.use`).
   - The token provided in `socket.handshake.auth.token` is cryptographically verified against `JWT_SECRET`. Unauthenticated connections are flagged, and user identity is attached to the socket instance (`socket.user`).
2. **Workspace-Scoped Rooms with Strict Fail-Closed Database Authorization:**
   - Clients request to join rooms isolated to `workspace:${workspaceId}`.
   - **Fail-Closed Validation:** The server rejects room joins immediately if `workspaceId` is missing/invalid, or if the socket is unauthenticated (`!socket.user?.id`).
   - The server queries MongoDB (`Workspace.exists({ _id: workspaceId, members: socket.user.id })`). If the user is not a member, or if a database timeout/error occurs, the request fails closed and `socket.join()` is strictly withheld.
   - **Revocation Consideration (Production Nuance):** While room join enforces strict entry-time authorization, dynamic revocation (e.g., calling `io.in(...).socketsLeave(...)` upon member removal via `DELETE /api/workspaces/:id/members/:mId`) represents the next architectural hardening step to evict existing active socket connections in real time.

---

## 4. Asynchronous Slack Webhooks: Fire-and-Forget Resiliency

### Design Tradeoff
Third-party notification APIs (such as Slack Webhooks) are subject to external network latency, rate limits, and service outages. Blocking the core Express API response until Slack acknowledges the webhook introduces external latency and creates a single point of failure for task creation.

### Architectural Solution
Slack notifications are dispatched using an asynchronous **fire-and-forget** pattern:
- The database mutation commits to MongoDB and responds to the client immediately.
- The webhook dispatcher executes in the background with an isolated `.catch()` error handler.
- If Slack returns HTTP 429 (Rate Limited) or encounters network downtime, the error is logged to cloud monitoring without failing the user's primary HTTP transaction.

---

## 5. Optimistic UI Updates & Error Rollback

### Design Tradeoff
Awaiting full server round-trips before re-rendering Kanban drag-and-drop actions introduces visual latency and sluggishness, degrading perceived user experience.

### Architectural Solution
1. When a user drags a task card to another column, the frontend immediately reorders local React state snapshots for instantaneous visual feedback.
2. An asynchronous batch reorder request is dispatched to `PUT /api/tasks/reorder/bulk`.
3. If the server rejects the request (e.g., network disconnect or database error), the catch handler restores the pre-drag snapshot in React state and displays an error toast alert to the user.

---

## 6. Payment Integrity: Server-Side HMAC-SHA256 Verification

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

## 7. Automated Testing Strategy & Third-Party Isolation

### Design Tradeoff
End-to-end integration tests that call live external cloud APIs (e.g., AWS S3, Google Gemini, Slack) lead to flaky CI test runs caused by quota limits, credential expiration, or transient network delays.

### Architectural Solution
1. **Deterministic S3 Testing:** The S3 presigned URL test validates the cryptographic signature computation and endpoint schema generated by `@aws-sdk/s3-request-presigner` locally, requiring zero external AWS network roundtrips.
2. **Resilient AI Subtask Testing:** The Gemini AI controller features an internal resilient decomposition fallback, guaranteeing valid structured JSON checklist schemas during automated test runs without depending on external Google API uptime.
3. **Database Isolation:** Integration tests operate on dedicated test collections with automated teardown hooks (`after()`) ensuring zero persistent test artifact pollution.
