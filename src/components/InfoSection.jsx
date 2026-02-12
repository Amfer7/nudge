function InfoSection() {
  return (
    <section style={styles.container}>
      <h2 style={styles.heading}>How this app works</h2>

      <ul style={styles.list}>
        <li>
          <strong>Streaks are about consistency.</strong><br />
          Your streak counts how many days you log workouts in a row.
        </li>

        <li>
          <strong>Sundays are rest days.</strong><br />
          Sundays do not break your streak, but you can still log them if you
          train.
        </li>

        <li>
          <strong>Streak freezes save missed days.</strong><br />
          If you miss a day and have a freeze, one freeze is consumed to
          preserve your streak.
        </li>

        <li>
          <strong>Freezes preserve, not boost.</strong><br />
          A freeze keeps your streak from breaking on a missed day, but it does
          not increase the streak count.
        </li>

        <li>
          <strong>Freezes are limited.</strong><br />
          You can store up to 3 freezes.
        </li>

        <li>
          <strong>Earning follows a weekly rule.</strong><br />
          You earn 1 freeze after 6 consecutive valid logged days, with a
          maximum of 1 freeze earned per 7-day window.
        </li>

        <li>
          <strong>Undo reverts today.</strong><br />
          Undo removes today&apos;s log. If today also granted a freeze, that
          earned freeze is revoked.
        </li>

        <li>
          <strong>This app runs on honesty.</strong><br />
          Nudge is built on trust. Log truthfully and do not cheat your streak.
        </li>

        <li>
          <strong>Your data stays on your device.</strong><br />
          Everything is stored locally unless you choose to sync later.
        </li>
      </ul>
    </section>
  );
}

const styles = {
  container: {
    padding: "16px",
    lineHeight: 1.5,
  },
  heading: {
    fontSize: "18px",
    fontWeight: 600,
    marginBottom: "12px",
  },
  list: {
    paddingLeft: "18px",
    margin: 0,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    fontSize: "14px",
    opacity: 0.9,
  },
};

export default InfoSection;
