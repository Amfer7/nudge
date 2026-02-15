function WelcomeBack({ isLogged = false }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.badge}>
        <span style={styles.shine} />
        <span
          style={{
            ...styles.dot,
            background: isLogged ? "var(--primary-solid)" : "var(--accent-energy)",
            boxShadow: isLogged
              ? "0 0 14px var(--primary-solid)"
              : "0 0 14px var(--accent-energy)",
          }}
        />
        Welcome back
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    padding: "12px 16px 2px",
  },
  badge: {
    display: "inline-flex",
    position: "relative",
    overflow: "hidden",
    alignItems: "center",
    gap: "8px",
    padding: "10px 14px",
    borderRadius: "999px",
    border: "1px solid var(--border)",
    background:
      "linear-gradient(130deg, rgba(56, 255, 150, 0.16), var(--accent-energy-soft))",
    fontSize: "17px",
    fontWeight: 700,
    color: "var(--text)",
    boxShadow: "0 10px 18px rgba(0, 0, 0, 0.18)",
    animation: "slideInFromLeft 820ms cubic-bezier(0.16, 1, 0.3, 1)",
  },
  shine: {
    position: "absolute",
    top: "-20%",
    left: 0,
    width: "62%",
    height: "140%",
    background:
      "linear-gradient(90deg, transparent, rgba(255,255,255,0.82), transparent)",
    transform: "translateX(-220%) skewX(-20deg)",
    mixBlendMode: "screen",
    opacity: 0.95,
    animation: "shineSweep 9s cubic-bezier(0.3, 0, 0.2, 1) infinite",
    pointerEvents: "none",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    animation: "pulseDot 1.8s ease-in-out infinite",
  },
};

export default WelcomeBack;
