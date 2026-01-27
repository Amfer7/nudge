function ThemeSelector({ theme, onChange }) {
  return (
    <div style={styles.container}>
      <div style={styles.label}>Appearance</div>

      <div style={styles.options}>
        {["dark", "light", "system"].map((opt) => (
          <button
            key={opt}
            style={{
              ...styles.option,
              opacity: theme === opt ? 1 : 0.6,
              borderColor:
                theme === opt ? "var(--text)" : "var(--border)",
            }}
            onClick={() => onChange(opt)}
          >
            {opt.charAt(0).toUpperCase() + opt.slice(1)}
          </button>
        ))}
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
    marginBottom: "8px",
  },
  options: {
    display: "flex",
    gap: "8px",
  },
  option: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text)",
  },
};

export default ThemeSelector;
