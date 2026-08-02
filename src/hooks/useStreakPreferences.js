import { useEffect, useState } from "react";
import { repo, normalizeRestDays } from "../lib/repo";

export function useStreakPreferences() {
  // Hydrate once via a lazy initializer; the repo applies defaults + normalization.
  const [prefs, setPrefs] = useState(() => repo.getPrefs());

  useEffect(() => {
    repo.savePrefs(prefs);
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
