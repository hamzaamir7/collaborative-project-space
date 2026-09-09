import TaskCard from "./TaskCard.jsx";

function Column({ column, tasks, milestones, members, dragging, onDragStart, onDragEnd, onDrop, onEdit, onDelete }) {
  const accent = column.accent;

  return (
    <section
      className={`column column-${accent} ${dragging ? "drag-active" : ""}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <header className="column-header">
        <span className={`column-dot dot-${accent}`} />
        <h2>{column.label}</h2>
        <span className="column-count">{tasks.length}</span>
      </header>

      <div className="column-body">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            milestones={milestones}
            members={members}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {tasks.length === 0 && <div className="column-empty">Drop tasks here</div>}
      </div>
    </section>
  );
}

export default Column;