import { useEffect, useRef, useState } from "react";

function NameModal({ current, onClose, onSave }) {
  const [name, setName] = useState(current || "");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const isFirstRun = !current;

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Please enter a name");
    setError("");
    onSave(name);
  };

  return (
    <div className="overlay" onClick={() => !isFirstRun && onClose()}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isFirstRun ? "Welcome to CollabBoard 👋" : "Your name"}</h2>
          {!isFirstRun && (
            <button className="modal-close" onClick={onClose}>✕</button>
          )}
        </div>
        <p className="modal-sub">
          {isFirstRun
            ? "Enter your name so your teammates see who's collaborating and editing tasks."
            : "Other collaborators will see this instantly."}
        </p>
        <form onSubmit={submit}>
          <label>
            Name
            <input
              ref={inputRef}
              value={name}
              maxLength={24}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-actions">
            <button type="submit" className="btn btn-primary">
              {isFirstRun ? "Join board" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NameModal;