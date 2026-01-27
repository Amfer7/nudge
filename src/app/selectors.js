import { toDateKey, isSunday, daysBetween } from "../utils/dateUtils";

// 1. Has today been logged?
export function getTodayStatus(dayRecords, today) {
  const key = toDateKey(today);
  return dayRecords[key]?.status === "logged" ? "logged" : "empty";
}

// 2. Resolve missed days (freeze consumption)
export function resolveMissedDays(dayRecords, today) {
  const lastOpened = dayRecords.__lastOpened;
  if (!lastOpened) {
    return {
      ...dayRecords,
      __lastOpened: toDateKey(today),
    };
  }

  const missedDays = daysBetween(new Date(lastOpened), today);
  let updated = { ...dayRecords };

  for (const day of missedDays) {
    if (isSunday(day)) continue;

    const key = toDateKey(day);
    if (updated[key]) continue;

    const availableFreezes = getAvailableFreezes(updated);
    if (availableFreezes > 0) {
      updated[key] = { status: "freeze" };
    } else {
      // streak will naturally break via selector
      break;
    }
  }

  updated.__lastOpened = toDateKey(today);
  return updated;
}

// 3. Current streak
export function getCurrentStreak(dayRecords, today) {
  let streak = 0;
  let cursor = new Date(today);

  while (true) {
    const key = toDateKey(cursor);

    if (isSunday(cursor)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    const record = dayRecords[key];

    if (!record) break;
    if (record.status === "logged" || record.status === "freeze") {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }

    break;
  }

  return streak;
}

// 4. Available freezes
export function getAvailableFreezes(dayRecords) {
  let used = 0;
  let earned = 0;

  for (const key in dayRecords) {
    if (dayRecords[key]?.status === "freeze") used++;
  }

  // Count earned freezes (5 days in rolling 7, max 1 per week)
  const dates = Object.keys(dayRecords)
    .filter((k) => dayRecords[k]?.status === "logged")
    .sort();

  const weeks = new Set();

  for (let i = 0; i < dates.length; i++) {
    const window = dates.slice(i, i + 5);
    if (window.length < 5) continue;

    const first = new Date(window[0]);
    const last = new Date(window[4]);
    const diff = (last - first) / (1000 * 60 * 60 * 24);

    if (diff <= 6) {
      const weekKey = `${first.getFullYear()}-${first.getWeek?.() ?? first.getMonth()}`;
      if (!weeks.has(weekKey)) {
        weeks.add(weekKey);
        earned++;
      }
    }
  }

  return Math.max(0, Math.min(3, earned - used));
}
