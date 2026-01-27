import { toDateKey, isSunday } from "../utils/dateUtils";

function CalendarOverlay({ visible, onClose, dayRecords }) {
  if (!visible) return null;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days = [];
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          {today.toLocaleString("default", { month: "long" })} {year}
        </div>

        <div style={styles.grid}>
          {days.map((date) => {
            const key = toDateKey(date);
            const record = dayRecords[key];
            const sunday = isSunday(date);

            let cellStyle = styles.cell;
            if (record?.status === "logged") cellStyle = styles.logged;
            if (record?.status === "freeze") {
            cellStyle =
                freezeVisibility === "visible"
                ? styles.freezeVisible
                : styles.freezeSubtle;
            }            
            if (sunday) cellStyle = styles.sunday;

            return (
              <div key={key} style={cellStyle}>
                {date.getDate()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.6)", // intentional dim
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-end",
    zIndex: 100,
  },

  sheet: {
    width: "100%",
    backgroundColor: "var(--bg)", // 🔑 FIX
    color: "var(--text)",         // 🔑 FIX
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
    padding: "16px",
    animation: "slideUp 220ms ease-out",
  },

  header: {
    textAlign: "center",
    fontWeight: 600,
    marginBottom: "12px",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "8px",
  },

  cell: {
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "var(--cal-empty)",
    opacity: 0.6,
  },

  logged: {
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "var(--cal-logged)",
    color: "var(--cal-logged-text)",
    fontWeight: 600,
  },

  freezeVisible: {
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "var(--cal-freeze-visible)",
  },

  freezeSubtle: {
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "var(--cal-freeze-subtle)",
    opacity: 0.6,
  },

  sunday: {
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "8px",
    background: "var(--cal-sunday)",
    opacity: 0.6, // 🔑 softened
  },
};
export default CalendarOverlay;