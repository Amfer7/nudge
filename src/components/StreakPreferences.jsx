import { useEffect, useMemo, useRef, useState } from "react";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

function toSortedUnique(days) {
  return [...new Set(days)].sort((a, b) => a - b);
}

function StreakPreferences({
  freezeVisibility,
  onChange,
  restDays = [0],
  onSaveRestDays,
}) {
  const isVisible = freezeVisibility === "visible";
  const [draftRestDays, setDraftRestDays] = useState(() => toSortedUnique(restDays));
  const [showSavedModal, setShowSavedModal] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    setDraftRestDays(toSortedUnique(restDays));
  }, [restDays]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const isDirty = useMemo(() => {
    const current = toSortedUnique(restDays);
    const draft = toSortedUnique(draftRestDays);
    if (current.length !== draft.length) return true;
    return current.some((d, idx) => d !== draft[idx]);
  }, [draftRestDays, restDays]);

  function toggleRestDay(day) {
    setDraftRestDays((prev) => {
      const hasDay = prev.includes(day);
      if (hasDay) {
        return prev.filter((d) => d !== day);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  }

  function handleSave() {
    onSaveRestDays?.(draftRestDays);
    setShowSavedModal(true);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setShowSavedModal(false);
    }, 3000);
  }

  return (
    <div style={styles.container}>
      <div style={styles.label}>Streak preferences</div>

      <div style={styles.row}>
        <span>Freeze visibility</span>

        <div
          style={styles.toggle}
          onClick={() =>
            onChange(isVisible ? "subtle" : "visible")
          }
        >
          <div
            style={{
              ...styles.knob,
              transform: isVisible
                ? "translateX(44px)"
                : "translateX(0)",
            }}
          />

          <span
            style={{
              ...styles.option,
              opacity: isVisible ? 0.5 : 1,
            }}
          >
            Subtle
          </span>
          <span
            style={{
              ...styles.option,
              opacity: isVisible ? 1 : 0.5,
            }}
          >
            Visible
          </span>
        </div>
      </div>

      <div style={styles.restSection}>
        <div style={styles.restHeader}>
          <span>Rest days</span>
          <span style={styles.restCount}>{draftRestDays.length}/3</span>
        </div>
        <div style={styles.dayGrid}>
          {WEEKDAYS.map((day) => {
            const selected = draftRestDays.includes(day.value);
            const atLimit = draftRestDays.length >= 3 && !selected;

            return (
              <button
                key={day.value}
                type="button"
                style={{
                  ...styles.dayBtn,
                  ...(selected ? styles.dayBtnActive : {}),
                  ...(atLimit ? styles.dayBtnDisabled : {}),
                }}
                onClick={() => toggleRestDay(day.value)}
                disabled={atLimit}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        style={{
          ...styles.saveBtn,
          ...(isDirty ? {} : styles.saveBtnDisabled),
        }}
        onClick={handleSave}
        disabled={!isDirty}
      >
        Save preferences
      </button>

      <div style={styles.helper}>
        Pick up to 3 rest days. Unlogged rest days stay neutral and do not break your streak.
      </div>

      {showSavedModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modal}>
            <div style={styles.tick}>✓</div>
            <div style={styles.modalTitle}>Preferences saved</div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    padding: "16px",
    borderBottom: "1px solid var(--border)",
    position: "relative",
  },
  label: {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "16px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: "14px",
    marginBottom: "20px",
  },
  toggle: {
    position: "relative",
    width: "96px",
    height: "32px",
    borderRadius: "16px",
    background: "var(--card)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 10px",
    cursor: "pointer",
    userSelect: "none",
  },
  knob: {
    position: "absolute",
    top: "3px",
    left: "3px",
    width: "40px",
    height: "24px",
    borderRadius: "12px",
    background: "var(--primary-bg)",
    transition: "transform 220ms cubic-bezier(.4,0,.2,1)",
  },
  option: {
    fontSize: "12px",
    zIndex: 1,
    transition: "opacity 160ms ease",
  },
  restSection: {
    marginTop: "0",
  },
  restHeader: {
    fontSize: "14px",
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },
  restCount: {
    opacity: 0.75,
    fontSize: "12px",
  },
  dayGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
    gap: "6px",
  },
  dayBtn: {
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "8px 0",
    background: "var(--card)",
    color: "var(--text)",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: 600,
  },
  dayBtnActive: {
    background: "rgba(120, 220, 160, 0.16)",
    border: "1px solid rgba(120, 220, 160, 0.6)",
  },
  dayBtnDisabled: {
    opacity: 0.4,
    cursor: "not-allowed",
  },
  saveBtn: {
    marginTop: "16px",
    width: "100%",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "9px 12px",
    background: "rgba(120, 220, 160, 0.16)",
    color: "var(--text)",
    fontWeight: 700,
    cursor: "pointer",
  },
  saveBtnDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  helper: {
    marginTop: "12px",
    fontSize: "12px",
    opacity: 0.6,
  },
  modalBackdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.34)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 450,
  },
  modal: {
    minWidth: "220px",
    borderRadius: "12px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    padding: "18px 16px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.28)",
  },
  tick: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(120, 220, 160, 0.2)",
    border: "1px solid rgba(120, 220, 160, 0.6)",
    fontSize: "20px",
    fontWeight: 800,
    lineHeight: 1,
  },
  modalTitle: {
    fontSize: "14px",
    fontWeight: 700,
  },
};

export default StreakPreferences;
