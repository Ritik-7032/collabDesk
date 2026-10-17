require("dotenv").config();
const cors = require("cors");
const uploadRoutes = require("./routes/uploadRoutes");
const http = require("http");
const { Server } = require("socket.io");
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const workspaceRoutes = require("./routes/workspaceRoutes");
const taskRoutes = require("./routes/taskRoutes");
const listRoutes = require("./routes/listRoutes");
const aiRoutes = require("./routes/aiRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const passport = require("./config/passport");
const dbConnect = require("./config/db");
const {
  apiLimiter,
  authLimiter,
  aiLimiter,
  uploadLimiter,
} = require("./middleware/rateLimiter");
const requestMetrics = require("./middleware/requestMetrics");

const app = express();
const server = http.createServer(app);

// Enable trust proxy for correct client IP detection behind Vercel / reverse proxies
app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "https://collab-desk-nine.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

const corsOrigin = (origin, callback) => {
  // Allow non-browser requests (e.g. server-to-server, curl) or origins in whitelist
  if (!origin || allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error("Not allowed by CORS"));
  }
};

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
});
app.set("io", io);

app.use(requestMetrics);
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());
app.use(passport.initialize());

// Rate limited API routing
app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/upload", uploadLimiter, uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/ai", aiLimiter, aiRoutes);

app.get("/", (req, res) => {
  res.send("CollabDesk API Server is running!");
});

const { errorHandler } = require("./middleware/errorMiddleware");
app.use(errorHandler);

const jwt = require("jsonwebtoken");

// Strictly Authenticate Socket.io connection handshake via JWT token
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.replace("Bearer ", "");

  if (!token) {
    return next(new Error("Unauthorized: Missing auth token"));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error("Unauthorized: Invalid or expired auth token"));
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id, socket.user ? `(User: ${socket.user.id})` : "(Guest)");

  socket.on("joinWorkspace", async (workspaceId) => {
    if (!workspaceId || !mongoose.isValidObjectId(workspaceId)) {
      socket.emit("error", { message: "Invalid workspace ID" });
      return;
    }

    if (!socket.user?.id) {
      socket.emit("error", { message: "Unauthenticated socket connection" });
      return;
    }

    try {
      const Workspace = require("./models/Workspace");
      const isMember = await Workspace.exists({
        _id: workspaceId,
        members: socket.user.id,
      });

      if (!isMember) {
        socket.emit("error", { message: "Unauthorized workspace access" });
        return;
      }

      // Strictly fail-closed: socket.join executes ONLY on verified membership
      socket.join(`workspace:${workspaceId}`);
    } catch (err) {
      console.error("Workspace room auth check error:", err.message);
      socket.emit("error", { message: "Could not join workspace" });
    }
  });

  socket.on("leaveWorkspace", (workspaceId) => {
    if (workspaceId) {
      socket.leave(`workspace:${workspaceId}`);
    }
  });

  socket.on("disconnect", () => {
    // disconnected
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "test") {
  dbConnect()
    .then(() => console.log("MongoDB connected!"))
    .catch((err) => console.log("MongoDB connection error:", err));

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = { app, server };