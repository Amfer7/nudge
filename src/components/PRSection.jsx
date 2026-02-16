import { useEffect, useState } from "react";

const STORAGE_KEY = "nudge_pr_cards_v1";

const PR_TYPES = [
  { value: "reps", label: "Reps" },
  { value: "time", label: "Time" },
  { value: "weight", label: "Weight" },
  { value: "weight_reps", label: "Weight + Reps" },
];
const OPTION_STYLE = {
  background: "#f3fff9",
  color: "#0b1b13",
};
const TYPE_COLORS = {
  reps: {
    border: "rgba(255, 225, 140, 0.9)",
    tint: "linear-gradient(155deg, rgba(178, 132, 36, 0.58), rgba(26, 30, 11, 0.94))",
    value: "#fff1be",
    buttonBg: "rgba(255, 219, 124, 0.32)",
  },
  time: {
    border: "rgba(255, 214, 118, 0.88)",
    tint: "linear-gradient(155deg, rgba(166, 118, 28, 0.56), rgba(26, 30, 11, 0.94))",
    value: "#ffedb1",
    buttonBg: "rgba(255, 206, 103, 0.3)",
  },
  weight: {
    border: "rgba(255, 230, 152, 0.92)",
    tint: "linear-gradient(155deg, rgba(197, 146, 42, 0.62), rgba(26, 30, 11, 0.94))",
    value: "#fff4c8",
    buttonBg: "rgba(255, 224, 135, 0.34)",
  },
  weight_reps: {
    border: "rgba(255, 220, 126, 0.88)",
    tint: "linear-gradient(155deg, rgba(184, 130, 30, 0.58), rgba(26, 30, 11, 0.94))",
    value: "#ffeeb5",
    buttonBg: "rgba(255, 212, 112, 0.32)",
  },
};

function createId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return "0";
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatPrValue(pr) {
  const { type, value } = pr;

  if (type === "reps") {
    return `${formatNumber(value.reps)} reps`;
  }
  if (type === "time") {
    return `${formatNumber(value.seconds)} s`;
  }
  if (type === "weight") {
    return `${formatNumber(value.weight)} kg`;
  }
  return `${formatNumber(value.weight)} kg x ${formatNumber(value.reps)}`;
}

function getIncrementLabel(type) {
  if (type === "reps") {
    return "+1 rep";
  }
  if (type === "time") {
    return "+5 s";
  }
  if (type === "weight" || type === "weight_reps") {
    return "+2.5 kg";
  }
  return "+1 rep";
}

function incrementPr(pr, weightDelta = 2.5) {
  if (pr.type === "reps") {
    return {
      ...pr,
      value: {
        reps: parseNumber(pr.value.reps) + 1,
      },
    };
  }

  if (pr.type === "time") {
    return {
      ...pr,
      value: {
        seconds: parseNumber(pr.value.seconds) + 5,
      },
    };
  }

  if (pr.type === "weight") {
    return {
      ...pr,
      value: {
        weight: parseNumber(pr.value.weight) + 2.5,
      },
    };
  }

  return {
    ...pr,
    value: {
      weight: parseNumber(pr.value.weight) + weightDelta,
      reps: parseNumber(pr.value.reps),
    },
  };
}

function normalizePr(pr) {
  if (!pr || !pr.id || !pr.name || !pr.type || !pr.value) {
    return null;
  }

  if (pr.type === "reps") {
    return {
      id: String(pr.id),
      name: String(pr.name),
      type: "reps",
      value: {
        reps: parseNumber(pr.value.reps),
      },
    };
  }

  if (pr.type === "time") {
    return {
      id: String(pr.id),
      name: String(pr.name),
      type: "time",
      value: {
        seconds: parseNumber(pr.value.seconds),
      },
    };
  }

  if (pr.type === "weight") {
    return {
      id: String(pr.id),
      name: String(pr.name),
      type: "weight",
      value: {
        weight: parseNumber(pr.value.weight),
      },
    };
  }

  if (pr.type === "weight_reps") {
    return {
      id: String(pr.id),
      name: String(pr.name),
      type: "weight_reps",
      value: {
        weight: parseNumber(pr.value.weight),
        reps: parseNumber(pr.value.reps),
      },
    };
  }

  return null;
}

function getTypeColor(type) {
  return TYPE_COLORS[type] ?? TYPE_COLORS.reps;
}

