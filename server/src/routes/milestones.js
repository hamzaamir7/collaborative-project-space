import { Router } from "express";
import { getDb, save, nextId } from "../store.js";
import { recordActivity } from "./activity.js";

const router = Router();

function emitMilestones(io) {
  io.emit("milestones:update", getDb().milestones);
}

function completionStats() {
  return getDb().milestones.map((m) => {
    const tasks = getDb().tasks.filter((t) => t.milestoneId === m.id);
    const done = tasks.filter((t) => t.status === "done").length;
    const total = tasks.length;
    return { milestoneId: m.id, total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  });
}

router.get("/", (req, res) => {
  res.json({
    milestones: getDb().milestones,
    stats: completionStats(),
  });
});

router.post("/", (req, res) => {
  const { title, description = "", targetDate = null } = req.body || {};
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "title is required" });
  }
  const milestone = {
    id: nextId("m"),
    title,
    description,
    targetDate,
    createdAt: Date.now(),
  };
  getDb().milestones.push(milestone);
  save();
  recordActivity(req.app.get("io"), {
    actor: req.body?.actor || "Someone",
    text: `created milestone "${milestone.title}"`,
    taskId: null,
  });
  emitMilestones(req.app.get("io"));
  res.status(201).json(milestone);
});

router.patch("/:id", (req, res) => {
  const milestone = getDb().milestones.find((m) => m.id === req.params.id);
  if (!milestone) return res.status(404).json({ error: "Milestone not found" });
  const { title, description, targetDate } = req.body || {};
  if (title !== undefined) milestone.title = title;
  if (description !== undefined) milestone.description = description;
  if (targetDate !== undefined) milestone.targetDate = targetDate;
  save();
  emitMilestones(req.app.get("io"));
  res.json(milestone);
});

router.delete("/:id", (req, res) => {
  const idx = getDb().milestones.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Milestone not found" });
  const [removed] = getDb().milestones.splice(idx, 1);
  getDb().tasks.forEach((t) => {
    if (t.milestoneId === removed.id) t.milestoneId = null;
  });
  save();
  recordActivity(req.app.get("io"), {
    actor: req.body?.actor || "Someone",
    text: `deleted milestone "${removed.title}"`,
    taskId: null,
  });
  emitMilestones(req.app.get("io"));
  emitTasksFromMilestone(req.app.get("io"));
  res.json({ success: true });
});

function emitTasksFromMilestone(io) {
  io.emit("tasks:update", getDb().tasks);
}

router.get("/:id", (req, res) => {
  const milestone = getDb().milestones.find((m) => m.id === req.params.id);
  if (!milestone) return res.status(404).json({ error: "Milestone not found" });
  res.json(milestone);
});

export { router, emitMilestones, completionStats };
