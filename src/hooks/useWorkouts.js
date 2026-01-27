import { useEffect, useRef, useState } from "react";

const STORAGE_KEY = "fitness_workouts_by_weekday";

const DEFAULT_WORKOUTS = {
  1: {
    title: "Push Day",
    exercises: [
      "Bench Press – 4x8",
      "Incline Dumbbell Press – 3x10",
      "Shoulder Press – 3x8",
      "Tricep Pushdowns – 3x12",
    ],
  },
  3: {
    title: "Pull Day",
    exercises: [
      "Deadlift – 4x5",
      "Pull Ups – 3x max",
      "Barbell Rows – 3x8",
      "Bicep Curls – 3x12",
    ],
  },
  5: {
    title: "Leg Day",
    exercises: [
      "Squats – 4x6",
      "Leg Press – 3x10",
      "Hamstring Curls – 3x12",
      "Calf Raises – 4x15",
    ],
  },
};

export function useWorkouts() {
  const [workouts, setWorkouts] = useState({});
  const hasLoaded = useRef(false);

  // Load once
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setWorkouts(stored ? JSON.parse(stored) : DEFAULT_WORKOUTS);
    hasLoaded.current = true;
  }, []);

  // Save only AFTER initial load
  useEffect(() => {
    if (!hasLoaded.current) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workouts));
  }, [workouts]);

  function updateWorkout(day, workout) {
    setWorkouts((prev) => ({
      ...prev,
      [day]: workout,
    }));
  }

  return {
    workouts,
    updateWorkout,
  };
}
