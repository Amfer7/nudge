// The active `repo` the hooks read/write through. It is localRepo (the offline
// cache) for reads and for every write, PLUS an optional write-through "sink"
// that the SyncProvider installs while a user is signed in. This is how Phase 1
// keeps the hook layer untouched: hooks still call `repo.saveDayRecords(...)`
// synchronously and optimistically against localStorage; the sink fans the same
// write out to Supabase in the background. Sign out → sink cleared → local-only.

import { localRepo } from "./localRepo";
import type { Repository, Prefs } from "./types";
import type { DayRecords } from "../streakEngine";

export interface SyncSink {
  pushDayRecords?: (records: DayRecords) => void;
  pushPrefs?: (prefs: Prefs) => void;
}

let sink: SyncSink | null = null;

export function setSyncSink(next: SyncSink | null): void {
  sink = next;
}

export const syncedRepo: Repository = {
  ...localRepo,

  saveDayRecords(records) {
    localRepo.saveDayRecords(records);
    sink?.pushDayRecords?.(records);
  },

  savePrefs(prefs) {
    localRepo.savePrefs(prefs);
    sink?.pushPrefs?.(prefs);
  },
};
