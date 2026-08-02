// The data-access contract. Every persisted domain the app owns is read and
// written through a Repository, so the storage backend (localStorage today,
// Supabase later) is a single swappable seam. Component/hook return shapes never
// depend on which implementation is active.
//
// This contract is intentionally SYNCHRONOUS for the local implementation. The
// async (Supabase) contract is introduced later (see changes.txt Step 5); it
// mirrors these method names but returns Promises.

import type { DayRecords } from "../streakEngine";

export interface Prefs {
  freezeVisibility: string;
  restDays: number[];
}

export interface Workout {
  title: string;
  exercises: string[];
}
export type Workouts = Record<string, Workout>;

export type ThemeName = "dark" | "light" | "system";

// date key -> exercise index -> done?
export type ExerciseCompletion = Record<string, Record<string, boolean>>;

export interface ReminderPrefs {
  enabled: boolean;
  hour: number; // 0-23, local time of the daily nudge
}

export interface Repository {
  // Raw day log (only `logged` / `blocked` are stored; freezes are derived).
  getDayRecords(): DayRecords;
  saveDayRecords(records: DayRecords): void;

  getPrefs(): Prefs;
  savePrefs(prefs: Prefs): void;

  getWorkouts(): Workouts;
  saveWorkouts(workouts: Workouts): void;

  getTheme(): ThemeName;
  saveTheme(theme: ThemeName): void;

  getExerciseCompletion(): ExerciseCompletion;
  saveExerciseCompletion(data: ExerciseCompletion): void;

  getReminderPrefs(): ReminderPrefs;
  saveReminderPrefs(prefs: ReminderPrefs): void;
}

// The async mirror of Repository. This is the contract the future `supabaseRepo`
// implements and that TanStack Query hooks are written against (query = get*,
// mutation = save*). Pre-database it exists so Phase 1 is a drop-in; the only
// implementation today is `asyncLocalRepo`, a thin Promise wrapper over localRepo
// that lets the Query layer be exercised entirely offline.
export interface AsyncRepository {
  getDayRecords(): Promise<DayRecords>;
  saveDayRecords(records: DayRecords): Promise<void>;

  getPrefs(): Promise<Prefs>;
  savePrefs(prefs: Prefs): Promise<void>;

  getWorkouts(): Promise<Workouts>;
  saveWorkouts(workouts: Workouts): Promise<void>;

  getTheme(): Promise<ThemeName>;
  saveTheme(theme: ThemeName): Promise<void>;

  getExerciseCompletion(): Promise<ExerciseCompletion>;
  saveExerciseCompletion(data: ExerciseCompletion): Promise<void>;

  getReminderPrefs(): Promise<ReminderPrefs>;
  saveReminderPrefs(prefs: ReminderPrefs): Promise<void>;
}
