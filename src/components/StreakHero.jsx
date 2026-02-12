function StreakHero({ streak, docked, scrollProgress = 0 }) {
  const showFire = streak >= 2;
  const heroScale = 1 - 0.12 * scrollProgress;
  const heroOpacity = 1 - scrollProgress;
  const heroTranslateY = -16 * scrollProgress;

  return (
    <div style={styles.outer}>
      <div
        style={{
          ...styles.container,
          transform: `translateY(${heroTranslateY}px) scale(${heroScale})`,
          opacity: docked ? 0 : heroOpacity,
          transition: "transform 120ms linear, opacity 120ms linear",
        }}
      >
        <div style={styles.streakRow}>
          <span style={styles.streakNumber}>{streak}</span>
          {showFire && <span style={styles.fire}>🔥</span>}
        </div>
        <div style={styles.label}>days in a row</div>
        <div style={styles.subtext}>Stay consistent. Small wins stack.</div>
      </div>
    </div>
  );
}

const styles = {
  outer: {
    padding: "18px 16px 0",
  },
  container: {
    padding: "24px 18px 18px",
    textAlign: "center",
    borderRadius: "20px",
    border: "1px solid var(--border)",
    background: "var(--hero-card)",
    boxShadow:
      "0 18px 30px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(45, 255, 196, 0.12) inset",
  },
  streakRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
  },
  streakNumber: {
    fontSize: "68px",
    fontWeight: 800,
    lineHeight: 1,
    color: "var(--hero-number)",
    textShadow: "var(--hero-number-shadow)",
  },
  fire: {
    fontSize: "36px",
  },
  label: {
    marginTop: "8px",
    fontSize: "13px",
    letterSpacing: "0.3px",
    opacity: 0.86,
  },
  subtext: {
    marginTop: "6px",
    fontSize: "12px",
    color: "var(--text-muted)",
  },
};

export default StreakHero;
