// src/components/WelcomeBack.jsx
import { useEffect, useState } from "react";

function WelcomeBack() {
  const [phase, setPhase] = useState("intro"); 
  const isIntro = phase === "intro";
  // "intro" → big overlay
  // "docked" → small label under navbar

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("docking"), 750);
    const t2 = setTimeout(() => setPhase("settled"), 750); // after animation

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);


  const styleForPhase =
    phase === "intro"
      ? styles.intro
      : phase === "docking"
      ? styles.docked
      : styles.settled;

  return (
    <>
      {/* Backdrop */}
      {isIntro && <div style={styles.backdrop} />}

      {/* Text */}
     <div
        style={{
          ...styles.text,
          ...styleForPhase,
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
    left: "-20px",      // final anchor
    transform: "translate(0, 0) scale(0.6)", // 🔑 no re-centering math
    fontSize: "28px",
    opacity: 0.9,
    },

    
    settled: {
      position: "relative",     // 🔑 participates in layout
      marginTop: "10px",
      marginLeft: "16px",
      fontSize: "20px",
      opacity: 0.7,
      transform: "none",
    },
};

export default WelcomeBack;
