import { useEffect, useState } from "react";
import { toDateKey } from "../utils/dateUtils.js";
import {
  computeState,
  resolveRestDays,
  hasSixConsecutiveLoggedDays,
  evaluateFreezeSpend,
} from "../lib/streakEngine";
import { repo } from "../lib/repo";

export function useDayRecords(restDays = [0]) {
  const resolvedRestDays = resolveRestDays(restDays);
  // Hydrate once via a lazy initializer (no set-state-in-effect); the repo owns
  // defensive parsing (stripping legacy freeze entries).
  const [dayRecords, setDayRecords] = useState(() => repo.getDayRecords());
  const [dayOffset, setDayOffset] = useState(0); // DEV time simulation

  function getToday() {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }

  useEffect(() => {
    repo.saveDayRecords(dayRecords);
  }, [dayRecords]);

  const today = getToday();
  const todayKey = toDateKey(today);
  const todayStatus = dayRecords[todayKey]?.status ?? "none";

  // Everything below is DERIVED from the raw log — no stored freeze state.
  // The React Compiler memoizes these; no manual useMemo (see CLAUDE.md).
  const state = computeState(dayRecords, restDays, today);

  // Source log + derived freezes, for the calendar's freeze rendering.
  const displayRecords = { ...dayRecords };
  for (const key of state.frozenDays) {
    displayRecords[key] = { status: "freeze" };
  }

  function logToday() {
    const key = toDateKey(getToday());
    setDayRecords((prev) => ({ ...prev, [key]: { status: "logged" } }));
  }

  function undoToday() {
    const key = toDateKey(getToday());
    setDayRecords((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function blockDates(dateKeys) {
    setDayRecords((prev) => {
      const next = { ...prev };
      dateKeys.forEach((key) => {
        if (!next[key]) {
          next[key] = { status: "blocked" };
        }
      });
      return next;
    });
  }

  function unblockDate(key) {
    const keyToday = toDateKey(getToday());
    if (key <= keyToday) return;

    setDayRecords((prev) => {
      const copy = { ...prev };
      if (copy[key]?.status === "blocked") {
        delete copy[key];
      }
      return copy;
    });
  }

  function resetProgress() {
    setDayRecords({});
    setDayOffset(0);
  }

  // DEV-only readouts.
  const eligibleForFreezeEarn =
    state.availableFreezes < 3 &&
    hasSixConsecutiveLoggedDays(dayRecords, today, resolvedRestDays);
  const freezeSpendCandidate = evaluateFreezeSpend(
    dayRecords,
    state.availableFreezes,
    today,
    resolvedRestDays
  );

  return {
    dayRecords,
    displayRecords,
    todayStatus,
    currentStreak: state.currentStreak,
    longestStreak: state.longestStreak,
    freezeCount: state.availableFreezes,
    frozenDays: state.frozenDays,
    logToday,
    undoToday,
    blockDates,
    unblockDate,
    resetProgress,
    dayOffset,
    setDayOffset,
    todayKey,
    devSummary: {
      todayStatus,
      currentStreak: state.currentStreak,
      freezeCount: state.availableFreezes,
      eligibleForFreezeEarn,
      freezeSpendCandidate,
    },
  };
}
