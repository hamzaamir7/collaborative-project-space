import { useEffect, useRef, useState } from "react";
import { fmtDate } from "./TaskCard.jsx";

const STATUS_OPTIONS = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { id: "urgent", label: "🔴 Urgent" },
  { id: "high", label: "🟠 High" },
  { id: "medium", label: "🟡 Medium" },
  { id: "low", label: "⚪ Low" },
];

function TaskModal({ mode, task, user, members, milestones, typing = [], onClose, onCreate, onUpdate, onAddComment, emitTyping }) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState(task?.status ?? "todo");
  const [assignee, setAssignee] = useState(task?.assignee ?? "");
  const [milestoneId, setMilestoneId] = useState(task?.milestoneId ?? "");
  const [priority, setPriority] = useState(task?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [error, setError] = useState("");
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState("details");

  const isEdit = mode === "edit";
  const taskId = task?.id;
  const typingRef = useRef(null);

  useEffect(() => {
    if (!isEdit || !user) return;
    const clear = () => emitTyping?.("typing:stop", { name: user, taskId });
    typingRef.current = clear;
    return clear;
  }, [isEdit, user, taskId, emitTyping]);

  const onCommentInput = (e) => {
    setCommentText(e.target.value);
    emitTyping?.("typing:start", { name: user, taskId });
  };

  const stopTyping = () => {
    emitTyping?.("typing:stop", { name: user, taskId });
    setCommentText("");
  };

  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required");
    setError("");
    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      assignee,
      milestoneId: milestoneId || null,
      priority,
      dueDate: dueDate || null,
    };
    if (isEdit) {
      onUpdate(taskId, payload);
    } else {
      onCreate(payload);
    }
  };

  const submitComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(taskId, commentText.trim());
    stopTyping();
  };

  const comments = task?.comments || [];

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? "Edit Task" : "Create Task"}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit}>
          <label>
            Title *
            <input
              autoFocus={!isEdit}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design the API contract"
            />
          </label>

          <label>
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details…"
              rows={3}
            />
          </label>

          <div className="form-row form-row-3">
            <label>
              Status
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </label>

            <label>
              Priority
              <select value={priority} onChange={(e) => setPriority(e.target.value)}>
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </label>

            <label>
              Due date
              <input
                type="date"
                value={dueDate || ""}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <label>
              Assignee
              <select value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </label>

            <label>
              Milestone
              <select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)}>
                <option value="">— None —</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>

        {isEdit && (
          <div className="comments-section">
            <div className="tabs">
              <button
                className={`tab-btn${activeTab === "details" ? " active" : ""}`}
                onClick={() => setActiveTab("details")}
              >
                Details
              </button>
              <button
                className={`tab-btn${activeTab === "comments" ? " active" : ""}`}
                onClick={() => setActiveTab("comments")}
              >
                Comments {comments.length > 0 && `(${comments.length})`}
              </button>
            </div>

            {activeTab === "details" ? (
              <div className="task-details">
                <p>
                  <strong>Assignee:</strong> {task.assignee || "—"}
                </p>
                <p>
                  <strong>Milestone:</strong>{" "}
                  {milestones.find((m) => m.id === task.milestoneId)?.title || "—"}
                </p>
                <p>
                  <strong>Priority:</strong> {task.priority}
                </p>
                <p>
                  <strong>Due:</strong> {task.dueDate ? fmtDate(task.dueDate) : "—"}
                </p>
              </div>
            ) : (
              <>
                <div className="comment-list">
                  {comments.length === 0 && (
                    <p className="comment-empty">No comments yet. Start the discussion!</p>
                  )}
                  {comments.map((c) => (
                    <div key={c.id} className="comment">
                      <span className="avatar avatar-named" style={{ background: colorFor(c.author) }}>
                        {c.author.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="comment-body">
                        <div className="comment-head">
                          <span className="comment-author">{c.author}</span>
                          <span className="comment-time">{timeAgo(c.createdAt)}</span>
                        </div>
                        <p className="comment-text">{c.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form className="comment-form" onSubmit={submitComment}>
                  <input
                    value={commentText}
                    onChange={onCommentInput}
                    onBlur={() => emitTyping?.("typing:stop", { name: user, taskId })}
                    placeholder="Write a comment… (Enter to post)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submitComment(e);
                      }
                    }}
                    autoFocus={activeTab === "comments"}
                  />
                  <button type="submit" className="btn btn-primary btn-sm" disabled={!commentText.trim()}>
                    Post
                  </button>
                </form>

                {typing.length > 0 && (
                  <div className="typing-indicator">
                    {typing.map((n) => `${n} `)}
                    {typing.length === 1 ? "is" : "are"} typing…
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
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

export default TaskModal;