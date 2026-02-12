function WelcomeBack({ isLogged = false }) {
  return (
    <div style={styles.wrap}>
      <div style={styles.badge}>
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
    animation: "welcomeBounceInLeft 920ms cubic-bezier(0.2, 0.95, 0.2, 1)",
  },
  dot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    animation: "pulseDot 1.8s ease-in-out infinite",
  },
};

export default WelcomeBack;
