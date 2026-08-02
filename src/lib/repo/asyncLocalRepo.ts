// A Promise-returning adapter over the synchronous localRepo. It satisfies the
// AsyncRepository contract so the TanStack Query layer can be wired and exercised
// entirely offline, before any backend exists. When Supabase lands, `supabaseRepo`
// implements the same contract and the two are chosen by auth/sync state — the
// Query hooks written against AsyncRepository don't change.

import { localRepo } from "./localRepo";
import type { AsyncRepository } from "./types";

export const asyncLocalRepo: AsyncRepository = {
  getDayRecords: async () => localRepo.getDayRecords(),
  saveDayRecords: async (records) => localRepo.saveDayRecords(records),

  getPrefs: async () => localRepo.getPrefs(),
  savePrefs: async (prefs) => localRepo.savePrefs(prefs),

  getWorkouts: async () => localRepo.getWorkouts(),
  saveWorkouts: async (workouts) => localRepo.saveWorkouts(workouts),

  getTheme: async () => localRepo.getTheme(),
  saveTheme: async (theme) => localRepo.saveTheme(theme),

  getExerciseCompletion: async () => localRepo.getExerciseCompletion(),
  saveExerciseCompletion: async (data) => localRepo.saveExerciseCompletion(data),

  getReminderPrefs: async () => localRepo.getReminderPrefs(),
  saveReminderPrefs: async (prefs) => localRepo.saveReminderPrefs(prefs),
};
