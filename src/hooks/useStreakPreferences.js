import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "fitness_streak_prefs";

const DEFAULT_PREFS = {
  freezeVisibility: "subtle",
};

export function useStreakPreferences() {
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const hydrated = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(stored) });
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

  return {
    freezeVisibility: prefs.freezeVisibility,
    setFreezeVisibility,
  };
}
