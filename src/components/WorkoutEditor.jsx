import { useState } from "react";

const DETAIL_MODE = {
  setsReps: "sets_reps",
  time: "time",
};

function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function range(start, end, step = 1) {
  const values = [];
  for (let value = start; value <= end; value += step) {
    values.push(value);
  }
  return values;
}

const SET_OPTIONS = range(1, 12);
const REP_OPTIONS = range(1, 50);
const TIME_OPTIONS = range(5, 180, 5);

function parseExercise(rawText) {
  const text = String(rawText || "").trim();
  if (!text) {
    return {
      id: createId(),
      name: "",
      mode: DETAIL_MODE.setsReps,
      sets: 3,
      reps: 10,
      time: 30,
    };
  }

  const setsRepsMatch = text.match(
    /^(.*?)\s*[-\u2013\u2014]\s*\(?\s*(\d+)\s*[xX]\s*(\d+)\s*\)?$/
  );
  if (setsRepsMatch) {
    const [, name, sets, reps] = setsRepsMatch;
    return {
      id: createId(),
      name: name.trim(),
      mode: DETAIL_MODE.setsReps,
      sets: Number(sets) || 3,
      reps: Number(reps) || 10,
      time: 30,
    };
  }

  const timeMatch = text.match(
    /^(.*?)\s*[-\u2013\u2014]\s*\(?\s*(\d+)\s*(?:s|sec|secs|second|seconds|min|mins|minute|minutes)\s*\)?$/i
  );
  if (timeMatch) {
    const [, name, time] = timeMatch;
    return {
      id: createId(),
      name: name.trim(),
      mode: DETAIL_MODE.time,
      sets: 3,
      reps: 10,
      time: Number(time) || 30,
    };
  }

  return {
    id: createId(),
    name: text,
    mode: DETAIL_MODE.setsReps,
    sets: 3,
    reps: 10,
    time: 30,
  };
}

function formatExercise(exercise) {
  const name = exercise.name.trim();
  if (!name) {
    return null;
  }

  if (exercise.mode === DETAIL_MODE.time) {
    return `${name} - ${exercise.time} min`;
  }

  return `${name} - ${exercise.sets} x ${exercise.reps}`;
}

function createBlankExercise() {
  return {
    id: createId(),
    name: "",
    mode: DETAIL_MODE.setsReps,
    sets: 3,
    reps: 10,
    time: 30,
  };
}

