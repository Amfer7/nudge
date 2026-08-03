import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { localRepo } from "../lib/repo/localRepo";
import { supabaseRepo } from "../lib/repo/supabaseRepo";
import { setSyncSink } from "../lib/repo/syncedRepo";
import {
  getMyProfile,
  createProfile,
  ensureInviteCode,
  updateDenormalizedStreak,
  updateProfilePrefs,
} from "../lib/profiles";
import { computeState } from "../lib/streakEngine";
import { toDateKey } from "../utils/dateUtils.js";

// Chooses & wires the active data path based on auth state (plan.md 1e):
//   - signed out / unconfigured  → hooks stay on localStorage only.
//   - signed in                  → migrate local up, pull remote down, merge,
//                                   then install a write-through sink so every
//                                   local write also fans out to Supabase.
// After the initial pull we bump `remountKey`, which re-mounts the app subtree
// so the (untouched) hooks re-hydrate from the freshly-merged localStorage.
const SyncContext = createContext({
  status: "local", // "local" | "onboarding" | "syncing" | "synced" | "error"
  error: null,
  inviteCode: null,
  profile: null,
  completeOnboarding: async () => {},
});

// Recompute derived streak from the raw log and push the denormalized columns
// that power the leaderboard (without ever exposing the log itself).
async function pushDenormalizedStreak(records, restDays) {
  const state = computeState(records, restDays, new Date());
  await updateDenormalizedStreak({
    current_streak: state.currentStreak,
    longest_streak: state.longestStreak,
    last_logged_date: state.lastLoggedDate
      ? toDateKey(state.lastLoggedDate)
      : null,
  });
}

export function SyncProvider({ children }) {
  const { user, configured } = useAuth();
  const [status, setStatus] = useState("local");
  const [error, setError] = useState(null);
  const [inviteCode, setInviteCode] = useState(null);
  const [profile, setProfile] = useState(null);
  const [remountKey, setRemountKey] = useState(0);

  // Install the write-through sink + do the first-login merge. Extracted so the
  // onboarding path (which creates the profile first) can reuse it.
  async function activateSync(myProfile) {
    const localRecords = localRepo.getDayRecords();
    const remoteRecords = await supabaseRepo.getDayRecords();

    // Union the two logs; on a same-day conflict remote wins (last-write-wins is
    // approximated here — local has no per-day timestamp). Local-only days are
    // migrated up by pushing the merged set back.
    const merged = { ...localRecords, ...remoteRecords };
    await supabaseRepo.saveDayRecords(merged);
    localRepo.saveDayRecords(merged);

    // Prefs: if the profile has none yet, migrate local prefs up; otherwise the
    // remote prefs become the cache.
    let restDays;
    if (myProfile?.prefs && Array.isArray(myProfile.prefs.restDays)) {
      const remotePrefs = await supabaseRepo.getPrefs();
      localRepo.savePrefs(remotePrefs);
      restDays = remotePrefs.restDays;
    } else {
      const localPrefs = localRepo.getPrefs();
      await supabaseRepo.savePrefs(localPrefs);
      await updateProfilePrefs(localPrefs);
      restDays = localPrefs.restDays;
    }

    await pushDenormalizedStreak(merged, restDays);

    const code = await ensureInviteCode();
    setInviteCode(code);

    // Fan every subsequent local write out to Supabase in the background.
    setSyncSink({
      pushDayRecords: (records) => {
        const rd = localRepo.getPrefs().restDays;
        void supabaseRepo
          .saveDayRecords(records)
          .then(() => pushDenormalizedStreak(records, rd))
          .catch((e) => console.error("[sync] day push failed", e));
      },
      pushPrefs: (prefs) => {
        void Promise.all([
          supabaseRepo.savePrefs(prefs),
          updateProfilePrefs(prefs),
        ]).catch((e) => console.error("[sync] prefs push failed", e));
      },
    });

    setRemountKey((k) => k + 1);
  }

  useEffect(() => {
    // All state updates live inside this async IIFE (not the effect body) so we
    // synchronize with the external auth system without cascading renders.
    let cancelled = false;

    (async () => {
      if (!configured) {
        setStatus("local");
        return;
      }

      // Signed out: tear the sink down, go back to local-only.
      if (!user) {
        setSyncSink(null);
        setStatus("local");
        setInviteCode(null);
        setProfile(null);
        return;
      }

      setStatus("syncing");
      setError(null);
      try {
        const myProfile = await getMyProfile();
        if (cancelled) return;

        if (!myProfile) {
          // First sign-in with no profile yet → let the UI collect a username.
          setStatus("onboarding");
          return;
        }

        setProfile(myProfile);
        await activateSync(myProfile);
        if (cancelled) return;
        setStatus("synced");
      } catch (e) {
        console.error("[sync] activation failed", e);
        if (!cancelled) {
          setError(e);
          setStatus("error");
        }
      }
    })();

    // Invalidate any in-flight activation when auth changes again.
    return () => {
      cancelled = true;
    };
  }, [user, configured]);

  async function completeOnboarding(username) {
    setStatus("syncing");
    setError(null);
    try {
      const created = await createProfile(username);
      setProfile(created);
      await activateSync(created);
      setStatus("synced");
    } catch (e) {
      setError(e);
      setStatus("onboarding");
      throw e;
    }
  }

  const value = {
    status,
    error,
    inviteCode,
    profile,
    completeOnboarding,
  };

  return (
    <SyncContext.Provider value={value}>
      <div key={remountKey} style={{ display: "contents" }}>
        {children}
      </div>
    </SyncContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSync() {
  return useContext(SyncContext);
}
