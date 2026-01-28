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
  const processingRef = useRef(false); // Prevent concurrent updates

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
  // Freeze spending (auto) - DISABLED temporarily to debug
  // We'll re-enable this once the basic logging works
  // --------------------
  // useEffect(() => {
  //   if (!hydrated.current || processingRef.current) return;

  //   let freezesLeft = meta.freezeCount;
  //   const updates = {};
  //   let cursor = new Date();

  //   while (true) {
  //     const key = toDateKey(cursor);
  //     const record = dayRecords[key];

  //     if (record?.status === "logged" || record?.status === "freeze") {
  //       // ok
  //     } else if (isSunday(cursor) || record?.status === "blocked") {
  //        // neutral day, no freeze spent
  //     } else if (freezesLeft > 0 && !record) {
  //       // Only spend freeze if no record exists
  //       freezesLeft--;
  //       updates[key] = { status: "freeze" };
  //     } else {
  //       break;
  //     }

  //     cursor.setDate(cursor.getDate() - 1);
  //   }

  //   if (Object.keys(updates).length > 0) {
  //     processingRef.current = true;
  //     setDayRecords((prev) => ({ ...prev, ...updates }));
  //     setMeta((prev) => ({ ...prev, freezeCount: freezesLeft }));
  //     setTimeout(() => { processingRef.current = false; }, 0);
  //   }
  // }, [dayRecords, meta.freezeCount]);

  // --------------------
  // Freeze earning (2 days rule)
  // --------------------
  function hasTwoLoggedDays(records) {
    let count = 0;
    let cursor = new Date();

    while (count < 2) {
      const key = toDateKey(cursor);
      const record = records[key];

      if (record?.status === "logged") {
        count++;
      } else if (
        record?.status === "blocked" ||
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

  useEffect(() => {
    if (!hydrated.current) return;
    if (meta.freezeCount >= 3) return;

    const todayKey = toDateKey(new Date());
    if (meta.lastFreezeEarnedOn === todayKey) return;

    const hasTwo = hasTwoLoggedDays(dayRecords);
    console.log('Freeze check:', { hasTwo, todayKey, lastFreezeEarnedOn: meta.lastFreezeEarnedOn, records: dayRecords });

    if (!hasTwo) return;

    setMeta((prev) => ({
      ...prev,
      freezeCount: prev.freezeCount + 1,
      lastFreezeEarnedOn: todayKey,
    }));
  }, [dayRecords, meta.freezeCount, meta.lastFreezeEarnedOn]);

  // --------------------
  // Today helpers
  // --------------------

  const todayStatus = dayRecords[todayKey]?.status ?? "none";

  function logToday() {
    console.log('logToday called, todayKey:', todayKey);
    setDayRecords((prev) => {
      console.log('prev state:', prev);
      const next = {
        ...prev,
        [todayKey]: { status: "logged" },
      };
      console.log('Setting dayRecords to:', next);
      return next;
    });
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

    const todayKey = toDateKey(cursor);
    if (!records[todayKey]) {
      cursor.setDate(cursor.getDate() - 1);
    }

    while (true) {
      const key = toDateKey(cursor);
      const record = records[key];

      if (record?.status === "logged") {
        streak++;
      } else if (
        record?.status === "blocked" ||
        isSunday(cursor)
      ) {
        // neutral day, do not increment
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

  // // --------------------
  // // TEST HELPER
  // // --------------------
  // function logDate(dateKey) {
  //   console.log('logDate called with:', dateKey);
  //   setDayRecords((prev) => {
  //     const next = {
  //       ...prev,
  //       [dateKey]: { status: "logged" },
  //     };
  //     console.log('Setting dayRecords to:', next);
  //     return next;
  //   });
  // }

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
    //logDate, // TEST HELPER
  };
}