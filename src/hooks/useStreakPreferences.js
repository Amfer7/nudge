import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "fitness_streak_prefs";

const DEFAULT_PREFS = {
  freezeVisibility: "subtle",
  restDays: [0],
};

function normalizeRestDays(restDays) {
  if (!Array.isArray(restDays)) {
    return DEFAULT_PREFS.restDays;
  }

  const normalized = [...new Set(
    restDays
      .map((d) => Number(d))
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  )]
    .sort((a, b) => a - b)
    .slice(0, 3);

  return normalized.length > 0 ? normalized : DEFAULT_PREFS.restDays;
}

export function useStreakPreferences() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const hydrated = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setPrefs({
        ...DEFAULT_PREFS,
        ...parsed,
        restDays: normalizeRestDays(parsed?.restDays),
      });
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  function setFreezeVisibility(value) {
    setPrefs((prev) => ({
      ...prev,
      freezeVisibility: value,
    }));
  }

  function setRestDays(restDays) {
    setPrefs((prev) => ({
      ...prev,
      restDays: normalizeRestDays(restDays),
    }));
  }

  return {
    freezeVisibility: prefs.freezeVisibility,
    setFreezeVisibility,
    restDays: prefs.restDays,
    setRestDays,
  };
}
