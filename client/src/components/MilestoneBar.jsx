function MilestoneBar({ milestones, stats, filter, onFilter, onRemove }) {
  if (!milestones.length) {
    return (
      <div className="milestone-bar empty">
        <p>No milestones yet — create one to track project progress.</p>
      </div>
    );
  }

  return (
    <div className="milestone-bar">
      {milestones.map((m) => {
        const s = stats[m.id] || { total: 0, done: 0, percent: 0 };
        const active = filter === m.id;
        return (
          <div
            key={m.id}
            className={`milestone-chip${active ? " active" : ""}`}
            onClick={() => onFilter(active ? null : m.id)}
            title={m.description || "Milestone"}
          >
            <div className="milestone-chip-info">
              <span className="milestone-title">◆ {m.title}</span>
              <span className="milestone-meta">
                {s.done}/{s.total} tasks
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${s.percent}%` }}
              />
            </div>
            <div className="progress-label">{s.percent}%</div>
            <button
              className="milestone-remove"
              title="Remove milestone"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Remove milestone "${m.title}"? Tasks will be unlinked.`)) {
                  onRemove(m.id);
                }
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
      {filter && (
        <button className="btn btn-clear" onClick={() => onFilter(null)}>
          Clear filter
        </button>
      )}
    </div>
  );
}

export default MilestoneBar;