function PRSection() {
  const [prMap, setPrMap] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return {};
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return {};
      }

      return Object.values(parsed).reduce((acc, item) => {
        const normalized = normalizePr(item);
        if (normalized) {
          acc[normalized.id] = normalized;
        }
        return acc;
      }, {});
    } catch {
      return {};
    }
  });

  const [name, setName] = useState("");
  const [type, setType] = useState("reps");
  const [reps, setReps] = useState("");
  const [seconds, setSeconds] = useState("");
  const [weight, setWeight] = useState("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prMap));
  }, [prMap]);

  const cards = Object.values(prMap);

  const handleAdd = (event) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const id = createId();
    let value = {};

    if (type === "reps") {
      value = { reps: parseNumber(reps) };
    } else if (type === "time") {
      value = { seconds: parseNumber(seconds) };
    } else if (type === "weight") {
      value = { weight: parseNumber(weight) };
    } else {
      value = {
        weight: parseNumber(weight),
        reps: parseNumber(reps),
      };
    }

    setPrMap((prev) => ({
      ...prev,
      [id]: {
        id,
        name: trimmedName,
        type,
        value,
      },
    }));

    setName("");
    setReps("");
    setSeconds("");
    setWeight("");
  };

  const handleIncrement = (id) => {
    setPrMap((prev) => {
      const current = prev[id];
      if (!current) {
        return prev;
      }

      return {
        ...prev,
        [id]: incrementPr(current, 2.5),
      };
    });
  };

  const handleDelete = (id) => {
    setPrMap((prev) => {
      if (!prev[id]) {
        return prev;
      }
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  return (
    <section style={styles.container}>
      <h3 style={styles.heading}>PR Tracker</h3>

      <form style={styles.form} onSubmit={handleAdd}>
        <input
          style={styles.input}
          placeholder="Exercise"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Exercise name"
        />

        <div style={styles.selectWrap}>
          <select
            style={styles.select}
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="PR type"
          >
            {PR_TYPES.map((option) => (
              <option key={option.value} value={option.value} style={OPTION_STYLE}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {(type === "reps" || type === "weight_reps") && (
          <input
            style={styles.input}
            type="number"
            inputMode="numeric"
            placeholder="Reps"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            aria-label="Reps"
          />
        )}

        {type === "time" && (
          <input
            style={styles.input}
            type="number"
            inputMode="numeric"
            placeholder="Seconds"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            aria-label="Seconds"
          />
        )}

        {(type === "weight" || type === "weight_reps") && (
          <input
            style={styles.input}
            type="number"
            inputMode="decimal"
            step="0.1"
            placeholder="Weight (kg)"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            aria-label="Weight"
          />
        )}

        <button type="submit" style={styles.addBtn}>
          Add PR
        </button>
      </form>

      <div style={styles.grid}>
        {cards.length === 0 && (
          <div style={styles.emptyCard}>
            Add your first PR to start tracking.
          </div>
        )}

        {cards.map((pr, index) => (
          <article
            key={pr.id}
            style={{
              ...styles.card,
              border: `1px solid ${getTypeColor(pr.type).border}`,
              background: getTypeColor(pr.type).tint,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                ...styles.cardShine,
                animationDelay: `${index * 0.45}s`,
              }}
            />
            <span
              aria-hidden="true"
              style={{
                ...styles.cardShine,
                animationDelay: `${index * 0.45 + 4.5}s`,
              }}
            />
            <button
              style={styles.deleteBtn}
              onClick={() => handleDelete(pr.id)}
              aria-label={`Delete ${pr.name}`}
            >
              Delete
            </button>

            <div style={styles.cardName}>{pr.name}</div>
            <div
              style={{
                ...styles.cardValue,
                color: getTypeColor(pr.type).value,
              }}
            >
              {formatPrValue(pr)}
            </div>

            <button
              style={{
                ...styles.incrementBtn,
                border: `1px solid ${getTypeColor(pr.type).border}`,
                background: getTypeColor(pr.type).buttonBg,
              }}
              onClick={() => handleIncrement(pr.id)}
            >
              {getIncrementLabel(pr.type)}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

const styles = {
  container: {
    padding: "8px 16px 8px",
  },
  heading: {
    marginBottom: "10px",
    fontSize: "15px",
    fontWeight: 700,
    letterSpacing: "0.25px",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: "7px",
    marginBottom: "10px",
  },
  input: {
    width: "100%",
    borderRadius: "9px",
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--text)",
    padding: "8px 10px",
    fontSize: "12px",
    minHeight: "36px",
  },
  selectWrap: {
    position: "relative",
  },
  select: {
    width: "100%",
    borderRadius: "9px",
    border: "1px solid var(--border)",
    background: "linear-gradient(145deg, rgba(6, 26, 16, 0.94), rgba(5, 18, 12, 0.96))",
    color: "var(--text)",
    padding: "8px 36px 8px 10px",
    fontSize: "12px",
    minHeight: "36px",
    fontWeight: 600,
    appearance: "none",
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23cde7da' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 11px center",
    backgroundSize: "14px 14px",
    outline: "none",
  },
  addBtn: {
    borderRadius: "9px",
    border: "1px solid var(--border)",
    background: "rgba(120, 220, 160, 0.14)",
    color: "var(--text)",
    padding: "8px 10px",
    fontSize: "12px",
    fontWeight: 700,
    minHeight: "36px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
    gap: "8px",
  },
  emptyCard: {
    minHeight: "50px",
    borderRadius: "10px",
    border: "1px dashed var(--border)",
    padding: "10px",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    fontSize: "12px",
  },
  card: {
    minHeight: "142px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--card)",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
  },
  cardShine: {
    position: "absolute",
    top: "-18%",
    left: 0,
    width: "64%",
    height: "140%",
    background:
      "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)",
    transform: "translateX(-220%) skewX(-20deg)",
    mixBlendMode: "screen",
    opacity: 1,
    animation: "shineSweep 9s cubic-bezier(0.3, 0, 0.2, 1) infinite",
    pointerEvents: "none",
    zIndex: 1,
  },
  deleteBtn: {
    position: "absolute",
    top: "6px",
    right: "6px",
    border: "1px solid var(--border)",
    background: "transparent",
    color: "var(--text-muted)",
    fontSize: "10px",
    borderRadius: "7px",
    padding: "1px 6px",
    cursor: "pointer",
  },
  cardName: {
    paddingTop: "10px",
    fontSize: "16px",
    fontWeight: 700,
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardValue: {
    fontSize: "20px",
    fontWeight: 800,
    lineHeight: 1.1,
  },
  incrementBtn: {
    border: "1px solid var(--border)",
    background: "rgba(120, 220, 160, 0.14)",
    color: "var(--text)",
    borderRadius: "8px",
    padding: "4px 9px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },
};

export default PRSection;
