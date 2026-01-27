import { useEffect, useRef, useState } from "react";
import { toDateKey, isSunday } from "../utils/dateUtils";

const STORAGE_KEY = "fitness_day_records";

export function useDayRecords() {
  const [dayRecords, setDayRecords] = useState({});
  const [meta, setMeta] = useState({
    freezeCount: 0,
    lastFreezeEarnedOn: null,
  });

  const hydrated = useRef(false);

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
  // Persist state
  // --------------------
  useEffect(() => {
    if (!hydrated.current) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dayRecords, meta })
    );
  }, [dayRecords, meta]);

  // --------------------
  // Freeze spending (auto)
  // --------------------
  useEffect(() => {
    if (!hydrated.current) return;

    let freezesLeft = meta.freezeCount;
    const updates = {};
    let cursor = new Date();

    while (true) {
      const key = toDateKey(cursor);
      const record = dayRecords[key];

      if (record?.status === "logged" || record?.status === "freeze") {
        // ok
      } else if (isSunday(cursor)) {
        // Sundays never consume freezes
      } else if (freezesLeft > 0) {
        freezesLeft--;
        updates[key] = { status: "freeze" };
      } else {
        break;
      }

      cursor.setDate(cursor.getDate() - 1);
    }

    if (Object.keys(updates).length > 0) {
      setDayRecords((prev) => ({ ...prev, ...updates }));
      setMeta((prev) => ({ ...prev, freezeCount: freezesLeft }));
    }
  }, [dayRecords]);

  // --------------------
  // Freeze earning (2 days rule)
  // --------------------
  useEffect(() => {
    if (!hydrated.current) return;
    if (meta.freezeCount >= 3) return;

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayKey = toDateKey(today);
    const yesterdayKey = toDateKey(yesterday);

    const todayLogged = dayRecords[todayKey]?.status === "logged";
    const yesterdayLogged =
      dayRecords[yesterdayKey]?.status === "logged" || isSunday(yesterday);

    if (!todayLogged || !yesterdayLogged) return;
    if (meta.lastFreezeEarnedOn === todayKey) return;

    setMeta((prev) => ({
      ...prev,
      freezeCount: Math.min(prev.freezeCount + 1, 3),
      lastFreezeEarnedOn: todayKey,
    }));
  }, [dayRecords, meta.freezeCount]);

  // --------------------
  // Today helpers
  // --------------------
  const today = new Date();
  const todayKey = toDateKey(today);
  const todayStatus = dayRecords[todayKey]?.status ?? "none";

  function logToday() {
    setDayRecords((prev) => ({
      ...prev,
      [todayKey]: { status: "logged" },
    }));
  }

  function undoToday() {
    setDayRecords((prev) => {
      const copy = { ...prev };
      delete copy[todayKey];
      return copy;
    });
  }

  // --------------------
  // Pure streak calculation
  // --------------------
  function calculateStreak(records) {
    let streak = 0;
    let cursor = new Date();

    while (true) {
      const key = toDateKey(cursor);
      const record = records[key];

      if (record?.status === "logged" || record?.status === "freeze") {
        streak++;
      } else if (isSunday(cursor)) {
        // ok
      } else {
        break;
      }

      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }

  const currentStreak = calculateStreak(dayRecords);

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
  };
}
