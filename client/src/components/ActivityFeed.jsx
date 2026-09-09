import { useState } from "react";

function ActivityFeed({ activity, tasks }) {
  const [open, setOpen] = useState(true);

  if (!activity.length) {
    return (
      <aside className="activity-feed empty">
        <p>No activity yet.</p>
      </aside>
    );
  }

  return (
    <aside className="activity-feed">
      <button className="activity-toggle" onClick={() => setOpen((v) => !v)}>
        <span>Live Activity</span>
        <span className="chevron">{open ? "▾" : "▸"}</span>
      </button>

      {open && (
        <ul className="activity-list">
          {activity.slice(0, 50).map((a) => {
            const task = tasks.find((t) => t.id === a.taskId);
            return (
              <li key={a.id} className="activity-item">
                <span className="activity-dot" style={{ background: a.actor === "system" ? "#64748b" : colorFor(a.actor) }} />
                <div className="activity-content">
                  <p className="activity-text">
                    <strong>{a.actor}</strong> {a.text}
                    {task && <span className="activity-task">{task.title}</span>}
                  </p>
                  <span className="activity-time">{timeAgo(a.createdAt)}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

function timeAgo(ts) {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

export default ActivityFeed;