import { useState } from "react";

function WorkoutEditor({ initialWorkout, onSave, onClose }) {
  const [title, setTitle] = useState(initialWorkout?.title || "");
  const [exercises, setExercises] = useState(
    initialWorkout?.exercises.join("\n") || ""
  );

  function handleSave() {
    onSave({
      title,
      exercises: exercises
        .split("\n")
        .map((e) => e.trim())
        .filter(Boolean),
    });
    onClose();
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <input
          style={styles.input}
          placeholder="Workout name"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          style={styles.textarea}
          placeholder="One exercise per line"
          value={exercises}
          onChange={(e) => setExercises(e.target.value)}
        />
        <button style={styles.save} onClick={handleSave}>
          Save
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "flex-end",
    zIndex: 200,
  },
  sheet: {
    width: "100%",
    background: "#0f0f0f",
    padding: "16px",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
  },
  input: { width: "100%", marginBottom: "8px", padding: "8px" },
  textarea: { width: "100%", height: "120px", padding: "8px" },
  save: {
    marginTop: "12px",
    width: "100%",
    padding: "12px",
    fontWeight: 600,
    background: "#fff",
    color: "#000",
    borderRadius: "8px",
  },
};

export default WorkoutEditor;
