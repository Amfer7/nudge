import { APP_VERSION } from "../app/version";

function WhatsNewCard() {
  return (
    <section style={styles.card}>
      <h3 style={styles.title}>What&apos;s new ({APP_VERSION})</h3>

      <ul style={styles.list}>
        <li>
          You can now choose your own rest days in Settings (up to 3), with Sunday as the default.
        </li>
        <li>
          Rest-day changes apply directly to streak logic, so selected rest days are neutral when unlogged.
        </li>
        <li>
          Added PR Tracker cards so you can log and grow your personal records.
        </li>
        <li>
          PR cards now include the same premium shine effect used across the main UI.
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
