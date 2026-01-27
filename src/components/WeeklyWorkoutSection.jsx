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
            style={{
              ...styles.dayBlock,
              ...(isToday ? styles.today : {}),
            }}
          >
            <div style={styles.dayHeader}>
              <span style={styles.dayName}>
                {day} {isToday && "(Today)"}
              </span>
              <button
                style={styles.editBtn}
                onClick={() => onEditDay(idx)}
              >
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
                        opacity: done ? 0.5 : 1,
                        cursor: isToday ? "pointer" : "default",
                      }}
                      onClick={
                        isToday
                          ? () => onToggleExercise(i)
                          : undefined
                      }
                    >
                      {isToday && (
                        <span style={styles.check}>
                          {done ? "✓" : " "}
                        </span>
                      )}
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
    padding: "0 16px 32px",
    marginTop: "32px",
  },
  heading: {
    marginBottom: "12px",
    fontSize: "16px",
    fontWeight: 600,
  },
  dayBlock: {
    marginBottom: "16px",
    padding: "12px",
    borderRadius: "12px",
    background: "rgba(255,255,255,0.03)",
  },
  today: {
    background: "rgba(255,255,255,0.08)",
  },
  dayHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "6px",
  },
  dayName: {
    fontWeight: 600,
    fontSize: "14px",
  },
  editBtn: {
    fontSize: "13px",
    opacity: 0.7,
    textDecoration: "underline",
  },
  list: {
    paddingLeft: "18px",
    margin: 0,
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "4px",
  },
  check: {
    width: "16px",
    textAlign: "center",
    fontWeight: 700,
  },
  empty: {
    fontSize: "14px",
    opacity: 0.6,
  },
};

export default WeeklyWorkoutSection;
