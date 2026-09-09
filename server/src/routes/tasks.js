import { Router } from "express";
import {
  getDb,
  save,
  nextId,
  BOARD_COLUMNS,
  PRIORITIES,
  COLUMN_LABELS,
} from "../store.js";
import { recordActivity } from "./activity.js";

const router = Router({ mergeParams: true });

function emitTasks(io) {
  io.emit("tasks:update", getDb().tasks);
}

router.get("/columns", (req, res) => {
  res.json(BOARD_COLUMNS);
});

router.get("/", (req, res) => {
  const { milestoneId, assignee, status, priority } = req.query;
  let tasks = getDb().tasks;
  if (milestoneId) tasks = tasks.filter((t) => t.milestoneId === milestoneId);
  if (assignee) tasks = tasks.filter((t) => t.assignee === assignee);
  if (status) tasks = tasks.filter((t) => t.status === status);
  if (priority) tasks = tasks.filter((t) => t.priority === priority);
  res.json(tasks);
});

router.post("/", (req, res) => {
  const {
    title,
    description = "",
    status = "todo",
    assignee = "",
    milestoneId = null,
    priority = "medium",
    dueDate = null,
  } = req.body || {};
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "title is required" });
  }
  if (!BOARD_COLUMNS.includes(status)) {
    return res.status(400).json({ error: `status must be one of ${BOARD_COLUMNS.join(", ")}` });
  }
  if (!PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: `priority must be one of ${PRIORITIES.join(", ")}` });
  }
  const task = {
    id: nextId("t"),
    title,
    description,
    status,
    assignee,
    milestoneId,
    priority,
    dueDate,
    comments: [],
    createdAt: Date.now(),
  };
  getDb().tasks.push(task);
  save();
  recordActivity(req.app.get("io"), {
    actor: assignee || "Someone",
    text: `created task "${task.title}"`,
    taskId: task.id,
  });
  emitTasks(req.app.get("io"));
  res.status(201).json(task);
});

router.patch("/:id", (req, res) => {
  const task = getDb().tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const { title, description, status, assignee, milestoneId, priority, dueDate } = req.body || {};

  const changes = [];
  if (title !== undefined && title !== task.title) { task.title = title; changes.push("renamed"); }
  if (description !== undefined && description !== task.description) { task.description = description; changes.push("updated description"); }
  if (status !== undefined) {
    if (!BOARD_COLUMNS.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${BOARD_COLUMNS.join(", ")}` });
    }
    if (status !== task.status) {
      changes.push(`moved to ${COLUMN_LABELS[status] || status}`);
      task.status = status;
    }
  }
  if (assignee !== undefined && assignee !== task.assignee) {
    changes.push(`assigned to ${assignee || "unassigned"}`);
    task.assignee = assignee;
  }
  if (milestoneId !== undefined && milestoneId !== task.milestoneId) {
    task.milestoneId = milestoneId;
  }
  if (priority !== undefined) {
    if (!PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `priority must be one of ${PRIORITIES.join(", ")}` });
    }
    if (priority !== task.priority) {
      changes.push(`set priority to ${priority}`);
      task.priority = priority;
    }
  }
  if (dueDate !== undefined && dueDate !== task.dueDate) {
    changes.push(dueDate ? `set due date to ${dueDate}` : "cleared due date");
    task.dueDate = dueDate;
  }

  save();
  if (changes.length) {
    recordActivity(req.app.get("io"), {
      actor: req.body?.actor || "Someone",
      text: `${changes.join(", ")} on "${task.title}"`,
      taskId: task.id,
    });
  }
  emitTasks(req.app.get("io"));
  res.json(task);
});

router.delete("/:id", (req, res) => {
  const idx = getDb().tasks.findIndex((t) => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Task not found" });
  const [removed] = getDb().tasks.splice(idx, 1);
  save();
  recordActivity(req.app.get("io"), {
    actor: req.body?.actor || "Someone",
    text: `deleted task "${removed.title}"`,
    taskId: null,
  });
  emitTasks(req.app.get("io"));
  res.json({ success: true });
});

router.get("/:id", (req, res) => {
  const task = getDb().tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

router.post("/:id/comments", (req, res) => {
  const task = getDb().tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const { author = "Someone", text } = req.body || {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }
  const comment = {
    id: nextId("c"),
    author: String(author).trim() || "Someone",
    text: text.trim(),
    createdAt: Date.now(),
  };
  task.comments = task.comments || [];
  task.comments.push(comment);
  save();
  recordActivity(req.app.get("io"), {
    actor: comment.author,
    text: `commented on "${task.title}"`,
    taskId: task.id,
  });
  emitTasks(req.app.get("io"));
  res.status(201).json(comment);
});

router.delete("/:id/comments/:commentId", (req, res) => {
  const task = getDb().tasks.find((t) => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  task.comments = (task.comments || []).filter((c) => c.id !== req.params.commentId);
  save();
  emitTasks(req.app.get("io"));
  res.json({ success: true });
});

export { router, emitTasks };