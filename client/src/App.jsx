import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api.js";
import useSocket from "./useSocket.js";
import Board from "./components/Board.jsx";
import MilestoneBar from "./components/MilestoneBar.jsx";
import TaskModal from "./components/TaskModal.jsx";
import MilestoneModal from "./components/MilestoneModal.jsx";
import NameModal from "./components/NameModal.jsx";
import ActivityFeed from "./components/ActivityFeed.jsx";

const COLUMNS = [
  { id: "todo", label: "To Do", accent: "gray" },
  { id: "in-progress", label: "In Progress", accent: "blue" },
  { id: "review", label: "Review", accent: "amber" },
  { id: "done", label: "Done", accent: "green" },
];

const PRIORITIES = ["urgent", "high", "medium", "low"];

function App() {
  const [user, setUser] = useState(() => localStorage.getItem("collabboard-name") || "");
  const [mounted, setMounted] = useState(false);

  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [stats, setStats] = useState({});
  const [members, setMembers] = useState(["Alice", "Bob", "Carol", "Dave", "Eve"]);
  const [connected, setConnected] = useState(false);
  const [onlineNames, setOnlineNames] = useState([]);
  const [activity, setActivity] = useState([]);
  const [typingMap, setTypingMap] = useState({});

  const [taskModal, setTaskModal] = useState(null);
  const [milestoneModal, setMilestoneModal] = useState(false);
  const [milestoneFilter, setMilestoneFilter] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showActivity, setShowActivity] = useState(true);
  const [toast, setToast] = useState(null);

  const toastTimer = useRef(null);
  const showToast = useCallback((msg) => {
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
    setToast(msg);
  }, []);

  const handleSnapshot = useCallback(({ tasks, milestones }) => {
    setTasks(tasks);
    setMilestones(milestones);
  }, []);
  const handleTasks = useCallback((tasks) => setTasks(tasks), []);
  const handleMilestones = useCallback((ms) => setMilestones(ms), []);
  const handlePresence = useCallback((p) => {
    if (typeof p === "number") setOnlineNames([]);
    else setOnlineNames(p.names || []);
  }, []);
  const handleActivity = useCallback((entry) => {
    setActivity((prev) => [entry, ...prev]);
  }, []);
  const handleTyping = useCallback(({ name, taskId, typing }) => {
    if (!name || !taskId) return;
    setTypingMap((prev) => {
      const names = new Set(prev[taskId] || []);
      if (typing) names.add(name);
      else names.delete(name);
      const next = { ...prev, [taskId]: [...names] };
      if (!names.size) delete next[taskId];
      return next;
    });
    if (typing) {
      setTimeout(() => handleTyping({ name, taskId, typing: false }), 3500);
    }
  }, []);

  const { connected: socketConnected, emit } = useSocket({
    onSnapshot: handleSnapshot,
    onTasks: handleTasks,
    onMilestones: handleMilestones,
    onPresence: handlePresence,
    onActivity: handleActivity,
    onTyping: handleTyping,
  });

  useEffect(() => setConnected(socketConnected), [socketConnected]);

  useEffect(() => {
    api.getMilestones().then((data) => {
      setMilestones(data.milestones);
      setStats(Object.fromEntries(data.stats.map((s) => [s.milestoneId, s])));
    }).catch(() => {});
    api.getTasks().then(setTasks).catch(() => {});
    api.getActivity(60).then((log) => setActivity(log)).catch(() => {});
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    emit("presence:join", { name: user });
  }, [mounted, user, emit]);

  useEffect(() => {
    if (!tasks.length) return;
    const st = {};
    milestones.forEach((m) => {
      const mt = tasks.filter((t) => t.milestoneId === m.id);
      const done = mt.filter((t) => t.status === "done").length;
      st[m.id] = { total: mt.length, done, percent: mt.length ? Math.round((done / mt.length) * 100) : 0 };
    });
    setStats(st);
  }, [tasks, milestones]);

  const saveUser = (name) => {
    const clean = name.trim() || "Guest";
    setUser(clean);
    localStorage.setItem("collabboard-name", clean);
    setMembers((prev) => (prev.includes(clean) ? prev : [...prev, clean]));
  };

  const createTask = async (data) => {
    try {
      const task = await api.addTask(data);
      setTasks((prev) => (prev.some((t) => t.id === task.id) ? prev : [...prev, task]));
      setTaskModal(null);
      showToast("Task created");
    } catch (err) {
      showToast(err.message);
    }
  };

  const updateTask = async (id, data) => {
    const prev = tasks;
    setTasks((cur) => cur.map((t) => (t.id === id ? { ...t, ...data } : t)));
    try {
      const updated = await api.updateTask(id, { ...data, actor: user });
      setTasks((cur) => cur.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      setTasks(prev);
      showToast(err.message);
    }
  };

  const moveTask = useCallback(
    (id, status) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
      emit("task:move", { id, status, actor: user });
    },
    [emit, user]
  );

  const deleteTask = async (id) => {
    try {
      await api.deleteTask(id, { actor: user });
      setTasks((prev) => prev.filter((t) => t.id !== id));
      showToast("Task deleted");
    } catch (err) {
      showToast(err.message);
    }
  };

  const addComment = async (taskId, text) => {
    try {
      const comment = await api.addComment(taskId, { author: user, text });
      setTasks((prev) => {
        const idx = prev.findIndex((t) => t.id === taskId);
        if (idx === -1) return prev;
        if ((prev[idx].comments || []).some((c) => c.id === comment.id)) return prev;
        const next = [...prev];
        next[idx] = { ...prev[idx], comments: [...(prev[idx].comments || []), comment] };
        return next;
      });
      showToast("Comment added");
    } catch (err) {
      showToast(err.message);
    }
  };

  const createMilestone = async (data) => {
    try {
      const m = await api.addMilestone({ ...data, actor: user });
      setMilestones((prev) => [...prev, m]);
      setMilestoneModal(false);
      showToast("Milestone created");
    } catch (err) {
      showToast(err.message);
    }
  };

  const removeMilestone = async (id) => {
    try {
      await api.deleteMilestone(id, { actor: user });
      setMilestones((prev) => prev.filter((m) => m.id !== id));
      if (milestoneFilter === id) setMilestoneFilter(null);
      showToast("Milestone removed");
    } catch (err) {
      showToast(err.message);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (milestoneFilter && t.milestoneId !== milestoneFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !(t.description || "").toLowerCase().includes(q) &&
          !t.assignee?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [tasks, milestoneFilter, priorityFilter, search]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="logo">◈</span>
          <div>
            <h1>CollabBoard</h1>
            <p>Real-time project collaboration for interns</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="presence-stack" title="Who's online">
            <span className={`status-pill ${connected ? "online" : "offline"}`}>
              <span className="dot" /> {connected ? `${onlineNames.length} online` : "offline"}
            </span>
            <div className="online-avatars">
              {onlineNames.slice(0, 5).map((n) => (
                <span key={n} className="avatar avatar-named" style={{ background: colorFor(n) }} title={n}>
                  {initialsOf(n)}
                </span>
              ))}
            </div>
          </div>
          <button className="btn btn-ghost" onClick={() => setTaskModal({ mode: "name" })}>
            {user || "Set name"}
          </button>
          <button
            className={`btn ${showActivity ? "btn-outline active" : "btn-outline"}`}
            onClick={() => setShowActivity((v) => !v)}
          >
            Activity
          </button>
          <button className="btn btn-primary" onClick={() => setTaskModal({ mode: "create" })}>
            + New Task
          </button>
          <button className="btn btn-outline" onClick={() => setMilestoneModal(true)}>
            + Milestone
          </button>
        </div>
      </header>

      <MilestoneBar
        milestones={milestones}
        stats={stats}
        filter={milestoneFilter}
        onFilter={setMilestoneFilter}
        onRemove={removeMilestone}
      />

      <div className="board-toolbar">
        <input
          className="search-input"
          type="search"
          placeholder="Search tasks, descriptions, assignees…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="toolbar-right">
          <select
            className="priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            title="Filter by priority"
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {pLabel(p)}
              </option>
            ))}
          </select>
          <span className="task-count">
            {filteredTasks.length} task{filteredTasks.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className={`main-layout${showActivity ? "" : " wide"}`}>
        <Board
          columns={COLUMNS}
          tasks={filteredTasks}
          milestones={milestones}
          members={members}
          onMove={moveTask}
          onEdit={(task) => setTaskModal({ mode: "edit", task })}
          onDelete={deleteTask}
          emit={emit}
        />
        {showActivity && (
          <ActivityFeed activity={activity} tasks={tasks} />
        )}
      </div>

      {taskModal?.mode === "create" && (
        <TaskModal
          mode="create"
          user={user}
          members={members}
          milestones={milestones}
          onClose={() => setTaskModal(null)}
          onCreate={createTask}
        />
      )}
      {taskModal?.mode === "edit" && (
        <TaskModal
          mode="edit"
          task={taskModal.task}
          user={user}
          members={members}
          milestones={milestones}
          typing={typingMap[taskModal.task.id] || []}
          onClose={() => setTaskModal(null)}
          onUpdate={updateTask}
          onAddComment={addComment}
          emitTyping={emit}
        />
      )}
      {taskModal?.mode === "name" && (
        <NameModal
          current={user}
          onClose={() => setTaskModal(null)}
          onSave={saveUser}
        />
      )}

      {milestoneModal && (
        <MilestoneModal
          onClose={() => setMilestoneModal(false)}
          onSave={createMilestone}
        />
      )}

      {!user && <NameModal current="" onSave={saveUser} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function pLabel(p) {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

function initialsOf(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default App;