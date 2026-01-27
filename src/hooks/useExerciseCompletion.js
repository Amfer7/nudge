import { useEffect, useRef, useState } from "react";
import { toDateKey } from "../utils/dateUtils";

const STORAGE_KEY = "fitness_exercise_completion";

export function useExerciseCompletion() {
  const todayKey = toDateKey(new Date());
  const [data, setData] = useState({});
  const hydrated = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setData(stored ? JSON.parse(stored) : {});
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
