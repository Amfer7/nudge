// Active repository selection. Today this is always the local (localStorage)
// implementation. When cloud sync lands, this is where auth state chooses
// between localRepo and supabaseRepo (or a sync wrapper over both).

import { normalizeRestDays } from "./localRepo";
import { asyncLocalRepo } from "./asyncLocalRepo";
import { syncedRepo } from "./syncedRepo";

// The hooks read/write through this. It is localStorage-backed (offline cache)
// and, while signed in, also write-throughs to Supabase via a sink the
// SyncProvider installs. See syncedRepo.ts.
export const repo = syncedRepo;

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
