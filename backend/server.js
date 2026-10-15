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
const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  process.env.CLIENT_URL,
].filter(Boolean);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      // Allow seamless connection from local dev, EC2, or deployed client
      callback(null, true);
    },
    credentials: true,
  },
});
app.set("io", io);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(passport.initialize());
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/ai", aiRoutes);

app.get("/", (req, res) => {
  res.send("CollabDesk API Server is running!");
});

const { errorHandler } = require("./middleware/errorMiddleware");
app.use(errorHandler);

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("joinWorkspace", (workspaceId) => {
    if (workspaceId) {
      socket.join(`workspace:${workspaceId}`);
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
    console.log(`Server ${PORT} pe chal raha hai`);
  });
}

module.exports = { app, server };