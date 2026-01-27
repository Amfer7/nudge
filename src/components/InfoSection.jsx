function InfoSection() {
  return (
    <section style={styles.container}>
      <h2 style={styles.heading}>How this app works</h2>

      <ul style={styles.list}>
        <li>
          <strong>Streaks are about consistency.</strong><br />
          Your streak counts how many valid days you’ve gone to the gym
          in a row.
        </li>

        <li>
          <strong>Sundays are rest days.</strong><br />
          Sundays don’t break your streak — but you can still log them
          if you go.
        </li>

        <li>
          <strong>Streak freezes save you on bad days.</strong><br />
          If you miss a day, a freeze is automatically used (if you have one),
          so your streak stays intact.
        </li>

        <li>
          <strong>Freezes are limited.</strong><br />
          You can store up to 3 freezes. They’re meant for unavoidable days,
          not for skipping the gym regularly.
        </li>

        <li>
          <strong>No one is checking.</strong><br />
          This app trusts you. Log honestly — the streak is for you,
          not for anyone else.
        </li>

        <li>
          <strong>Workouts and streaks are separate.</strong><br />
          Checking off exercises helps during your workout, but it
          doesn’t affect your streak.
        </li>

        <li>
          <strong>Your data stays on your device.</strong><br />
          Everything is stored locally unless you choose to sync later.
        </li>

        <li>
          <strong>Earn a streak freeze after 6 consecutive logged days.</strong>
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
