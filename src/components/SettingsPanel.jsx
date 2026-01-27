function SettingsPanel({ onClose, children }) {
  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        {/* Sticky header */}
        <div style={styles.header}>
          <span>Settings</span>
          <button style={styles.close} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div style={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "flex-end",
    zIndex: 200,
  },

  sheet: {
    width: "100%",
    maxHeight: "90vh",
    background: "var(--bg)",
    color: "var(--text)",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
    display: "flex",
    flexDirection: "column",
  },

  header: {
    position: "sticky",          // 🔑 THIS is the key
    top: 0,
    zIndex: 1,
    padding: "16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 600,
    background: "var(--bg)",     // 🔑 prevents transparency
    borderBottom: "1px solid var(--border)",
  },

  close: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "var(--text)",
  },

  content: {
    padding: "16px",
    overflowY: "auto",           // 🔑 scrolling lives here
    WebkitOverflowScrolling: "touch",
  },
};

export default SettingsPanel;
