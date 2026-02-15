import { APP_NAME } from "../app/version";
import settingsIcon from "../assets/settings.svg";
import freezeIcon from "../assets/Freeze.png";
import fireIcon from "../assets/Fire.png";

function Navbar({ streak, freezeCount, docked, scrollProgress = 0, onOpenSettings }) {
  const bgOpacity = scrollProgress;
  const blurPx = 8 * scrollProgress;
  const shadowOpacity = 0.18 * scrollProgress;

  return (
    <header
      style={{
        ...styles.nav,
        backdropFilter: `blur(${blurPx}px)`,
        boxShadow: `0 6px 16px rgba(0, 0, 0, ${shadowOpacity})`,
      }}
    >
      <div style={{ ...styles.navBg, opacity: bgOpacity }} />

      <div style={styles.inner}>
        <button
          title="Home"
          style={{ ...styles.navItem, ...styles.brand }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          {APP_NAME}
        </button>

        <div
          style={{
            ...styles.centerStreak,
            opacity: docked ? 1 : 0,
            transform: docked ? "translate(-50%, 0)" : "translate(-50%, 6px)",
            transition: "opacity 180ms ease, transform 180ms ease",
            pointerEvents: docked ? "auto" : "none",
          }}
        >
          <span style={styles.streak}>{streak}</span>
          {streak >= 2 && <img src={fireIcon} alt="Streak fire" style={styles.navFireIcon} />}
        </div>

        <div style={styles.rightActions}>
          <div style={{ ...styles.navItem, ...styles.freeze }}>
            <img src={freezeIcon} alt="Freezes" style={styles.freezeIcon} />
            {freezeCount}
          </div>

          <button title="Settings" style={styles.navItem} onClick={onOpenSettings}>
            <img src={settingsIcon} alt="Settings" style={styles.settingsIcon} />
          </button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 500,
    width: "100%",
    background: "transparent",
    transition: "backdrop-filter 120ms linear, box-shadow 120ms linear",
    overflow: "hidden",
  },
  navBg: {
    position: "absolute",
    inset: 0,
    background: "var(--nav-scroll-bg)",
    pointerEvents: "none",
    transition: "opacity 120ms linear",
  },
  inner: {
    position: "relative",
    zIndex: 1,
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    height: "62px",
    padding: "0 10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "5px",
    fontSize: "18px",
    cursor: "pointer",
    lineHeight: 1,
    minHeight: "40px",
    borderRadius: "8px",
    background: "transparent",
    border: "none",
    padding: "0 8px",
  },
  brand: {
    fontSize: "22px",
    fontWeight: 700,
    letterSpacing: "0.8px",
    color: "var(--brand-color)",
    textShadow: "var(--brand-shadow)",
    textTransform: "uppercase",
    paddingLeft: 0,
  },
  centerStreak: {
    position: "absolute",
    left: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    minHeight: "46px",
  },
  streak: {
    fontSize: "24px",
    fontWeight: 700,
    lineHeight: 1.12,
  },
  rightActions: {
    display: "flex",
    alignItems: "center",
    gap: "2px",
    marginLeft: "auto",
  },
  freeze: {
    fontWeight: 700,
    color: "var(--freeze-color)",
    textShadow: "var(--freeze-shadow)",
  },
  freezeIcon: {
    width: "26px",
    height: "26px",
    objectFit: "contain",
    borderRadius: "3px",
  },
  settingsIcon: {
    width: "20px",
    height: "20px",
    objectFit: "contain",
    borderRadius: "4px",
  },
  navFireIcon: {
    width: "22px",
    height: "22px",
    objectFit: "contain",
    filter: "drop-shadow(0 0 8px rgba(255, 120, 0, 0.45))",
  },
};

export default Navbar;
