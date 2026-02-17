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
            {isToday && (
              <>
                <span aria-hidden="true" style={styles.todaySweep} />
                <span aria-hidden="true" style={styles.todayCornerMark} />
              </>
            )}
            <div style={styles.dayHeader}>
              <div style={styles.dayHeaderText}>
                <span style={styles.dayName}>
                  {day}
                  {isToday && <span aria-hidden="true" style={styles.todayDot} />}
                </span>
                {!!workout?.title?.trim() && (
                  <span style={styles.daySubheading}>{workout.title.trim()}</span>
                )}
              </div>
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
    fontSize: "18px",
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
    position: "relative",
    overflow: "hidden",
  },
  today: {
    border: "1px solid rgba(56, 255, 150, 0.72)",
    boxShadow: "var(--today-glow)",
  },
  dayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "8px",
  },
  dayHeaderText: {
    display: "grid",
    gap: "2px",
  },
  dayName: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 700,
    fontSize: "14px",
  },
  todayDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#7effbf",
    boxShadow: "0 0 0 3px rgba(126, 255, 191, 0.14), 0 0 10px rgba(126, 255, 191, 0.52)",
    animation: "pulseDot 2.8s ease-in-out infinite",
  },
  todaySweep: {
    position: "absolute",
    top: "-18%",
    left: 0,
    width: "52%",
    height: "140%",
    background:
      "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.34), transparent)",
    transform: "translateX(-220%) skewX(-20deg)",
    mixBlendMode: "screen",
    opacity: 0.65,
    animation: "shineSweep 14s cubic-bezier(0.3, 0, 0.2, 1) infinite",
    pointerEvents: "none",
    zIndex: 0,
  },
  todayCornerMark: {
    position: "absolute",
    top: "0",
    right: "0",
    width: "58px",
    height: "58px",
    background:
      "radial-gradient(circle at 100% 0%, rgba(126, 255, 191, 0.42), rgba(126, 255, 191, 0.03) 68%, transparent 76%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  daySubheading: {
    fontSize: "12px",
    lineHeight: 1.2,
    color: "var(--text-muted)",
    letterSpacing: "0.55px",
    fontWeight: 600,
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
