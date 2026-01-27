function LogTodayButton({ todayStatus, onLog, onUndo }) {
  const isLogged = todayStatus === "logged";

  return (
    <div style={styles.container}>
      {!isLogged ? (
      <button
        style={styles.primaryButton}
        onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onClick={onLog}>          
        Mark today as done
        </button>
      ) : (
        <div style={styles.loggedState}>
          <div style={styles.doneText}>Marked as done</div>
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
    marginTop: "16px",
    display: "flex",
    justifyContent: "center",
  },
  primaryButton: {
    padding: "14px 20px",
    fontSize: "16px",
    fontWeight: 600,
    borderRadius: "10px",
    backgroundColor: "var(--primary-bg)", // 🔑
    color: "var(--primary-text)",         // 🔑
    transition: "transform 80ms ease",

  },
  loggedState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },
  doneText: {
    fontSize: "14px",
    opacity: 0.8,
  },
  undoButton: {
    fontSize: "14px",
    opacity: 0.7,
    textDecoration: "underline",
  },
};

export default LogTodayButton;
