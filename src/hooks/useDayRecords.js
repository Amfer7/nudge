import { useEffect, useRef, useState } from "react";
import { toDateKey, isSunday } from "../utils/dateUtils";

const STORAGE_KEY = "fitness_day_records";

export function useDayRecords() {
  const [dayRecords, setDayRecords] = useState({});
  const [meta, setMeta] = useState({
    freezeCount: 0,
    lastFreezeEarnedOn: null,
  });

  const [dayOffset, setDayOffset] = useState(0); // DEV time simulation
  const hydrated = useRef(false);

  // --------------------
  // Time helper
  // --------------------
  function getToday() {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }

  // --------------------
  // Load once
  // --------------------
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setDayRecords(parsed.dayRecords ?? {});
      setMeta(parsed.meta ?? { freezeCount: 0, lastFreezeEarnedOn: null });
    }
    hydrated.current = true;
  }, []);

  // --------------------
  // Persist
  // --------------------
  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dayRecords, meta })
    );
  }, [dayRecords, meta]);

  // --------------------
  // Freeze earning (6 consecutive logged days rule)
  // --------------------
  function hasSixConsecutiveLoggedDays(records) {
    let count = 0;
    let cursor = getToday();

    while (count < 6) {
      const key = toDateKey(cursor);
      const record = records[key];

      if (record?.status === "logged") {
        count++;
      } else if (
        isSunday(cursor)
      ) {
        // neutral
      } else {
        return false;
      }

      cursor.setDate(cursor.getDate() - 1);
    }

    return true;
  }

  function dayDiffFromKeys(olderKey, newerKey) {
    if (!olderKey || !newerKey) return Infinity;
    const older = new Date(`${olderKey}T00:00:00`);
    const newer = new Date(`${newerKey}T00:00:00`);
    return Math.floor((newer - older) / (1000 * 60 * 60 * 24));
  }

  useEffect(() => {
    if (!hydrated.current) return;
    if (meta.freezeCount >= 3) return;

    const todayKey = toDateKey(getToday());
    if (meta.lastFreezeEarnedOn) {
      const daysSinceLastEarn = dayDiffFromKeys(meta.lastFreezeEarnedOn, todayKey);
      if (daysSinceLastEarn < 7) return;
    }

    if (!hasSixConsecutiveLoggedDays(dayRecords)) return;

    setMeta(prev => ({
      ...prev,
      freezeCount: prev.freezeCount + 1,
      lastFreezeEarnedOn: todayKey,
    }));
  }, [dayRecords, dayOffset, meta.freezeCount, meta.lastFreezeEarnedOn]);

  // --------------------
  // Freeze spending
  // --------------------
  function evaluateFreezeSpend(records, availableFreezes) {
    if (availableFreezes <= 0) return null;

    let cursor = getToday();
    const currentKey = toDateKey(cursor);
    if (!records[currentKey]) {
      cursor.setDate(cursor.getDate() - 1);
    }
    while (true) {
      const key = toDateKey(cursor);
      const record = records[key];

      if (record?.status === "logged" || record?.status === "freeze") {
        break;
      }

      if (record?.status === "blocked" || isSunday(cursor)) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }

      // Real miss: spend one freeze for this missed day
      return key;
    }

    return null;
  }

  useEffect(() => {
    if (!hydrated.current) return;
    if (meta.freezeCount <= 0) return;

    const freezeDay = evaluateFreezeSpend(
      dayRecords,
      meta.freezeCount
    );

    if (!freezeDay) return;

    if (dayRecords[freezeDay]?.status === "freeze") return;

    setDayRecords(prev => ({
      ...prev,
      [freezeDay]: { status: "freeze" }
    }));

    setMeta(prev => ({
      ...prev,
      freezeCount: prev.freezeCount - 1
    }));

  }, [dayRecords, meta.freezeCount, dayOffset]);

  // --------------------
  // Today helpers
  // --------------------
  const today = getToday();
  const todayKey = toDateKey(today);
  const todayStatus = dayRecords[todayKey]?.status ?? "none";

  function logToday() {
    setDayRecords(prev => ({
      ...prev,
      [todayKey]: { status: "logged" },
    }));
  }

  function undoToday() {
    setDayRecords(prev => {
      const next = { ...prev };
      delete next[todayKey];
      return next;
    });

    setMeta(prev => {
      if (prev.lastFreezeEarnedOn !== todayKey) return prev;
      return {
        ...prev,
        freezeCount: Math.max(0, prev.freezeCount - 1),
        lastFreezeEarnedOn: null,
      };
    });
  }

  // --------------------
  // Streak calculation (GYM streak)
  // --------------------
  function calculateStreak(records) {
    let streak = 0;
    let cursor = getToday();

    const todayKey = toDateKey(cursor);
    if (!records[todayKey]) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (true) {
      const key = toDateKey(cursor);
      const record = records[key];

      if (record?.status === "logged") {
        streak++;
      } else if (record?.status === "freeze") {
        // freeze preserves streak for the day but does not increase it
      } else if (
        record?.status === "blocked" ||
        isSunday(cursor)
      ) {
        // neutral
      } else {
        break;
      }

      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  // --------------------
  // Block helpers
  // --------------------
  function blockDates(dateKeys) {
    setDayRecords(prev => {
      const next = { ...prev };
      dateKeys.forEach(key => {
        if (!next[key]) {
          next[key] = { status: "blocked" };
        }
      });
      return next;
    });
  }

  function unblockDate(key) {
    const todayKey = toDateKey(getToday());
    if (key <= todayKey) return;

    setDayRecords(prev => {
      const copy = { ...prev };
      if (copy[key]?.status === "blocked") {
        delete copy[key];
      }
      return copy;
    });
  }

  function resetProgress() {
    setDayRecords({});
    setMeta({
      freezeCount: 0,
      lastFreezeEarnedOn: null,
    });
    setDayOffset(0);
  }

  const currentStreak = calculateStreak(dayRecords);
  const freezeSpendCandidate = evaluateFreezeSpend(dayRecords, meta.freezeCount);
  const daysSinceLastEarn = meta.lastFreezeEarnedOn
    ? dayDiffFromKeys(meta.lastFreezeEarnedOn, todayKey)
    : Infinity;
  const eligibleForFreezeEarn =
    meta.freezeCount < 3 &&
    daysSinceLastEarn >= 7 &&
    hasSixConsecutiveLoggedDays(dayRecords);

  // --------------------
  // Public API
  // --------------------
  return {
    dayRecords,
    todayStatus,
    currentStreak,
    freezeCount: meta.freezeCount,
    logToday,
    undoToday,
    blockDates,
    unblockDate,
    resetProgress,

    // DEV
    dayOffset,
    setDayOffset,
    todayKey,
    devSummary: {
      todayStatus,
      currentStreak,
      freezeCount: meta.freezeCount,
      eligibleForFreezeEarn,
      freezeSpendCandidate,
      daysSinceLastEarn,
    },
  };
}
