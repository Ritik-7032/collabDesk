# CollabDesk Backend

AI-powered team workspace with authentication, real-time Kanban boards, file uploads, AI task breakdown, and payments.

## Features
- JWT + Google OAuth authentication
- Workspace and Kanban task management
- Real-time updates via Socket.io
- File uploads to AWS S3
- AI-generated subtasks using Gemini
- Razorpay payment integration
- Deployed on AWS EC2 with PM2

## Tech Stack
Node.js, Express, MongoDB, Socket.io, AWS S3, Google Gemini API, Razorpay, Passport.js

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register with email/password |
| POST | `/api/auth/login` | Login with email/password |
| GET | `/api/auth/google` | Start Google OAuth flow |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/me` | Get logged-in user (protected) |

### Workspaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/workspaces` | Create a workspace |
| GET | `/api/workspaces` | List user's workspaces |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/workspace/:workspaceId` | Get tasks for a workspace |
| PUT | `/api/tasks/:id` | Update task status (emits real-time event) |
| DELETE | `/api/tasks/:id` | Delete a task |

### File Upload
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload a file to S3, returns public URL |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/generate-subtasks` | Generate subtasks from a task description |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create-order` | Create a Razorpay order |
| POST | `/api/payment/verify-payment` | Verify payment signature, upgrade plan |

## Local Setup

1. Clone the repository
   ```
   git clone https://github.com/Ritik-7032/collabdesk-backend.git
   cd collabdesk-backend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGO_URI=your_mongodb_atlas_uri
   JWT_SECRET=your_jwt_secret
   AWS_ACCESS_KEY_ID=your_aws_key
   AWS_SECRET_ACCESS_KEY=your_aws_secret
   AWS_REGION=your_aws_region
   AWS_BUCKET_NAME=your_s3_bucket
   GEMINI_API_KEY=your_gemini_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
   ```

4. Run the server
   ```
   npm run dev
   ```

## Deployment
Deployed on an AWS EC2 (Ubuntu) instance, managed with PM2 for zero-downtime process management and auto-restart on reboot.

## Author
Built by Ritik Kumar as a learning project covering full-stack backend development — authentication, real-time systems, cloud storage, AI integration, and payment gateways.