# 🚀 CollabDesk — Real-Time Collaborative Workspace & Kanban System

[![CI Pipeline](https://github.com/Ritik-7032/collabDesk/actions/workflows/ci.yml/badge.svg)](https://github.com/Ritik-7032/collabDesk/actions)
[![Live Demo](https://img.shields.io/badge/Demo-collab--desk--nine.vercel.app-blue?style=flat&logo=vercel)](https://collab-desk-nine.vercel.app)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS EC2](https://img.shields.io/badge/AWS-EC2%20Ubuntu-FF9900?logo=amazonec2&logoColor=white)](https://aws.amazon.com/ec2/)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-010101?logo=socketdotio&logoColor=white)](https://socket.io)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini%203.8%20Flash-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Tests](https://img.shields.io/badge/Tests-20%2F20%20Passing-brightgreen.svg)](https://nodejs.org)

CollabDesk is a distributed, full-stack collaborative Kanban workspace inspired by the design principles of Linear and Notion. Architected with a **React 19** frontend deployed on **Vercel's global edge network** and a containerized **Node.js / Express** backend running in **Docker on AWS EC2**, CollabDesk delivers real-time multi-user synchronization, automated task decomposition via Gemini AI, asynchronous Slack event alerting, and direct-to-cloud file streaming via AWS S3 presigned URLs.

---

## 📸 Product Overview & UI Showcase

| Linear-Grade Dark Mode (Default) | Task Detail Modal & AI Subtasks |
| :---: | :---: |
| ![CollabDesk Kanban Board](docs/screenshots/board-dark.png) | ![Task Detail Modal & AI Generator](docs/screenshots/task-modal-ai.png) |

| Multi-Workspace Dashboard | Landing Page |
| :---: | :---: |
| ![Workspaces Dashboard](docs/screenshots/dashboard.png) | ![CollabDesk Landing Page](docs/screenshots/landing.png) |

* **Live Deployment:** [https://collab-desk-nine.vercel.app](https://collab-desk-nine.vercel.app)
* **Real-time Demo:** Open two separate browser tabs side-by-side; dragging a card or creating a task in one window reflects instantaneously in the second window.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Vercel Edge Network)"]
        Client["React 19 Frontend (Vite + Tailwind CSS v4)"]
        Theme["Theme Engine (Persistent Dark / Light)"]
        SocketClient["Socket.io Client (JWT Handshake + Scoped Rooms)"]
    end
    
    subgraph ProxyGateway ["Edge Routing & Gateway"]
        VercelProxy["Vercel Edge Reverse Proxy (/api/* & /socket.io/*)"]
    end

    subgraph CloudServer ["Backend Layer (AWS EC2 - Ubuntu 24.04 LTS)"]
        subgraph DockerContainer ["Docker Engine (Isolated Container)"]
            Router["Express 5 REST API Router"]
            AuthEngine["JWT & Bcrypt Auth Engine"]
            SocketEngine["Socket.io Server (Authenticated Handshake & Rooms)"]
            SlackWorker["Async Slack Webhook Dispatcher"]
        end
    end
    
    subgraph DataServices ["Cloud Infrastructure & Third-Party APIs"]
        MongoDB[(MongoDB Atlas)]
        S3["AWS S3 Bucket (Direct Binary Storage)"]
        Gemini["Google Gemini 3.8 Flash"]
        Razorpay["Razorpay Payment Gateway"]
        Slack["Slack Channels (#team-updates)"]
    end

    Client -- "1. API Requests (HTTPS /api/*)" --> VercelProxy
    VercelProxy -- "Edge Reverse Proxy" --> Router
    SocketClient <===>|"2. Real-Time State Sync"| VercelProxy
    VercelProxy <===>|"Proxy /socket.io/*"| SocketEngine
    Client -.->|"3. Direct Binary PUT (Presigned URL)"| S3
    
    Router --> MongoDB
    Router --> Gemini
    Router --> Razorpay
    Router -- "Presigned PUT URL Generator" --> Client
    Router --> SlackWorker
    SlackWorker -.->|"Async Fire-and-Forget"| Slack
```

---

## 🌟 Key Engineering Highlights

* **Multi-Workspace Real-Time Sync:** Real-time state synchronization via authenticated **Socket.io** rooms (`workspace:${workspaceId}`). Sockets authenticate via JWT handshakes, and room joins verify MongoDB workspace membership before granting subscription.
* **Optimistic UI with Server Reconciliation:** Drag-and-drop card transitions update local React state immediately for zero-perceived-latency interaction. If the batch mutation fails or the server rejects the request, the client alerts the user with a toast and triggers an immediate `fetchAll()` reconciliation to resync state against the database.
* **Direct-to-S3 Presigned Uploads:** File attachments bypass application server memory buffers entirely. The backend validates file metadata (`fileSize <= 10MB` and MIME whitelist) and returns an AWS S3 presigned PUT URL with Content-Type and Content-Length signature locking.
* **Resilient Gemini AI Breakdown:** Powered by **Google Gemini 3.8 Flash** (`gemini-3.8-flash`) to decompose high-level task goals into structured checklist items. Features transparent status reporting and resilient template fallback so upstream API spikes never break user interactions.
* **Fire-and-Forget Slack Alerts:** Dispatches asynchronous Slack Block Kit notifications on task creation and column moves without blocking core HTTP request-response cycles.
* **Enterprise Security & Payments:** Pure `httpOnly` secure cookies with `SameSite=Lax`, anti-enumeration password resets with automated mailer dispatch, atomic user-bound Razorpay orders with replay attack prevention, and masked Slack webhook URLs across single and list endpoints.
* **Automated CI/CD Test Pipeline:** 20 hermetic integration tests and 1 live multi-node Redis cluster verification suite executed via Supertest, Socket.io client, and GitHub Actions validating authentication, atomic OCC, S3 signature security, payment replay defense, Slack webhook masking, and real-time room isolation.

---

## 🚀 Getting Started

### Prerequisites
* **Docker & Docker Compose** (Recommended for single-command launch) OR **Node.js v20+**
* MongoDB Atlas connection string
* AWS IAM credentials with S3 PutObject access
* Google Gemini API Key

---

### Method A: 🐳 Docker Compose (Recommended)

Run the entire backend in a single command with automatic container restarts:

```bash
# 1. Clone repository
git clone https://github.com/Ritik-7032/collabDesk.git
cd collabDesk

# 2. Configure backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# 3. Build and launch container in background
docker compose up -d --build

# View container logs
docker compose logs -f
```

---

### Method B: 💻 Manual Local Development

#### 1. Backend Setup
```bash
cd backend
cp .env.example .env
npm install

# Run automated integration tests
npm test

# Start development server
npm run dev
```

#### 2. Frontend Setup
```bash
cd frontend
npm install

# Start Vite dev server with API proxy
npm run dev

# Build production bundle
npm run build
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/signup` | Register new user account | ❌ No |
| `POST` | `/api/auth/login` | Login with credentials & receive JWT token | ❌ No |
| `POST` | `/api/auth/forgot-password` | Generate 15-minute cryptographic reset token | ❌ No |
| `POST` | `/api/auth/reset-password` | Reset password using valid token | ❌ No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | 🔒 Yes |
| `GET` | `/api/auth/google` | Initiate Google OAuth 2.0 flow | ❌ No |
| `POST` | `/api/workspaces` | Create workspace & seed default Kanban lists | 🔒 Yes |
| `GET` | `/api/workspaces` | Fetch all workspaces user belongs to | 🔒 Yes |
| `POST` | `/api/workspaces/:id/members` | Invite team member by email | 🔒 Yes |
| `DELETE` | `/api/workspaces/:id/members/:mId` | Remove member from workspace (Owner only) | 🔒 Yes |
| `PUT, PATCH` | `/api/workspaces/:id/slack-webhook` | Update Slack incoming webhook URL (Workspace Owner only) | 🔒 Yes |
| `POST` | `/api/workspaces/:id/slack-test` | Dispatch test ping to Slack channel | 🔒 Yes |
| `GET` | `/api/lists/workspace/:wsId` | Fetch ordered columns for a workspace | 🔒 Yes |
| `POST` | `/api/lists` | Create a new custom column | 🔒 Yes |
| `PUT` | `/api/lists/reorder` | Bulk reorder columns | 🔒 Yes |
| `GET` | `/api/tasks/workspace/:wsId` | Fetch all tasks for a workspace | 🔒 Yes |
| `POST` | `/api/tasks` | Create task (triggers Socket & Slack alert) | 🔒 Yes |
| `PUT` | `/api/tasks/:id` | Update task fields (checklist, assignee, priority) | 🔒 Yes |
| `PUT` | `/api/tasks/reorder/bulk` | Drag-and-drop batch position update | 🔒 Yes |
| `POST` | `/api/tasks/:id/comments` | Add threaded comment to card | 🔒 Yes |
| `POST` | `/api/upload/presign` | Generate direct S3 Presigned PUT URL | 🔒 Yes |
| `POST` | `/api/ai/generate-subtasks` | AI task decomposition via Gemini 3.8 Flash (with resilient fallback) | 🔒 Yes |
| `POST` | `/api/payment/create-order` | Create Razorpay order for lifetime Pro plan | 🔒 Yes |
| `POST` | `/api/payment/verify-payment` | Verify HMAC-SHA256 signature & upgrade plan | 🔒 Yes |

---

## 📊 Performance Benchmarks & Load Testing

CollabDesk includes an automated load testing harness using **Autocannon** and **k6** to measure throughput and latency distributions across real-world database and gateway workloads.

### Scenario A: Authenticated Database Read (`GET /api/tasks/workspace/:id`)
* **Workload:** 10 concurrent connections (simulating active sprint team) reading 20 populated task documents over MongoDB Atlas with JWT verification, workspace authorization, and compound B-Tree index scan (`{ workspace: 1, position: 1 }`).
* **Environment:** Client test runner connecting across public WAN to AWS `ap-south-1` MongoDB Atlas cluster.
* **Tool:** Autocannon (5s sustained run)

#### The WAN Latency Floor & Architectural Optimization
A naive un-cached read over public cloud infrastructure incurs **3 sequential network hops** per request:
1. `authMiddleware` verifies JWT and performs `User.findById` (RTT 1: ~50ms)
2. `workspaceAccess` queries `Workspace.exists` to verify membership (RTT 2: ~50ms)
3. `taskController` queries `Task.find` with population (RTT 3: ~50ms)

$$\text{Theoretical Latency Floor} = 3 \times 55\text{ms} \approx 165\text{ms} - 200\text{ms}$$

To eliminate redundant WAN round-trips for repeated sprint team queries, CollabDesk introduces **15-second TTL in-memory session and membership micro-caching** (`sessionCache` and `memberCache`) with immediate cache invalidation on member revocation (`invalidateMembershipCache`). This collapses subsequent queries from 3 network round-trips down to **1 single database hop**.

#### Measured Results: Before vs. After Micro-Caching Optimization

| Metric | Baseline (3 Sequential WAN Hops) | Optimized (1 Single WAN Hop) | Variance / Delta |
| :--- | :--- | :--- | :--- |
| **Throughput** | 33.8 req/sec | **105.0 req/sec** | **+210% (3.1x)** |
| **Median Latency (p50)** | 202 ms | **64 ms** | **-68% latency** |
| **Average Latency** | 291.8 ms | **97.9 ms** | **-66% latency** |
| **97.5th Percentile (p97.5)**| 581 ms | **433 ms** | **-25% latency** |
| **99th Percentile (p99)** | 861 ms | **497 ms** | **-42% latency** |
| **Bandwidth** | 356 kB/sec | **1.11 MB/sec** | **+211%** |
| **Completed Requests** | 179 reqs / 5s | **500 reqs / 5s** | **+179%** |
| **HTTP Error Rate** | 0.00% (0 / 179) | **0.00% (0 / 500)** | **0 errors** |

> ℹ️ **Tail Latency Analysis:** While median latency dropped by 68% (from 202ms to 64ms), high-percentile tail latency (p97.5 at 433ms, p99 at 497ms) remains present due to public internet WAN TCP congestion and TLS jitter between the local test client and MongoDB Atlas in AWS `ap-south-1`. In co-located AWS VPC deployments, VPC peering reduces this network hop to under 2ms.
>
> ⚠️ **Architectural Tradeoff (Cache vs. DB Authorization):** The 3.1x throughput improvement is achieved through 15-second TTL in-memory micro-caching of user sessions and workspace memberships. In distributed multi-instance clusters, immediate cross-node invalidation is propagated via Redis Pub/Sub (`collabdesk:cache:invalidate`). If Redis is not deployed, single-node fallback introduces a maximum 15-second staleness window before revoked member REST queries are blocked.

---

### Scenario B: Gateway & Security Pipeline (`GET /`)
* **Workload:** 50 concurrent connections testing Express middleware chain (Helmet security headers, CORS origin validation, and nanosecond latency tracking via `process.hrtime.bigint`).

| Metric | Measured Value | Unit |
| :--- | :--- | :--- |
| **Throughput** | 9,282 | requests / second |
| **Bandwidth** | 9.1 | MB / second |
| **Median Latency (p50)** | 4.0 | ms |
| **97.5th Percentile (p97.5)** | 11.0 | ms |
| **99th Percentile (p99)** | 16.0 | ms |
| **Average Latency** | 4.92 | ms |
| **HTTP Error Rate** | 0.00% (0 errors / 46,000 total requests) | % |

```bash
# Reproduce the authenticated database benchmark locally:
cd backend && npm run benchmark

# Verify live Google Gemini 3.8 Flash model connectivity & subtask generation:
npm run verify:gemini

# Run the cross-instance Redis cluster verification:
npm run test:cluster

# Run k6 scenario:
k6 run tests/k6-load-test.js
```

---

## 🌐 Horizontal Scaling & Redis Pub/Sub Cluster

CollabDesk is architected for seamless horizontal scale across multiple Node.js instances behind a load balancer:

1. **Redis Pub/Sub Adapter (`@socket.io/redis-adapter`):**
   - When running multiple backend processes, socket connections distribute across instances.
   - Room events (`workspace:${id}`) emitted on Instance B automatically publish to Redis and fan out to sockets connected on Instance A.
2. **Multi-Instance Docker Compose Setup:**
   - `docker-compose.yml` orchestrates two backend replicas (`backend` on `:5000` and `backend-replica` on `:5001`) alongside a shared `redis:7-alpine` container (`:6379`).
   - If `REDIS_URL` is omitted, the server automatically falls back to single-node in-memory adapter without throwing errors.
3. **Cross-Instance RemoteSocket Eviction (`socket.data.user`):**
   - Socket.io's `io.in(room).fetchSockets()` returns `RemoteSocket` proxies for connections hosted on peer instances.
   - Custom properties set on `socket` (e.g. `socket.user`) are lost across process boundaries. CollabDesk sets `socket.data.user = decoded` during the handshake, ensuring member eviction (`s.leave(roomName)`) properly identifies and evicts revoked users across cluster nodes.
   - Fully automated and verified in `backend/tests/cross-instance-test.js` (`npm run test:cluster`).

## 🧠 Core Design Decisions & Engineering Tradeoffs

### 1. Direct S3 Presigned Uploads: Server Offloading vs. Cryptographic Size Enforcement
* **Tradeoff:** Streaming uploads through Express (`multer.memoryStorage`) buffers raw bytes directly in heap memory, risking event loop starvation or Out-Of-Memory (OOM) crashes under concurrent load. Conversely, naive presigned URLs delegate binary transfer to AWS S3 without verifying byte payloads.
* **Solution:** CollabDesk implements strict server-side pre-validation (`fileSize <= 10MB` and strict MIME whitelist) before generating an AWS S3 presigned PUT URL with `ContentType` and `ContentLength` cryptographically bound into `X-Amz-SignedHeaders`. If a client attempts to upload an altered payload or exceeds the signed size, AWS S3 cryptographically rejects the request with `SignatureDoesNotMatch`.

### 2. Hybrid Real-Time Transport & Edge TLS Gateway
* **Tradeoff:** Modern web browsers enforce strict mixed-content security policies blocking unencrypted calls (`http://` or `ws://`) from HTTPS frontend deployments. Vercel's serverless edge terminates client SSL and provides global CDN caching, but proxying directly to a public EC2 IP leaves intermediate transit over plain HTTP.
* **Solution:** CollabDesk routes browser requests securely through Vercel's Edge Reverse Proxy (`/api/*` and `/socket.io/*`), utilizing HTTP long-polling over HTTPS with zero browser security blocks. For end-to-end encrypted production deployments and native full-duplex WebSockets (WSS), the architecture provides an orchestrated Nginx reverse proxy gateway with automated Let's Encrypt Certbot SSL renewal (`docker compose --profile production up -d`).

### 3. WebSocket Security: JWT Handshake & Database Room Authorization
* **Tradeoff:** Unauthenticated socket connections allow eavesdropping, and naive `io.emit()` broadcasts leak internal task updates across different organizations.
* **Solution:** CollabDesk enforces a two-layer security barrier: incoming socket handshakes are strictly authenticated via JWT middleware (`io.use`), rejecting missing or invalid tokens at the handshake level. Furthermore, room access (`workspace:${id}`) verifies active MongoDB workspace membership before subscription, and member revocation dynamically evicts active sockets from the room.

### 4. Third-Party Resiliency: Slack Webhooks & Gemini AI Fallback
* **Tradeoff:** External APIs (Slack, Google Gemini) are subject to transient network latency, rate limits, and outages. Blocking core database transactions on external API acknowledgments degrades latency and creates single points of failure.
* **Solution:** Slack notifications dispatch asynchronously in a fire-and-forget pattern with isolated error handling. Similarly, the Gemini AI task decomposition controller includes an internal fallback handler so that upstream Google API 503 rate-limit spikes never crash the user experience or fail CI test suites.

> 📖 **Deep Dive:** For the complete in-depth analysis of all 14 architectural decisions, failure modes, and testing strategies, see [docs/DESIGN.md](docs/DESIGN.md).

---

## 📂 Project Structure

```
collabDesk/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI automated build & test pipeline
├── docs/
│   ├── DESIGN.md              # In-depth architectural tradeoffs & failure modes
│   └── screenshots/           # High-resolution production UI screenshots
│       ├── board-dark.png     # Linear-grade Kanban board in dark mode
│       ├── task-modal-ai.png  # Task modal with Gemini AI subtask generator
│       ├── dashboard.png      # Multi-workspace dashboard
│       └── landing.png        # Landing page with interactive mockups
├── backend/
│   ├── config/                # DB, Passport, Gemini, S3, Razorpay configurations
│   ├── controllers/           # Business logic (auth, workspace, task, list, AI, upload, payment)
│   ├── middleware/            # Helmet, JWT auth, workspaceAccess, rateLimiter & requestMetrics
│   ├── models/                # Mongoose schemas (User, Workspace, List, Task, Order) with OCC & indexes
│   ├── routes/                # Express REST API route definitions
│   ├── utils/                 # Asynchronous Slack notification service
│   ├── tests/                 # Supertest & Socket.io 20-test integration suite & Redis cluster test runner
│   ├── Dockerfile             # Production-grade Node.js 20 Alpine container
│   ├── .env.example           # Documented environment template
│   └── server.js              # Server entry point, JWT socket handshake & room authorization
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Modals (Invite, Slack, Task), Kanban Columns & Cards
│   │   │   └── ui/            # Reusable atomic UI suite (Button, Card, Modal, Input, Badge, etc.)
│   │   ├── context/           # ThemeContext (Dark/Light), AuthContext, ToastContext
│   │   ├── lib/               # Dynamic Axios client, Socket.io client, color utilities
│   │   ├── pages/             # Landing, Dashboard, WorkspacePage, Auth pages
│   │   └── App.jsx            # Router and layout configuration
│   ├── vercel.json            # Edge reverse proxy rewrite configuration (/api/* & /socket.io/*)
│   └── vite.config.js
│
├── nginx/
│   └── nginx.conf             # Production TLS reverse proxy, WebSocket gateway & load balancer
├── docker-compose.yml         # Container orchestration (2 backend replicas, Redis 7 & Nginx proxy)
└── README.md
```

---

## 📄 License
ISC License — Built for engineering portfolio and scalable production showcase.
