import { useEffect, useRef, useState } from "react";
import fireIcon from "../assets/Fire.png";

function StreakHero({ streak, docked, scrollProgress = 0 }) {
  const [displayed, setDisplayed] = useState(streak);
  const rafRef = useRef(null);
  const startRef = useRef(streak);

  const showFire = streak >= 2;
  const heroScale = 1 - 0.12 * scrollProgress;
  const heroOpacity = 1 - scrollProgress;
  const heroTranslateY = -16 * scrollProgress;

  useEffect(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const from = startRef.current;
    const to = streak;

    if (from === to) {
      setDisplayed(to);
      return;
    }

    const duration = 520;
    const startedAt = performance.now();

    const tick = (now) => {
      const t = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const nextValue = Math.round(from + (to - from) * eased);
      setDisplayed(nextValue);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        startRef.current = to;
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [streak]);

  return (
    <div style={styles.outer}>
      <div
        style={{
          ...styles.container,
          transform: `translateY(${heroTranslateY}px) scale(${heroScale})`,
          opacity: docked ? 0 : heroOpacity,
          transition: "transform 120ms linear, opacity 120ms linear",
        }}
      >
        <div style={styles.streakRow}>
          <span style={styles.streakNumber}>{displayed}</span>
          {showFire && <img src={fireIcon} alt="Streak fire" style={styles.fireIcon} />}
        </div>
        <div style={styles.label}>days in a row</div>
        <div style={styles.subtext}>Stay consistent. Small wins stack.</div>
      </div>
    </div>
  );
}

const styles = {
  outer: {
    padding: "30px 0px 15px",
  },
  container: {
    minHeight: "20vh",
    padding: "24px 0 0px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  streakRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
  },
  streakNumber: {
    fontSize: "86px",
    fontWeight: 800,
    lineHeight: 1,
    color: "var(--hero-number)",
    textShadow:
      "0 0 10px rgba(255,255,255,0.18), 0 0 22px rgba(56,255,150,0.65), 0 0 42px rgba(56,255,150,0.4)",
  },
  fireIcon: {
    width: "68px",
    height: "68px",
    objectFit: "contain",
    filter: "drop-shadow(0 0 10px rgba(255, 120, 0, 0.45))",
  },
  label: {
    marginTop: "6px",
    fontSize: "14px",
    letterSpacing: "0.4px",
    opacity: 0.95,
    textShadow: "0 1px 6px rgba(0, 0, 0, 0.45)",
  },
  subtext: {
    marginTop: "7px",
    fontSize: "13px",
    color: "var(--text-muted)",
    textShadow: "0 1px 6px rgba(0, 0, 0, 0.42)",
  },
};

export default StreakHero;
