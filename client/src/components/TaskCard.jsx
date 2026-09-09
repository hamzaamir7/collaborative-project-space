const PRIORITY_CLASS = {
  urgent: "p-urgent",
  high: "p-high",
  medium: "p-medium",
  low: "p-low",
};

function TaskCard({ task, milestones, members, onDragStart, onDragEnd, onEdit, onDelete }) {
  const milestone = task.milestoneId
    ? milestones.find((m) => m.id === task.milestoneId)
    : null;
  const avatarColor = members.length ? colorFor(task.assignee || "?") : "#64748b";
  const initials = (task.assignee || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const commentCount = (task.comments || []).length;
  const overdue = isOverdue(task);

  return (
    <article
      className={`task-card${overdue ? " overdue" : ""}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart(task.id);
      }}
      onDragEnd={onDragEnd}
      onClick={() => onEdit(task)}
    >
      <div className="task-card-top">
        <span className="task-id">{task.id}</span>
        <button
          className="task-delete"
          title="Delete task"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
        >
          ✕
        </button>
      </div>

      <h3 className="task-title">{task.title}</h3>
      {task.description && <p className="task-desc">{task.description}</p>}

      <div className="task-badges">
        {task.priority && (
          <span className={`badge priority ${PRIORITY_CLASS[task.priority] || "p-medium"}`}>
            {label(task.priority)}
          </span>
        )}
        {task.dueDate && (
          <span className={`badge due ${overdue ? "overdue" : ""}`} title="Due date">
            📅 {fmtDate(task.dueDate)}
            {overdue ? " · overdue" : ""}
          </span>
        )}
        {commentCount > 0 && (
          <span className="badge count" title="Comments">
            💬 {commentCount}
          </span>
        )}
      </div>

      <div className="task-meta">
        {milestone && <span className="badge badge-milestone">◆ {milestone.title}</span>}
        <span style={{ flex: 1 }} />
        {task.assignee && (
          <span className="avatar" style={{ background: avatarColor }} title={task.assignee}>
            {initials}
          </span>
        )}
      </div>
    </article>
  );
}

function label(p) {
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function isOverdue(task) {
  if (!task.dueDate || task.status === "done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.dueDate + "T00:00:00");
  return due < today;
}

function colorFor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

export default TaskCard;