function SettingsPanel({ onClose, children }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span>Settings</span>
          <button onClick={onClose}>Close</button>
        </div>

        {children}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)", // overlay stays dark in both modes
    display: "flex",
    alignItems: "flex-end",
    zIndex: 200,
  },
  sheet: {
    width: "100%",
    background: "var(--bg)",           // 🔑 FIX
    color: "var(--text)",              // 🔑 FIX
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
    paddingBottom: "16px",
  },
  header: {
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    fontWeight: 600,
    borderBottom: "1px solid var(--border)", // 🔑 FIX
  },
};

export default SettingsPanel;