function WorkoutEditor({ initialWorkout, onSave, onClose }) {
  const [title, setTitle] = useState(initialWorkout?.title || "");
  const [rows, setRows] = useState(() => {
    const source = Array.isArray(initialWorkout?.exercises)
      ? initialWorkout.exercises
      : [];
    const parsed = source.map(parseExercise).filter(Boolean);
    return parsed.length > 0 ? parsed : [createBlankExercise()];
  });

  function updateRow(rowId, updates) {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, ...updates } : row))
    );
  }

  function addRow() {
    setRows((prev) => [...prev, createBlankExercise()]);
  }

  function removeRow(rowId) {
    setRows((prev) => {
      const next = prev.filter((row) => row.id !== rowId);
      return next.length > 0 ? next : [createBlankExercise()];
    });
  }

  function handleSave() {
    const exercises = rows.map(formatExercise).filter(Boolean);
    onSave({
      title: title.trim(),
      exercises,
    });
    onClose();
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h4 style={styles.heading}>Edit workout plan</h4>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close editor">
            Close
          </button>
        </div>

        <input
          style={styles.titleInput}
          placeholder="Subheading (Push / Pull / Legs)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Workout day subheading"
        />

        <div style={styles.rows}>
          {rows.map((row, index) => (
            <article key={row.id} style={styles.rowCard}>
              <div style={styles.rowTop}>
                <span style={styles.rowNumber}>{index + 1}</span>
                <input
                  style={styles.input}
                  placeholder="Exercise name"
                  value={row.name}
                  onChange={(e) => updateRow(row.id, { name: e.target.value })}
                />
                <button
                  style={styles.removeBtn}
                  onClick={() => removeRow(row.id)}
                  aria-label={`Remove exercise ${index + 1}`}
                >
                  Remove
                </button>
              </div>

              <div
                style={
                  row.mode === DETAIL_MODE.time
                    ? styles.rowBottomTime
                    : styles.rowBottomSetsReps
                }
              >
                <select
                  style={styles.select}
                  value={row.mode}
                  onChange={(e) => updateRow(row.id, { mode: e.target.value })}
                  aria-label={`Exercise ${index + 1} detail mode`}
                >
                  <option value={DETAIL_MODE.setsReps}>Sets x Reps</option>
                  <option value={DETAIL_MODE.time}>Time</option>
                </select>

                {row.mode === DETAIL_MODE.setsReps ? (
                  <>
                    <select
                      style={styles.numberSelect}
                      value={row.sets}
                      onChange={(e) => updateRow(row.id, { sets: Number(e.target.value) })}
                      aria-label={`Exercise ${index + 1} sets`}
                    >
                      {SET_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {value} sets
                        </option>
                      ))}
                    </select>

                    <select
                      style={styles.numberSelect}
                      value={row.reps}
                      onChange={(e) => updateRow(row.id, { reps: Number(e.target.value) })}
                      aria-label={`Exercise ${index + 1} reps`}
                    >
                      {REP_OPTIONS.map((value) => (
                        <option key={value} value={value}>
                          {value} reps
                        </option>
                      ))}
                    </select>
                  </>
                ) : (
                  <select
                    style={styles.numberSelect}
                    value={row.time}
                    onChange={(e) => updateRow(row.id, { time: Number(e.target.value) })}
                    aria-label={`Exercise ${index + 1} time in minutes`}
                  >
                    {TIME_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value} min
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </article>
          ))}
        </div>

        <button style={styles.addBtn} onClick={addRow}>
          Add exercise
        </button>
        <button
          style={styles.saveBtn}
          onClick={handleSave}
        >
          Save workout
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.62)",
    display: "flex",
    alignItems: "flex-end",
    zIndex: 200,
  },
  sheet: {
    width: "100%",
    maxHeight: "88vh",
    overflowY: "auto",
    background:
      "linear-gradient(180deg, rgba(7, 24, 15, 0.98) 0%, rgba(6, 18, 12, 0.98) 100%)",
    borderTopLeftRadius: "18px",
    borderTopRightRadius: "18px",
    border: "1px solid rgba(120, 220, 160, 0.35)",
    padding: "14px 14px 18px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  heading: {
    margin: 0,
    fontSize: "17px",
    fontWeight: 800,
    letterSpacing: "0.2px",
  },
  closeBtn: {
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-muted)",
    fontSize: "11px",
    fontWeight: 700,
    textTransform: "uppercase",
    padding: "5px 8px",
  },
  rows: {
    display: "grid",
    gap: "8px",
    marginBottom: "10px",
  },
  titleInput: {
    width: "100%",
    borderRadius: "9px",
    border: "1px solid rgba(255, 227, 148, 0.6)",
    background: "rgba(4, 16, 11, 0.72)",
    color: "var(--text)",
    padding: "8px 10px",
    fontSize: "13px",
    minHeight: "36px",
    outline: "none",
    marginBottom: "10px",
  },
  rowCard: {
    borderRadius: "10px",
    border: "1px solid rgba(255, 235, 160, 0.36)",
    background:
      "linear-gradient(150deg, rgba(181, 132, 35, 0.4), rgba(26, 31, 11, 0.9))",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.24)",
    padding: "10px",
    display: "grid",
    gap: "8px",
  },
  rowTop: {
    display: "grid",
    gridTemplateColumns: "30px minmax(0, 1fr) auto",
    gap: "8px",
    alignItems: "center",
  },
  rowNumber: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 800,
    border: "1px solid rgba(255, 224, 132, 0.75)",
    background: "rgba(255, 221, 126, 0.25)",
    color: "#fff4cc",
  },
  input: {
    width: "100%",
    borderRadius: "9px",
    border: "1px solid rgba(255, 227, 148, 0.6)",
    background: "rgba(4, 16, 11, 0.78)",
    color: "var(--text)",
    padding: "8px 10px",
    fontSize: "13px",
    minHeight: "36px",
    outline: "none",
  },
  removeBtn: {
    borderRadius: "8px",
    border: "1px solid rgba(255, 227, 148, 0.6)",
    background: "rgba(4, 16, 11, 0.65)",
    color: "var(--text-muted)",
    fontSize: "11px",
    fontWeight: 700,
    padding: "7px 8px",
    cursor: "pointer",
  },
  rowBottomSetsReps: {
    display: "grid",
    gridTemplateColumns: "minmax(115px, 1fr) repeat(2, minmax(0, 1fr))",
    gap: "8px",
  },
  rowBottomTime: {
    display: "grid",
    gridTemplateColumns: "minmax(115px, 1fr) minmax(0, 1fr)",
    gap: "8px",
  },
  select: {
    width: "100%",
    borderRadius: "9px",
    border: "1px solid rgba(255, 227, 148, 0.6)",
    background: "rgba(4, 16, 11, 0.72)",
    color: "var(--text)",
    padding: "8px 10px",
    fontSize: "12px",
    minHeight: "36px",
    fontWeight: 700,
  },
  numberSelect: {
    width: "100%",
    borderRadius: "9px",
    border: "1px solid rgba(255, 227, 148, 0.6)",
    background: "rgba(4, 16, 11, 0.72)",
    color: "var(--text)",
    padding: "8px 10px",
    fontSize: "12px",
    minHeight: "36px",
    fontWeight: 700,
  },
  addBtn: {
    width: "100%",
    borderRadius: "9px",
    border: "1px solid rgba(255, 227, 148, 0.6)",
    background: "rgba(255, 223, 130, 0.2)",
    color: "#ffe8aa",
    padding: "9px 10px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    marginBottom: "8px",
  },
  saveBtn: {
    width: "100%",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "rgba(120, 220, 160, 0.16)",
    color: "var(--text)",
    padding: "11px 10px",
    fontSize: "14px",
    fontWeight: 800,
  },
};

export default WorkoutEditor;
