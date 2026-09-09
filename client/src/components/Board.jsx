import { useState } from "react";
import Column from "./Column.jsx";

function Board({ columns, tasks, milestones, members, onMove, onEdit, onDelete, emit }) {
  const [dragging, setDragging] = useState(null);

  const handleDrop = (status) => {
    if (dragging) {
      onMove(dragging, status);
      emit("task:move", { id: dragging, status });
    }
    setDragging(null);
  };

  return (
    <main className="board">
      {columns.map((col) => (
        <Column
          key={col.id}
          column={col}
          tasks={tasks.filter((t) => t.status === col.id)}
          milestones={milestones}
          members={members}
          dragging={dragging}
          onDragStart={(id) => setDragging(id)}
          onDragEnd={() => setDragging(null)}
          onDrop={() => handleDrop(col.id)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </main>
  );
}

export default Board;