function LogTodayButton({ todayStatus, onLog, onUndo }) {
  const isLogged = todayStatus === "logged";

  return (
    <div style={styles.container}>
      {!isLogged ? (
        <button
          style={styles.primaryButton}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "translateY(2px) scale(0.95)";
            e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.26)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = styles.primaryButton.boxShadow;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = styles.primaryButton.boxShadow;
          }}
          onClick={onLog}
        >
          Mark today as done
        </button>
      ) : (
        <div style={styles.loggedState}>
          <div style={styles.doneText}>Today marked complete</div>
          <button style={styles.undoButton} onClick={onUndo}>
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginTop: "14px",
    padding: "0 16px",
    display: "flex",
    justifyContent: "center",
  },
  primaryButton: {
    width: "100%",
    maxWidth: "560px",
    padding: "16px 20px",
    fontSize: "16px",
    fontWeight: 700,
    borderRadius: "14px",
    border: "1px solid rgba(45, 255, 196, 0.25)",
    background: "var(--primary-bg)",
    color: "var(--primary-text)",
    boxShadow: "0 14px 26px rgba(30, 201, 95, 0.28), 0 0 0 1px rgba(255,255,255,0.1) inset",
    transition: "transform 140ms cubic-bezier(0.2, 0.9, 0.2, 1), box-shadow 160ms ease",
    letterSpacing: "0.2px",
  },
  loggedState: {
    width: "100%",
    maxWidth: "560px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    borderRadius: "14px",
    padding: "12px",
    border: "1px solid var(--border)",
    background: "var(--card)",
  },
  doneText: {
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--done-text)",
  },
  undoButton: {
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.2px",
    color: "var(--undo-text)",
    border: "1px solid var(--undo-border)",
    background: "var(--undo-bg)",
    padding: "6px 12px",
    borderRadius: "999px",
  },
};

export default LogTodayButton;
