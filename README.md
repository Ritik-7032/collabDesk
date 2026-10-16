# 🚀 CollabDesk — Real-Time Collaborative Workspace & Kanban System

[![CI Pipeline](https://github.com/Ritik-7032/collabDesk/actions/workflows/ci.yml/badge.svg)](https://github.com/Ritik-7032/collabDesk/actions)
[![Live Demo](https://img.shields.io/badge/Demo-collab--desk--nine.vercel.app-blue?style=flat&logo=vercel)](https://collab-desk-nine.vercel.app)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![AWS EC2](https://img.shields.io/badge/AWS-EC2%20Ubuntu-FF9900?logo=amazonec2&logoColor=white)](https://aws.amazon.com/ec2/)
[![Socket.io](https://img.shields.io/badge/Socket.io-WebSockets-010101?logo=socketdotio&logoColor=white)](https://socket.io)
[![Gemini AI](https://img.shields.io/badge/Google-Gemini%201.5%20Flash-8E75B2?logo=googlegemini&logoColor=white)](https://ai.google.dev)
[![Tests](https://img.shields.io/badge/Tests-9%2F9%20Passing-brightgreen.svg)](https://nodejs.org)

CollabDesk is a distributed, full-stack collaborative Kanban workspace inspired by the design principles of Linear and Notion. Architected with a **React 19** frontend deployed on **Vercel's global edge network** and a containerized **Node.js / Express** backend running in **Docker on AWS EC2**, CollabDesk delivers real-time multi-user synchronization, automated task decomposition via Gemini AI, asynchronous Slack event alerting, and zero-RAM file streaming via AWS S3 presigned URLs.

---

## 📸 Product Overview

| Linear-Grade Dark Mode (Default) | Clean Light Mode |
| :---: | :---: |
| Sleek `#0B0D14` background, 60/30/10 color rule, tinted status badges | `#F6F7FB` surface with high-contrast typography & smooth borders |

* **Live Deployment:** [https://collab-desk-nine.vercel.app](https://collab-desk-nine.vercel.app)
* **Real-time Demo:** Open two separate browser tabs/windows side-by-side; dragging a card or creating a task in one window reflects instantaneously in the second window over WebSockets.

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Vercel Edge Network)"]
        Client["React 19 Frontend (Vite + Tailwind CSS v4)"]
        Theme["Theme Engine (Persistent Dark / Light)"]
        SocketClient["Socket.io Client (Room Scoped)"]
    end
    
    subgraph ProxyGateway ["Edge Routing & Gateway"]
        VercelProxy["Vercel Edge Reverse Proxy (/api/*)"]
    end

    subgraph CloudServer ["Backend Layer (AWS EC2 - Ubuntu 24.04 LTS)"]
        subgraph DockerContainer ["Docker Engine (Isolated Container)"]
            Router["Express 5 REST API Router"]
            AuthEngine["JWT & Bcrypt Auth Engine"]
            SocketEngine["Socket.io Server (Room-Partitioned)"]
            SlackWorker["Async Slack Webhook Dispatcher"]
        end
    end
    
    subgraph DataServices ["Cloud Infrastructure & Third-Party APIs"]
        MongoDB[(MongoDB Atlas)]
        S3["AWS S3 Bucket (Direct Binary Storage)"]
        Gemini["Google Gemini 1.5 Flash AI"]
        Razorpay["Razorpay Payment Gateway"]
        Slack["Slack Channels (#team-updates)"]
    end

    Client -- "1. API Requests (HTTPS /api/*)" --> VercelProxy
    VercelProxy -- "Reverse Proxy Forward" --> Router
    SocketClient <===>|"2. Bi-directional WebSockets (workspace:id)"| SocketEngine
    Client -.->|"3. Direct Binary PUT (Presigned URL)"| S3
    
    Router --> MongoDB
    Router --> Gemini
    Router --> Razorpay
    Router -- "Presigned PUT URL Generator" --> Client
    Router --> SlackWorker
    SlackWorker -.->|"Async Fire-and-Forget"| Slack
```

---

## 🌟 Key Engineering Features

### 1. 👥 Multi-User Real-Time Team Collaboration
* **Socket Room Isolation:** Connections are partitioned into isolated rooms (`workspace:${workspaceId}`). Events do not broadcast globally, preventing cross-tenant data leaks.
* **Optimistic UI Updates:** State updates locally with immediate visual feedback while propagating asynchronously to connected team members.
* **Team Invitation Flow:** Workspace owners can invite colleagues by email (`POST /api/workspaces/:id/members`) with granular role verification.

### 2. ⚡ Slack Webhooks Event Notification Engine
* Connects workspace channels using Slack Incoming Webhook URLs (`https://hooks.slack.com/services/...`).
* Formatted Slack Block Kit notifications fire asynchronously on:
  * 🎯 **Task Created** (displaying column, assignee, and creator).
  * 🚀 **Task Moved** (e.g., transition into *"In progress"* or completion into *"Done"*).
  * 💬 **Threaded Comments** posted on cards.
* Includes a built-in **"Send Test Ping"** utility with immediate feedback.

### 3. 🛡️ AWS S3 Direct-to-Cloud Uploads (Presigned URLs)
* Traditional file uploads stream binary data through Node.js application memory (`multer.memoryStorage`), creating severe heap pressure under load.
  > *For example: In a traditional buffer-and-upload pattern, 50 concurrent 20MB file uploads would buffer over 1GB of binary data in Node.js server RAM.*
* **CollabDesk Presigned Architecture:**
  1. Frontend requests a signed 5-minute PUT URL from `/api/upload/presign`.
  2. The server issues a cryptographically signed AWS S3 authorization without touching the raw file stream.
  3. The client streams binary bytes directly to the S3 bucket, completely bypassing application server memory buffers.

### 4. 🤖 AI-Powered Subtask Breakdown (Google Gemini 1.5 Flash)
* Leverages **Google Gemini 1.5 Flash** for natural language task planning.
* Automatically breaks down high-level task goals into 4–6 actionable checklist items with single-click acceptance.
* Employs robust JSON extraction regex to normalize LLM output variations and protect against malformed payload crashes.

### 5. 💳 Razorpay Payments & Premium Workspace Upgrades
* Order creation and checkout workflows for lifetime workspace upgrades (`₹499`).
* Cryptographic signature verification using HMAC-SHA256 (`crypto.createHmac`) prevents client-side replay and payment tampering attacks.

### 6. 🎨 Product-Grade UI & Design System (Linear & Notion Inspired)
* **60/30/10 Color Harmony:** Strict token distribution for dark surface backgrounds (`#0B0D14`), cards (`#131726`), and borders (`#1B2033`), alongside clean light mode counterparts (`#F6F7FB` / `#FFFFFF`).
* **Theme System:** Instant toggling between Dark (default) and Light mode backed by `localStorage` persistence and CSS custom properties.
* **Reusable Atomic Suite (`src/components/ui/`):** Standardized, modular `Button`, `Card`, `Modal`, `Input`, `Badge`, `Avatar`, `Skeleton`, and `ThemeToggle`.
* **Accessible Priority Badges:** Task priorities (High = Danger, Medium = Warning, Low = Success) rendered as accessible tinted badges with status dot indicators.

### 7. 🧪 Automated Integration Test Suite (9/9 Passing)
Built using Node.js native test runner and Supertest:
```bash
npm test
```
The test suite validates 9 critical integration boundaries:
1. **Health Check:** `GET /` verifies 200 OK and server status.
2. **User Registration:** Validates account creation, schema constraints, and password salting.
3. **User Authentication:** Validates email/password credentials and JWT issuance.
4. **Credential Rejection:** Ensures invalid passwords receive an explicit 401 Unauthorized.
5. **Route Protection:** Confirms protected endpoints reject unauthenticated requests.
6. **Workspace Seeding:** Validates that new workspaces auto-seed default columns (*To do*, *In progress*, *Done*).
7. **S3 Presigned URLs:** Confirms signature generation and endpoint format without server binary buffering.
8. **Gemini AI Breakdown:** Verifies prompt submission and structured checklist array output.
9. **Password Reset Lifecycle:** End-to-end token generation, SHA-256 hash lookup, password reset, and subsequent login.

---

## 🚀 Getting Started

### Prerequisites
* **Docker & Docker Compose** (Recommended for 1-command startup) OR **Node.js v20+**
* MongoDB Atlas database connection string
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

# View logs
docker compose logs -f
```

---

### Method B: 💻 Manual Local Development

#### 1. Backend Setup
```bash
cd backend
npm install

# Run automated integration tests
npm test

# Start development server
npm run dev
```

Create `backend/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=your_bucket_name
GEMINI_API_KEY=your_gemini_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLIENT_URL=http://localhost:5173
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
| `PATCH` | `/api/workspaces/:id/slack-webhook` | Update Slack incoming webhook URL | 🔒 Yes |
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
| `POST` | `/api/ai/generate-subtasks` | AI task decomposition via Gemini 1.5 Flash | 🔒 Yes |
| `POST` | `/api/payment/create-order` | Create Razorpay order for lifetime Pro plan | 🔒 Yes |
| `POST` | `/api/payment/verify-payment` | Verify HMAC-SHA256 signature & upgrade plan | 🔒 Yes |

---

## 🧠 Design Decisions & Engineering Tradeoffs

### Q1: Why use S3 Presigned URLs instead of buffering file uploads through Express?
> **Design Tradeoff:** Streaming multipart uploads through the Node.js server (`multer.memoryStorage`) buffers raw bytes directly in heap memory. In concurrent upload scenarios (e.g., multiple team members attaching screenshots or PDFs simultaneously), server memory can surge rapidly, risking event loop starvation or Out-Of-Memory (OOM) crashes.
> 
> **Solution:** CollabDesk implements a two-step presigned URL pattern. The backend issues a time-bounded (5 min) cryptographic signature containing authorized parameters (S3 bucket, object key, allowed MIME type). The browser streams the binary payload directly to AWS S3. The application server acts purely as an authorization plane and handles zero binary data.

### Q2: How does CollabDesk prevent cross-tenant WebSocket leaks?
> **Design Tradeoff:** A naive `io.emit()` broadcasts events to all connected clients on the server, exposing sensitive internal workspace mutations across independent accounts.
> 
> **Solution:** CollabDesk partitions real-time traffic using Socket.io rooms scoped to `workspace:${workspaceId}`. Clients join their active room upon mounting a board view and leave on unmount. Furthermore, incoming task mutations verify workspace membership before emitting exclusively to the targeted room channel.

### Q3: How are Slack webhooks prevented from impacting core API latency?
> **Design Tradeoff:** External HTTP webhooks can be slow, rate-limited, or temporarily unavailable. Awaiting a Slack webhook response within the Express request-response lifecycle adds external latency to database mutations and introduces a point of failure.
> 
> **Solution:** Slack notifications are dispatched using an asynchronous fire-and-forget pattern with an isolated `.catch()` error handler. Even if Slack's API experiences downtime, network timeouts, or rate limits, the primary task mutation commits to MongoDB and responds to the client immediately.

### Q4: Why a Hybrid Deployment (Vercel Edge + AWS EC2 Container)?
> **Design Tradeoff:** Vercel's serverless edge is ideal for global asset delivery and client performance, but serverless environments cannot maintain long-lived TCP connections required for WebSockets (Socket.io). Conversely, hosting the entire frontend on a traditional VM increases global latency.
> 
> **Solution:** CollabDesk separates concerns:
> * **Frontend on Vercel Global Edge:** Ensures sub-second static page loads and automated Git CI/CD.
> * **Backend in Docker on AWS EC2:** Provides a dedicated, always-on persistent runtime for stateful Socket.io WebSocket connections.
> * **Vercel Reverse Proxy (`/api/*`):** Edge rewrites securely proxy API calls to the EC2 container over HTTPS, resolving browser mixed-content security constraints without brittle third-party tunnels.

### Q5: How is payment tampering prevented in Razorpay checkout?
> **Design Tradeoff:** Client-side payment callbacks cannot be trusted as users can spoof successful payment responses in the browser.
> 
> **Solution:** The frontend only receives transaction reference IDs. Upgrading the user's workspace plan requires a server-side verification endpoint (`/api/payment/verify-payment`) that recalculates an HMAC-SHA256 signature using `razorpay_order_id + "|" + razorpay_payment_id` against the secret key. The plan is updated in MongoDB only upon cryptographic match.

---

## 📂 Project Structure

```
collabDesk/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI automated build & test pipeline
├── backend/
│   ├── config/                # DB, Passport, Gemini, S3, Razorpay configurations
│   ├── controllers/           # Business logic (auth, workspace, task, list, AI, upload, payment)
│   ├── middleware/            # JWT auth & centralized error handling
│   ├── models/                # Mongoose schemas (User, Workspace, List, Task)
│   ├── routes/                # Express REST API route definitions
│   ├── utils/                 # Asynchronous Slack notification service
│   ├── tests/                 # Supertest 9-suite integration test runner
│   ├── Dockerfile             # Production-grade Node.js 20 Alpine container
│   └── server.js              # Server entry point & Socket.io room lifecycle
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Modals (Invite, Slack, Task), Kanban Columns & Cards
│   │   │   └── ui/            # Reusable atomic UI suite (Button, Card, Modal, Input, Badge, etc.)
│   │   ├── context/           # ThemeContext (Dark/Light), AuthContext, ToastContext
│   │   ├── lib/               # Dynamic Axios client, Socket.io client, color utilities
│   │   ├── pages/             # Landing, Dashboard, WorkspacePage, Auth pages
│   │   └── App.jsx            # Router and layout configuration
│   ├── vercel.json            # Edge reverse proxy rewrite configuration
│   └── vite.config.js
│
├── docker-compose.yml         # Container orchestration with auto-restart policies
└── README.md
```

---

## 📄 License
ISC License — Built for engineering portfolio and scalable production showcase.
