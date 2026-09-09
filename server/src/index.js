import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { router as taskRoutes } from "./routes/tasks.js";
import { router as milestoneRoutes } from "./routes/milestones.js";
import { router as activityRoutes } from "./routes/activity.js";
import { getDb, save, COLUMN_LABELS } from "./store.js";
import { recordActivity } from "./routes/activity.js";

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
  },
});

app.set("io", io);
app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/tasks", taskRoutes);
app.use("/api/milestones", milestoneRoutes);
app.use("/api/activity", activityRoutes);

const presence = new Map(); // socketId -> { name }

function broadcastPresence() {
  io.emit("presence:update", {
    names: [...presence.values()].map((u) => u.name),
    count: presence.size,
  });
}

io.on("connection", (socket) => {
  socket.on("presence:join", (payload) => {
    const name = String(payload?.name || "Guest").trim() || "Guest";
    presence.set(socket.id, { name });
    broadcastPresence();
  });

  socket.on("task:move", (payload) => {
    const task = getDb().tasks.find((t) => t.id === payload?.id);
    if (task && payload?.status && COLUMN_LABELS[payload.status]) {
      const movedTo = payload.status;
      const wasSame = task.status === movedTo;
      task.status = movedTo;
      save();
      if (!wasSame) {
        recordActivity(io, {
          actor: payload?.actor || "Someone",
          text: `moved "${task.title}" to ${COLUMN_LABELS[movedTo]}`,
          taskId: task.id,
        });
      }
      io.emit("tasks:update", getDb().tasks);
    }
  });

  socket.on("typing:start", (payload) => {
    socket.broadcast.emit("typing", {
      name: payload?.name,
      taskId: payload?.taskId,
      typing: true,
    });
  });

  socket.on("typing:stop", (payload) => {
    socket.broadcast.emit("typing", {
      name: payload?.name,
      taskId: payload?.taskId,
      typing: false,
    });
  });

  socket.on("disconnect", () => {
    presence.delete(socket.id);
    broadcastPresence();
  });
});

const PORT = process.env.PORT || 4000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Collaboration server running at http://localhost:${PORT}`);
});