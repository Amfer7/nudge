function Navbar({ streak, freezeCount, docked, onOpenSettings }) {
  return (
    <header style={styles.nav}>
      {/* Logo */}
      <div
        title="Home"
        style={styles.navItem}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        🏋️
      </div>

      {/* Workouts shortcut */}
      <div
        title="Workouts"
        style={styles.navItem}
        onClick={() => {
          const el = document.getElementById("workout");
          el?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      >
        💪
      </div>

      {/* Streak */}
     <div
        style={{
          ...styles.navItem,
          opacity: docked ? 1 : 0,
          transform: docked ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 180ms ease, transform 180ms ease",
          pointerEvents: docked ? "auto" : "none",
        }}
      >
        <span style={styles.streak}>{streak}</span>
        {streak >= 2 && <span>🔥</span>}
      </div>

      {/* Freezes */}
      <div style={styles.navItem}>
        ❄️ {freezeCount}
      </div>

      {/* Settings */}
      <div title="Settings" style={styles.navItem} onClick={onOpenSettings}>
        ⚙️
      </div>
    </header>
  );
}



const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    height: "56px",
    padding: "0 20px",
    display: "grid",
   gridTemplateColumns: "repeat(5, 1fr)", // 🔑 equal spacing
    alignItems: "center",
    backgroundColor: "var(--bg)",
    borderBottom: "1px solid var(--border)",
  },
  streak: {
    fontSize: "25px",
    fontWeight: 700,
  },
  fire: {
    fontSize: "20px",
  },
navItem: {
  display: "flex",
  alignItems: "center",
  justifyContent: "center", // 🔑 equal centering
  gap: "4px",
  fontSize: "22px",
  cursor: "pointer",
  lineHeight: 1,
},
};

export default Navbar;
