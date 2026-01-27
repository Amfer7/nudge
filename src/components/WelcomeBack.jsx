// src/components/WelcomeBack.jsx
import { useEffect, useState } from "react";

function WelcomeBack() {
  const [phase, setPhase] = useState("intro"); 
  // "intro" → big overlay
  // "docked" → small label under navbar

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase("docked");
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const isIntro = phase === "intro";

  return (
    <>
      {/* Backdrop */}
      {isIntro && <div style={styles.backdrop} />}

      {/* Text */}
      <div
        style={{
          ...styles.text,
          ...(isIntro ? styles.intro : styles.docked),
        }}
      >
        Welcome back!
      </div>
    </>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    backdropFilter: "blur(4px)",
    zIndex: 250,
  },

  text: {
    fontWeight: 700,
    letterSpacing: "-0.02em",
    transition:
      "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), " +
      "opacity 400ms ease, " +
      "top 700ms cubic-bezier(0.22, 1, 0.36, 1), " +
      "left 700ms cubic-bezier(0.22, 1, 0.36, 1)",
    color: "var(--text)",
    zIndex: 260,
    pointerEvents: "none", // never blocks interaction
  },

    intro: {
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) scale(1)",
    fontSize: "48px",
    opacity: 1,
    },

    docked: {
    position: "fixed", // 🔑 stays fixed
    top: "56px",       // navbar height
    left: "16px",      // final anchor
    transform: "translate(0, 0) scale(0.6)", // 🔑 no re-centering math
    fontSize: "24px",
    opacity: 0.9,
    },
};

export default WelcomeBack;
