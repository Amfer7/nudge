import { useEffect, useRef, useState } from "react";
import { toDateKey, isRestDay } from "../utils/dateUtils.js";

const STORAGE_KEY = "fitness_day_records";

function resolveRestDays(restDays = [0]) {
  if (!Array.isArray(restDays) || restDays.length === 0) {
    return [0];
  }

  const normalized = [...new Set(
    restDays
      .map((d) => Number(d))
      .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
  )].sort((a, b) => a - b);

  return normalized.length > 0 ? normalized : [0];
}

export function hasSixConsecutiveLoggedDays(records, today, restDays = [0]) {
  const resolvedRestDays = resolveRestDays(restDays);
  let count = 0;
  let cursor = new Date(today);

  while (count < 6) {
    const key = toDateKey(cursor);
    const record = records[key];

    if (record?.status === "logged") {
      count++;
    } else if (isRestDay(cursor, resolvedRestDays)) {
      // neutral
    } else {
      return false;
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return true;
}

export function evaluateFreezeSpend(records, availableFreezes, today, restDays = [0]) {
  if (availableFreezes <= 0) return null;

  const resolvedRestDays = resolveRestDays(restDays);
  let cursor = new Date(today);
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

    if (record?.status === "blocked" || isRestDay(cursor, resolvedRestDays)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    // Real miss: spend one freeze for this missed day.
    return key;
  }

  return null;
}

export function calculateStreak(records, today, restDays = [0]) {
  const resolvedRestDays = resolveRestDays(restDays);
  let streak = 0;
  let cursor = new Date(today);

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
    } else if (record?.status === "blocked" || isRestDay(cursor, resolvedRestDays)) {
      // neutral
    } else {
      break;
    }

    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function dayDiffFromKeys(olderKey, newerKey) {
  if (!olderKey || !newerKey) return Infinity;
  const older = new Date(`${olderKey}T00:00:00`);
  const newer = new Date(`${newerKey}T00:00:00`);
  return Math.floor((newer - older) / (1000 * 60 * 60 * 24));
}

export function useDayRecords(restDays = [0]) {
  const resolvedRestDays = resolveRestDays(restDays);
  const [dayRecords, setDayRecords] = useState({});
  const [meta, setMeta] = useState({
    freezeCount: 0,
    lastFreezeEarnedOn: null,
  });

  const [dayOffset, setDayOffset] = useState(0); // DEV time simulation
  const hydrated = useRef(false);

  function getToday() {
    const d = new Date();
    d.setDate(d.getDate() + dayOffset);
    return d;
  }

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setDayRecords(parsed.dayRecords ?? {});
      setMeta(parsed.meta ?? { freezeCount: 0, lastFreezeEarnedOn: null });
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dayRecords, meta })
    );
  }, [dayRecords, meta]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (meta.freezeCount >= 3) return;

    const today = getToday();
    const todayKey = toDateKey(today);
    if (meta.lastFreezeEarnedOn) {
      const daysSinceLastEarn = dayDiffFromKeys(meta.lastFreezeEarnedOn, todayKey);
      if (daysSinceLastEarn < 7) return;
    }

    if (!hasSixConsecutiveLoggedDays(dayRecords, today, resolvedRestDays)) return;

    setMeta((prev) => ({
      ...prev,
      freezeCount: prev.freezeCount + 1,
      lastFreezeEarnedOn: todayKey,
    }));
  }, [dayRecords, dayOffset, meta.freezeCount, meta.lastFreezeEarnedOn, resolvedRestDays]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (meta.freezeCount <= 0) return;

    const freezeDay = evaluateFreezeSpend(
      dayRecords,
      meta.freezeCount,
      getToday(),
      resolvedRestDays
    );

    if (!freezeDay) return;
    if (dayRecords[freezeDay]?.status === "freeze") return;

    setDayRecords((prev) => ({
      ...prev,
      [freezeDay]: { status: "freeze" },
    }));

    setMeta((prev) => ({
      ...prev,
      freezeCount: prev.freezeCount - 1,
    }));
  }, [dayRecords, meta.freezeCount, dayOffset, resolvedRestDays]);

  const today = getToday();
  const todayKey = toDateKey(today);
  const todayStatus = dayRecords[todayKey]?.status ?? "none";

  function logToday() {
    const key = toDateKey(getToday());
    setDayRecords((prev) => ({
      ...prev,
      [key]: { status: "logged" },
    }));
  }

  function undoToday() {
    const key = toDateKey(getToday());
    setDayRecords((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    setMeta((prev) => {
      if (prev.lastFreezeEarnedOn !== key) return prev;
      return {
        ...prev,
        freezeCount: Math.max(0, prev.freezeCount - 1),
        lastFreezeEarnedOn: null,
      };
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
    setMeta({
      freezeCount: 0,
      lastFreezeEarnedOn: null,
    });
    setDayOffset(0);
  }

  const currentStreak = calculateStreak(dayRecords, today, resolvedRestDays);
  const freezeSpendCandidate = evaluateFreezeSpend(
    dayRecords,
    meta.freezeCount,
    today,
    resolvedRestDays
  );
  const daysSinceLastEarn = meta.lastFreezeEarnedOn
    ? dayDiffFromKeys(meta.lastFreezeEarnedOn, todayKey)
    : Infinity;
  const eligibleForFreezeEarn =
    meta.freezeCount < 3 &&
    daysSinceLastEarn >= 7 &&
    hasSixConsecutiveLoggedDays(dayRecords, today, resolvedRestDays);

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
