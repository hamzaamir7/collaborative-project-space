import { Router } from "express";
import { getDb, save, nextId } from "../store.js";

const router = Router();

const ACTIVITY_CAP = 300;

export function recordActivity(io, { actor, text, taskId = null }) {
  const entry = {
    id: nextId("a"),
    actor: (actor || "Someone").trim() || "Someone",
    text,
    taskId,
    createdAt: Date.now(),
  };
  getDb().activityLog = getDb().activityLog ?? [];
  getDb().activityLog.push(entry);
  if (getDb().activityLog.length > ACTIVITY_CAP) {
    getDb().activityLog = getDb().activityLog.slice(-ACTIVITY_CAP);
  }
  save();
  io?.emit("activity:add", entry);
}

router.get("/", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, ACTIVITY_CAP);
  const log = [...(getDb().activityLog || [])].reverse().slice(0, limit);
  res.json(log);
});

export { router };