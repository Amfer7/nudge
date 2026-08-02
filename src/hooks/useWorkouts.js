import { useEffect, useState } from "react";
import { repo } from "../lib/repo";

export function useWorkouts() {
  // Hydrate once via a lazy initializer (repo returns the default plan when unset).
  const [workouts, setWorkouts] = useState(() => repo.getWorkouts());

  useEffect(() => {
    repo.saveWorkouts(workouts);
  }, [workouts]);

  function updateWorkout(day, workout) {
    setWorkouts((prev) => {
      const hasTitle = !!workout?.title?.trim();
      const hasExercises =
        Array.isArray(workout?.exercises) && workout.exercises.length > 0;

      if (!hasTitle && !hasExercises) {
        const next = { ...prev };
        delete next[day];
        return next;
      }

      return {
        ...prev,
        [day]: {
          title: workout.title || "",
          exercises: workout.exercises || [],
        },
      };
    });
  }

  return {
    workouts,
    updateWorkout,
  };
}
