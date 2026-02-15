const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function WeeklyWorkoutSection({
  workouts,
  todayIndex,
  completed,
  onToggleExercise,
  onEditDay,
}) {
  return (
    <section style={styles.container} id="workout">
      <h3 style={styles.heading}>Workout Plan</h3>

      {WEEKDAYS.map((day, idx) => {
        const workout = workouts[idx];
        const isToday = idx === todayIndex;

        return (
          <div
            key={day}
            id={`workout-day-${idx}`}
            style={{
              ...styles.dayBlock,
              ...(isToday ? styles.today : {}),
            }}
          >
            <div style={styles.dayHeader}>
              <span style={styles.dayName}>
                {day} {isToday && "(Today)"}
              </span>
              <button style={styles.editBtn} onClick={() => onEditDay(idx)}>
                Edit
              </button>
            </div>

            {workout ? (
              <ul style={styles.list}>
                {workout.exercises.map((ex, i) => {
                  const done = isToday && completed[i];

                  return (
                    <li
                      key={i}
                      style={{
                        ...styles.item,
                        ...(done ? styles.done : {}),
                        cursor: isToday ? "pointer" : "default",
                      }}
                      onClick={isToday ? () => onToggleExercise(i) : undefined}
                    >
                      {isToday && <span style={styles.check}>{done ? "✓" : ""}</span>}
                      {ex}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div style={styles.empty}>No workout set</div>
            )}
          </div>
        );
      })}
    </section>
  );
}

const styles = {
  container: {
    padding: "0 16px 12px",
    marginTop: "24px",
  },
  heading: {
    marginBottom: "12px",
    fontSize: "16px",
    fontWeight: 700,
    letterSpacing: "0.35px",
  },
  dayBlock: {
    marginBottom: "14px",
    padding: "13px 12px",
    borderRadius: "14px",
    border: "1px solid var(--border)",
    background: "var(--card)",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
  },
  today: {
    border: "1px solid rgba(56, 255, 150, 0.72)",
    boxShadow: "var(--today-glow)",
  },
  dayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  dayName: {
    fontWeight: 700,
    fontSize: "14px",
  },
  editBtn: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "var(--edit-btn-text)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "4px 8px",
    background: "var(--edit-btn-bg)",
  },
  list: {
    paddingLeft: "0",
    margin: 0,
    listStyle: "none",
    display: "grid",
    gap: "6px",
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "2px",
    fontSize: "14px",
    padding: "7px 8px",
    borderRadius: "9px",
    background: "rgba(120, 220, 160, 0.12)",
  },
  done: {
    opacity: 0.58,
    textDecoration: "line-through",
  },
  check: {
    width: "18px",
    textAlign: "center",
    fontWeight: 700,
    color: "#71ffd5",
  },
  empty: {
    fontSize: "14px",
    color: "var(--text-muted)",
    padding: "8px",
    borderRadius: "8px",
    background: "rgba(120, 220, 160, 0.12)",
  },
};

export default WeeklyWorkoutSection;
