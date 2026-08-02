// Active repository selection. Today this is always the local (localStorage)
// implementation. When cloud sync lands, this is where auth state chooses
// between localRepo and supabaseRepo (or a sync wrapper over both).

import { localRepo, normalizeRestDays } from "./localRepo";
import { asyncLocalRepo } from "./asyncLocalRepo";

export const repo = localRepo;

// The active async repository the server-state (TanStack Query) layer reads/writes
// through. Today this is always the local adapter; when cloud sync lands this is
// where auth state selects `supabaseRepo`.
export const asyncRepo = asyncLocalRepo;

export { normalizeRestDays };
export type {
  Repository,
  AsyncRepository,
  Prefs,
  Workouts,
  Workout,
  ThemeName,
  ExerciseCompletion,
  ReminderPrefs,
} from "./types";
