import { APP_VERSION } from "../app/version";

function WhatsNewCard() {
  return (
    <section style={styles.card}>
      <h3 style={styles.title}>What&apos;s new ({APP_VERSION})</h3>

      <ul style={styles.list}>
        <li>
          Major UI refresh: energetic neon-green visual language, cleaner cards,
          improved hierarchy, and better readability across mobile and desktop.
        </li>
        <li>
          Calendar status colors are now explicit: fiery orange for logged days
          and ice blue for freeze days.
        </li>
        <li>
          Streak and freeze system finalized: 6-day earn rule, max 1 earn per
          7-day window, and freeze spending that preserves streak without
          inflating it.
        </li>
        <li>
          Undo behavior is safer: undoing a qualifying day now revokes same-day
          earned freeze correctly.
        </li>
        <li>
          Developer testing improved with time-shift controls, summary readouts,
          and full reset support for fast logic validation.
        </li>
        <li>
          Motion polish added: animated background flow, responsive navbar
          behavior on scroll, and a refreshed welcome animation.
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
