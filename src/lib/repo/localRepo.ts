// localStorage implementation of the Repository contract — the app's original
// (and offline) persistence behavior, now behind a single seam. All localStorage
// keys and defensive parsing for the persisted domains live here, so hooks no
// longer touch `localStorage` directly.

import type { DayRecords } from "../streakEngine";
import type {
  Repository,
  Prefs,
  Workouts,
  ThemeName,
  ExerciseCompletion,
  ReminderPrefs,
} from "./types";

// Note the legacy `fitness_` prefix from the app's original name; newer keys use `nudge_`.
const KEYS = {
  dayRecords: "fitness_day_records",
  prefs: "fitness_streak_prefs",
  workouts: "fitness_workouts_by_weekday",
  theme: "fitness_theme",
  exerciseCompletion: "fitness_exercise_completion",
  reminders: "nudge_reminders",
} as const;

const DEFAULT_REMINDER_PREFS: ReminderPrefs = { enabled: false, hour: 19 };

export const DEFAULT_PREFS: Prefs = {
  freezeVisibility: "subtle",
  restDays: [0],
};

const DEFAULT_WORKOUTS: Workouts = {
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

const VALID_THEMES: ReadonlySet<string> = new Set(["dark", "light", "system"]);

// Defensive parse: clamp rest days to a valid, de-duped, sorted set of ≤3 weekdays.
export function normalizeRestDays(restDays: unknown): number[] {
  if (!Array.isArray(restDays)) {
    return DEFAULT_PREFS.restDays;
  }
  const normalized = [
    ...new Set(
      restDays
        .map((d) => Number(d))
        .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    ),
  ]
    .sort((a, b) => a - b)
    .slice(0, 3);
  return normalized.length > 0 ? normalized : DEFAULT_PREFS.restDays;
}

// Only user-authored statuses are persisted. Freezes are derived, never stored,
// so we strip any legacy `freeze` entries when reading old data.
function sanitizeDayRecords(records: DayRecords | undefined): DayRecords {
  const clean: DayRecords = {};
  for (const key of Object.keys(records ?? {})) {
    const status = records?.[key]?.status;
    if (status === "logged" || status === "blocked") {
      clean[key] = { status };
    }
  }
  return clean;
}

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota / unavailable-storage errors — the in-memory state is still authoritative.
  }
}

function readJSON<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const localRepo: Repository = {
  getDayRecords() {
    const parsed = readJSON<{ dayRecords?: DayRecords }>(KEYS.dayRecords, {});
    return sanitizeDayRecords(parsed.dayRecords);
  },
  saveDayRecords(records) {
    writeJSON(KEYS.dayRecords, { dayRecords: records });
  },

  getPrefs() {
    const parsed = readJSON<Partial<Prefs>>(KEYS.prefs, {});
    return {
      ...DEFAULT_PREFS,
      ...parsed,
      restDays: normalizeRestDays(parsed?.restDays),
    };
  },
  savePrefs(prefs) {
    writeJSON(KEYS.prefs, prefs);
  },

  getWorkouts() {
    return readJSON<Workouts>(KEYS.workouts, DEFAULT_WORKOUTS);
  },
  saveWorkouts(workouts) {
    writeJSON(KEYS.workouts, workouts);
  },

  getTheme() {
    const raw = readRaw(KEYS.theme);
    return raw && VALID_THEMES.has(raw) ? (raw as ThemeName) : "dark";
  },
  saveTheme(theme) {
    try {
      localStorage.setItem(KEYS.theme, theme);
    } catch {
      // ignore
    }
  },

  getExerciseCompletion() {
    return readJSON<ExerciseCompletion>(KEYS.exerciseCompletion, {});
  },
  saveExerciseCompletion(data) {
    writeJSON(KEYS.exerciseCompletion, data);
  },

  getReminderPrefs() {
    const parsed = readJSON<Partial<ReminderPrefs>>(KEYS.reminders, {});
    const hour = Number(parsed?.hour);
    return {
      enabled: parsed?.enabled === true,
      hour: Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : DEFAULT_REMINDER_PREFS.hour,
    };
  },
  saveReminderPrefs(prefs) {
    writeJSON(KEYS.reminders, prefs);
  },
};
