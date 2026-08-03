import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { inviteUrl } from "../lib/friends";

// Your personal invite: a scannable QR of /add/<code> plus the human code and
// copy/share affordances. The QR sits on a fixed light card so it scans in any
// theme (QR contrast must not depend on data-theme).
function InviteQR({ code }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const url = inviteUrl(window.location.origin, code);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 176, margin: 1 }, () => {});
    }
  }, [url]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the code is shown below regardless */
    }
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Add me on Nudge", url });
        return;
      }
    } catch {
      // fall through to copy
    }
    await copy();
  }

  return (
    <section style={styles.section}>
      <div style={styles.title}>Your invite</div>
      <div style={styles.qrCard}>
        <canvas ref={canvasRef} />
      </div>
      <div style={styles.code}>{code}</div>
      <div style={styles.row}>
        <button style={styles.btn} onClick={copy}>
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button style={styles.btn} onClick={share}>
          Share
        </button>
      </div>
    </section>
  );
}

const styles = {
  section: { display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" },
  title: { fontWeight: 600, fontSize: "16px", alignSelf: "flex-start" },
  qrCard: {
    background: "#ffffff",
    padding: "12px",
    borderRadius: "12px",
    lineHeight: 0,
  },
  code: {
    fontFamily: "monospace",
    fontWeight: 700,
    fontSize: "18px",
    letterSpacing: "2px",
    color: "var(--text)",
  },
  row: { display: "flex", gap: "8px" },
  btn: {
    padding: "9px 14px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "13px",
  },
};

export default InviteQR;
