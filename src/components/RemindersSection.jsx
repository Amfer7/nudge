function formatHour(hour) {
  const period = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${period}`;
}

const HOURS = Array.from({ length: 24 }, (_, h) => h);

function RemindersSection({
  enabled,
  hour,
  permission,
  supported,
  onToggle,
  onHourChange,
}) {
  const denied = permission === "denied";

  return (
    <div style={styles.container}>
      <div style={styles.label}>Daily reminder</div>

      <div style={styles.row}>
        <span>Nudge me to log</span>

        <div
          style={{
            ...styles.toggle,
            ...(enabled ? styles.toggleOn : {}),
            ...(!supported || denied ? styles.toggleDisabled : {}),
          }}
          onClick={() => {
            if (!supported || denied) return;
            onToggle(!enabled);
          }}
        >
          <div
            style={{
              ...styles.knob,
              transform: enabled ? "translateX(24px)" : "translateX(0)",
            }}
          />
        </div>
      </div>

      {enabled && supported && !denied && (
        <div style={styles.row}>
          <span>Reminder time</span>
          <select
            style={styles.select}
            value={hour}
            onChange={(e) => onHourChange(Number(e.target.value))}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={styles.helper}>
        {!supported
          ? "Notifications aren't supported in this browser."
          : denied
          ? "Notifications are blocked. Enable them in your browser settings to get reminders."
          : "A local reminder fires while Nudge is open. Install the app for the best experience."}
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
    marginBottom: "16px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    marginBottom: "16px",
  },
  toggle: {
    position: "relative",
    width: "52px",
    height: "30px",
    borderRadius: "15px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    cursor: "pointer",
    transition: "background 200ms ease, border-color 200ms ease",
  },
  toggleOn: {
    background: "rgba(120, 220, 160, 0.16)",
    border: "1px solid rgba(120, 220, 160, 0.6)",
  },
  toggleDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  knob: {
    position: "absolute",
    top: "3px",
    left: "3px",
    width: "22px",
    height: "22px",
    borderRadius: "50%",
    background: "var(--primary-bg)",
    transition: "transform 220ms cubic-bezier(.4,0,.2,1)",
  },
  select: {
    background: "var(--card)",
    color: "var(--text)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "6px 10px",
    fontSize: "13px",
    cursor: "pointer",
  },
  helper: {
    fontSize: "12px",
    opacity: 0.6,
  },
};

export default RemindersSection;
