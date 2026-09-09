import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, "..", "data", "db.json");

export const BOARD_COLUMNS = ["todo", "in-progress", "review", "done"];

export const COLUMN_LABELS = {
  todo: "To Do",
  "in-progress": "In Progress",
  review: "Review",
  done: "Done",
};

export const PRIORITIES = ["low", "medium", "high", "urgent"];

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const now = Date.now();

const seed = {
  tasks: [
    {
      id: "t1",
      title: "Set up project board",
      description: "Create the initial Kanban board structure with columns.",
      status: "done",
      assignee: "Alice",
      milestoneId: "m1",
      priority: "high",
      dueDate: null,
      comments: [
        {
          id: "c1",
          author: "Bob",
          text: "Board looks great — columns are set up!",
          createdAt: now - 3600_000,
        },
      ],
      createdAt: now,
    },
    {
      id: "t2",
      title: "Design API contract",
      description: "Draft REST endpoints for task sharing and collaboration.",
      status: "in-progress",
      assignee: "Bob",
      milestoneId: "m1",
      priority: "urgent",
      dueDate: new Date(Date.now() + 2 * 86400_000).toISOString().slice(0, 10),
      comments: [],
      createdAt: now - 1000,
    },
    {
      id: "t3",
      title: "Implement Socket.IO sync",
      description: "Broadcast live task updates to all connected clients.",
      status: "todo",
      assignee: "Alice",
      milestoneId: "m2",
      priority: "medium",
      dueDate: null,
      comments: [],
      createdAt: now - 2000,
    },
    {
      id: "t4",
      title: "Write onboarding docs",
      description: "Document how interns join and collaborate on the project.",
      status: "review",
      assignee: "Carol",
      milestoneId: "m2",
      priority: "low",
      dueDate: new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10),
      comments: [],
      createdAt: now - 3000,
    },
  ],
  milestones: [
    {
      id: "m1",
      title: "Foundation",
      description: "Core scaffolding and API design.",
      targetDate: null,
      createdAt: now,
    },
    {
      id: "m2",
      title: "Real-Time Collaboration",
      description: "Live sync and collaboration features.",
      targetDate: null,
      createdAt: now - 1000,
    },
  ],
  members: ["Alice", "Bob", "Carol", "Dave", "Eve"],
  activityLog: [
    {
      id: "a_seed1",
      actor: "system",
      text: "Board initialized with 4 tasks and 2 milestones.",
      taskId: null,
      createdAt: now - 5000,
    },
  ],
};

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function migrate(raw) {
  const db = raw;
  db.activityLog = db.activityLog ?? [];
  db.members = Array.isArray(db.members) ? db.members : [];
  db.tasks = (db.tasks ?? []).map((t) => ({
    priority: "medium",
    dueDate: null,
    comments: [],
    ...t,
  }));
  return db;
}

function load() {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      if (raw.trim()) return migrate(JSON.parse(raw));
    }
  } catch (err) {
    console.error("Failed to load data, using seed:", err.message);
  }
  return seed;
}

const db = load();

export function save() {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (err) {
    console.error("Failed to save data:", err.message);
  }
}

export function getDb() {
  return db;
}

export function nextId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function stamp() {
  return Date.now();
}