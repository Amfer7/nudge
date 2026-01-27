function StreakPreferences({ freezeVisibility, onChange }) {
  const isVisible = freezeVisibility === "visible";

  return (
    <div style={styles.container}>
      <div style={styles.label}>Streak preferences</div>

      <div style={styles.row}>
        <span>Freeze visibility</span>

        <div
          style={styles.toggle}
          onClick={() =>
            onChange(isVisible ? "subtle" : "visible")
          }
        >
          <div
            style={{
              ...styles.knob,
              transform: isVisible
                ? "translateX(44px)"
                : "translateX(0)",
            }}
          />

          <span
            style={{
              ...styles.option,
              opacity: isVisible ? 0.5 : 1,
            }}
          >
            Subtle
          </span>
          <span
            style={{
              ...styles.option,
              opacity: isVisible ? 1 : 0.5,
            }}
          >
            Visible
          </span>
        </div>
      </div>

      <div style={styles.helper}>
        Controls how freeze days appear in the calendar.
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "16px",
    borderBottom: "1px solid var(--border)",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "12px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
  },
  toggle: {
    position: "relative",
    width: "96px",
    height: "32px",
    borderRadius: "16px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 10px",
    cursor: "pointer",
    userSelect: "none",
  },
  knob: {
    position: "absolute",
    top: "3px",
    left: "3px",
    width: "40px",
    height: "24px",
    borderRadius: "12px",
    background: "var(--primary-bg)",
    transition: "transform 220ms cubic-bezier(.4,0,.2,1)",
  },
  option: {
    fontSize: "12px",
    zIndex: 1,
    transition: "opacity 160ms ease",
  },
  helper: {
    marginTop: "6px",
    fontSize: "12px",
    opacity: 0.6,
  },
};

export default StreakPreferences;
