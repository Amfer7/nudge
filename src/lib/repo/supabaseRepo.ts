// Supabase implementation of the AsyncRepository contract. Phase-1 scope: sync
// the *raw log* (day_logs) and *prefs* (profiles.prefs) — everything the streak
// engine and the leaderboard need. Workouts, PRs, exercise-completion, theme and
// reminders stay device-local for now (Phase 3), so those methods delegate to
// localRepo. Freezes are never stored — they are derived from the log.

import { supabase } from "../supabase";
import { localRepo, DEFAULT_PREFS, normalizeRestDays } from "./localRepo";
import type { DayRecords, DayStatus } from "../streakEngine";
import type { AsyncRepository, Prefs } from "./types";

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

interface DayLogRow {
  date: string;
  status: DayStatus;
}

export const supabaseRepo: AsyncRepository = {
  async getDayRecords(): Promise<DayRecords> {
    const client = requireClient();
    const userId = await currentUserId();
    if (!userId) return {};

    const { data, error } = await client
      .from("day_logs")
      .select("date, status")
      .eq("user_id", userId);
    if (error) throw error;

    const records: DayRecords = {};
    for (const row of (data ?? []) as DayLogRow[]) {
      if (row.status === "logged" || row.status === "blocked") {
        records[row.date] = { status: row.status };
      }
    }
    return records;
  },

  // Full reconcile: upsert every current row, then delete any remote rows the
  // caller no longer has. Data volume is one row per active day, so a whole-set
  // reconcile is cheap and keeps the two stores exactly consistent.
  async saveDayRecords(records: DayRecords): Promise<void> {
    const client = requireClient();
    const userId = await currentUserId();
    if (!userId) return;

    const now = new Date().toISOString();
    const rows = Object.entries(records)
      .filter(
        ([, rec]) => rec?.status === "logged" || rec?.status === "blocked"
      )
      .map(([date, rec]) => ({
        user_id: userId,
        date,
        status: (rec as { status: DayStatus }).status,
        updated_at: now,
      }));

    if (rows.length > 0) {
      const { error } = await client
        .from("day_logs")
        .upsert(rows, { onConflict: "user_id,date" });
      if (error) throw error;
    }

    const keep = Object.keys(records);
    let del = client.from("day_logs").delete().eq("user_id", userId);
    if (keep.length > 0) del = del.not("date", "in", `(${keep.join(",")})`);
    const { error: delErr } = await del;
    if (delErr) throw delErr;
  },

  async getPrefs(): Promise<Prefs> {
    const client = requireClient();
    const userId = await currentUserId();
    if (!userId) return localRepo.getPrefs();

    const { data, error } = await client
      .from("profiles")
      .select("prefs")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;

    const prefs = (data?.prefs ?? {}) as Partial<Prefs>;
    return {
      freezeVisibility: prefs.freezeVisibility ?? DEFAULT_PREFS.freezeVisibility,
      restDays: normalizeRestDays(prefs.restDays),
    };
  },

  async savePrefs(prefs: Prefs): Promise<void> {
    const client = requireClient();
    const userId = await currentUserId();
    if (!userId) return;
    const { error } = await client
      .from("profiles")
      .update({ prefs })
      .eq("id", userId);
    if (error) throw error;
  },

  // Phase-3 domains: still device-local. Delegate to the local cache.
  getWorkouts: async () => localRepo.getWorkouts(),
  saveWorkouts: async (workouts) => localRepo.saveWorkouts(workouts),
  getTheme: async () => localRepo.getTheme(),
  saveTheme: async (theme) => localRepo.saveTheme(theme),
  getExerciseCompletion: async () => localRepo.getExerciseCompletion(),
  saveExerciseCompletion: async (data) =>
    localRepo.saveExerciseCompletion(data),
  getReminderPrefs: async () => localRepo.getReminderPrefs(),
  saveReminderPrefs: async (prefs) => localRepo.saveReminderPrefs(prefs),
};
