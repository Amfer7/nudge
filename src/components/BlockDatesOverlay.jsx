// src/components/BlockDatesOverlay.jsx
import { toDateKey } from "../utils/dateUtils";
import { useState } from "react";

function BlockDatesOverlay({
  visible,
  onClose,
  dayRecords,
  onBlock,
  onUnblock,
}) {
  if (!visible) return null;

  const today = new Date();
  const minDate = new Date();
  minDate.setDate(today.getDate() + 1); // rule enforced

   const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
    });

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

  const days = [];
  for (let d = 1; d <= 31; d++) {
    const date = new Date(year, month, d);
    if (date.getMonth() !== month) break;
    days.push(date);
  }

    function prevMonth() {
    setViewDate((d) => {
        const prev = new Date(d.getFullYear(), d.getMonth() - 1, 1);
        const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return prev < currentMonth ? d : prev;
    });
    }

    function nextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    }



  function isSelectable(date) {
    return date >= minDate;
  }

  function toggleDate(date) {
    const key = toDateKey(date);
    const record = dayRecords[key];

    if (!isSelectable(date)) return;

    if (record?.status === "blocked") {
      onUnblock(key);
    } else {
      onBlock([key]);
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
            <button style={styles.navBtn} onClick={prevMonth}>{"<"}</button>
            <span>
                {viewDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
                })}
            </span>
            <button style={styles.navBtn} onClick={nextMonth}>{">"}</button>
            </div>

        <div style={styles.grid}>
          {days.map((date) => {
            const key = toDateKey(date);
            const record = dayRecords[key];
            const blocked = record?.status === "blocked";
            const disabled = !isSelectable(date);

            return (
              <div
                key={key}
                style={{
                  ...styles.cell,
                  ...(blocked ? styles.blocked : {}),
                  ...(disabled ? styles.disabled : {}),
                }}
                onClick={() => toggleDate(date)}
              >
                {date.getDate()}
              </div>
            );
          })}
        </div>

        <div style={styles.footer}>
          Only future dates (2+ days ahead) can be blocked.
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "flex-end",
    zIndex: 300,
  },

  sheet: {
    width: "100%",
    background: "var(--bg)",
    color: "var(--text)",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
    padding: "16px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 600,
    marginBottom: "12px",
  },

  close: {
    background: "none",
    border: "none",
    fontSize: "18px",
    cursor: "pointer",
    color: "var(--text)",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
  },

  cell: {
    height: "40px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--cal-empty)",
    cursor: "pointer",
  },

  blocked: {
    background: "var(--cal-blocked)",
  },

  disabled: {
    opacity: 0.3,
    pointerEvents: "none",
  },

  footer: {
    marginTop: "12px",
    fontSize: "12px",
    opacity: 0.6,
    textAlign: "center",
  },

  navBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "var(--text)",
    },

};

export default BlockDatesOverlay;

