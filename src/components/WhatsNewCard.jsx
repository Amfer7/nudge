import { APP_VERSION } from "../app/version";

function WhatsNewCard() {
  return (
    <section style={styles.card}>
      <h3 style={styles.title}>What&apos;s new ({APP_VERSION})</h3>

      <ul style={styles.list}>
        <li>
          Streak logic is now stable and production-ready, including proper
          streak carryover, miss handling, and reliable recalculation.
        </li>
        <li>
          Freeze system is fully implemented: earn after 6 valid consecutive
          logs, max 1 earn per 7-day window, up to 3 stored, and automatic
          freeze spending on missed days.
        </li>
        <li>
          Undo now safely reverses the day state and also revokes a same-day
          earned freeze when applicable.
        </li>
        <li>
          Major UI overhaul shipped: new visual identity, improved readability
          in dark/light modes, clearer calendar semantics, and smoother mobile
          navigation behavior.
        </li>
        <li>
          Developer tooling improved for validation: day-offset simulation,
          debug summary metrics, and one-tap reset controls.
        </li>
      </ul>
    </section>
  );
}

const styles = {
  card: {
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "12px",
    marginTop: "12px",
  },
  title: {
    margin: "0 0 8px",
    fontSize: "15px",
    fontWeight: 600,
  },
  list: {
    margin: 0,
    paddingLeft: "18px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    fontSize: "13px",
    lineHeight: 1.45,
    opacity: 0.9,
  },
};

export default WhatsNewCard;
