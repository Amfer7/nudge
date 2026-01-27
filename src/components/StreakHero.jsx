import { useEffect, useState } from "react";

function StreakHero({ streak, docked }) {
  const [displayStreak, setDisplayStreak] = useState(streak);
  const showFire = streak >= 2;


  useEffect(() => {
    if (streak !== displayStreak) {
      setDisplayStreak(streak);
    }
  }, [streak]);

  return (
    <div
      style={{
        ...styles.container,
        transform: docked ? "scale(0.85)" : "scale(1)",
        opacity: docked ? 0 : 1,
        transition: "transform 220ms ease, opacity 180ms ease",
      }}
    >
      <div style={styles.streakRow}>
        <span style={styles.streakNumber}>{streak}</span>
        {showFire && <span style={styles.fire}>🔥</span>}
      </div>
      <div style={styles.label}>days in a row</div>
    </div>
  );
}

const styles = {
  container: {
    padding: "32px 16px 16px",
    textAlign: "center",
  },
  streakRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
  },
  streakNumber: {
    fontSize: "64px",
    fontWeight: 700,
    lineHeight: 1,
  },
  fire: {
    fontSize: "40px",
  },
  label: {
    marginTop: "8px",
    fontSize: "14px",
    opacity: 0.7,
  },
};

export default StreakHero;
