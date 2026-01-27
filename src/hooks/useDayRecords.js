import { useEffect, useRef, useState } from "react";
import { toDateKey, isSunday } from "../utils/dateUtils";

const STORAGE_KEY = "fitness_day_records";

export function useDayRecords() {
  const [dayRecords, setDayRecords] = useState({});
  const [meta, setMeta] = useState({
    freezeCount: 0,
    lastFreezeEarnedOn: null,
  });
  const today = new Date();
  const todayKey = toDateKey(today);


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
      } else if (isSunday(cursor) || record?.status === "blocked") {
         // neutral day, no freeze spent
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
  }, [dayRecords, meta.freezeCount]);

  // --------------------
  // Freeze earning (2 days rule)
  // --------------------
  useEffect(() => {
    if (!hydrated.current) return;
    if (meta.freezeCount >= 3) return;

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayKey = toDateKey(today);
    const todayLogged = dayRecords[todayKey]?.status === "logged";
    const yesterdayStatus = dayRecords[yesterday]?.status;
    const yesterdayValid =
      yesterdayStatus === "logged" ||
      yesterdayStatus === "blocked" ||
      isSunday(yesterday);

    if (!todayLogged || !yesterdayValid) return;
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

  const todayStatus = dayRecords[todayKey]?.status ?? "none";

  function logToday() {
    setDayRecords((prev) => ({
      ...prev,
      [todayKey]: { status: "logged" },
    }));
  }

 function undoToday() {
    setDayRecords((prev) => ({
      ...prev,
      [todayKey]: { status: "blocked" },
    }));
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
      } else if (isSunday(cursor) || record?.status === "blocked") {
        // ok
      } else {
        break;
      }

      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
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
    const todayKey = toDateKey(new Date());
    if (key <= todayKey) return; // cannot unblock past/current days

    setDayRecords((prev) => {
      const copy = { ...prev };
      if (copy[key]?.status === "blocked") {
        delete copy[key];
      }
      return copy;
    });
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
    blockDates,
    unblockDate,
  };
}
