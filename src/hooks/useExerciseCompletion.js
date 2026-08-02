import { useEffect, useState } from "react";
import { toDateKey } from "../utils/dateUtils";
import { repo } from "../lib/repo";

export function useExerciseCompletion() {
  const todayKey = toDateKey(new Date());
  // Hydrate once via a lazy initializer.
  const [data, setData] = useState(() => repo.getExerciseCompletion());

  useEffect(() => {
    repo.saveExerciseCompletion(data);
  }, [data]);

  const todayCompletion = data[todayKey] || {};

  function toggleExercise(index) {
    setData((prev) => ({
      ...prev,
      [todayKey]: {
        ...prev[todayKey],
        [index]: !prev[todayKey]?.[index],
      },
    }));
  }

  return {
    completed: todayCompletion,
    toggleExercise,
  };
}
