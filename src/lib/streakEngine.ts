// Pure, framework-agnostic streak + freeze engine.
//
// Single source of truth: the user's raw log of `logged` / `blocked` days.
// Streak, earned/available freezes, and which days are "frozen" are all DERIVED
// from that log + the rest-day config + the current date. Nothing here is stored.
//
// This module is intentionally free of React so it can be reused verbatim on the
// server (e.g. a nightly leaderboard recompute) as well as in the client hooks.

import { toDateKey, isRestDay } from "../utils/dateUtils.js";

export type DateKey = string; // "YYYY-MM-DD" in local time
export type DayStatus = "logged" | "blocked" | "freeze";
export interface DayRecord {
  status: DayStatus;
}
export type DayRecords = Record<string, DayRecord | undefined>;

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  availableFreezes: number;
  frozenDays: Set<DateKey>;
  lastLoggedDate: DateKey | null;
}

// Rules (kept as named constants so the server and client can't drift).
const MAX_FREEZES = 3;
const EARN_INTERVAL_DAYS = 7; // at most one earned freeze per rolling 7 days
const CONSECUTIVE_FOR_EARN = 6; // six logged days (rest days neutral) earns a freeze

export function resolveRestDays(restDays: number[] = [0]): number[] {
  if (!Array.isArray(restDays) || restDays.length === 0) {
    return [0];
  }
  const normalized = [
    ...new Set(
      restDays
        .map((d) => Number(d))
        .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    ),
  ].sort((a, b) => a - b);
  return normalized.length > 0 ? normalized : [0];
}

// Walk back from `today`: six logged days (rest days neutral, any other gap fails).
export function hasSixConsecutiveLoggedDays(
  records: DayRecords,
  today: Date,
  restDays: number[] = [0]
): boolean {
  const resolved = resolveRestDays(restDays);
  let count = 0;
  const cursor = new Date(today);

  while (count < CONSECUTIVE_FOR_EARN) {
    const record = records[toDateKey(cursor)];
    if (record?.status === "logged") {
      count++;
    } else if (isRestDay(cursor, resolved)) {
      // neutral
    } else {
      return false;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return true;
}

// Nearest past "real miss" (non-rest, non-blocked, unlogged) a freeze should cover,
// walking back from today and stopping at the most recent activity.
export function evaluateFreezeSpend(
  records: DayRecords,
  availableFreezes: number,
  today: Date,
  restDays: number[] = [0]
): DateKey | null {
  if (availableFreezes <= 0) return null;

  const resolved = resolveRestDays(restDays);
  const cursor = new Date(today);
  if (!records[toDateKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const record = records[toDateKey(cursor)];

    if (record?.status === "logged" || record?.status === "freeze") {
      break;
    }
    if (record?.status === "blocked" || isRestDay(cursor, resolved)) {
      cursor.setDate(cursor.getDate() - 1);
      continue;
    }
    // Real miss.
    return toDateKey(cursor);
  }
  return null;
}

// Streak walking back from today: logged +1; freeze/blocked/rest neutral; else break.
// An unlogged *today* is skipped so the streak holds until a day is actually missed.
export function calculateStreak(
  records: DayRecords,
  today: Date,
  restDays: number[] = [0]
): number {
  const resolved = resolveRestDays(restDays);
  let streak = 0;
  const cursor = new Date(today);

  if (!records[toDateKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const record = records[toDateKey(cursor)];

    if (record?.status === "logged") {
      streak++;
    } else if (record?.status === "freeze") {
      // preserves the streak for the day but does not increase it
    } else if (record?.status === "blocked" || isRestDay(cursor, resolved)) {
      // neutral
    } else {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function diffDays(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

// Anchor a date key at local noon to avoid DST/timezone edges while iterating.
function atNoon(key: DateKey): Date {
  return new Date(`${key}T12:00:00`);
}

function computeLongestStreak(
  effective: DayRecords,
  startKey: DateKey,
  todayKey: DateKey,
  resolved: number[]
): number {
  const cursor = atNoon(startKey);
  const end = atNoon(todayKey);
  let run = 0;
  let longest = 0;

  while (cursor <= end) {
    const key = toDateKey(cursor);
    const status = effective[key]?.status;

    if (status === "logged") {
      run++;
      if (run > longest) longest = run;
    } else if (
      status === "freeze" ||
      status === "blocked" ||
      isRestDay(cursor, resolved)
    ) {
      // neutral: the streak run continues
    } else if (key !== todayKey) {
      run = 0; // a real miss breaks the run
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return longest;
}

// Derive the full streak/freeze state from the raw log by replaying history
// chronologically. Only `logged` / `blocked` entries are treated as source of
// truth; any pre-existing `freeze` entries are ignored and re-derived.
export function computeState(
  records: DayRecords,
  restDays: number[],
  today: Date
): StreakState {
  const resolved = resolveRestDays(restDays);
  const todayKey = toDateKey(today);

  const sourceKeys = Object.keys(records)
    .filter((k) => {
      const s = records[k]?.status;
      return s === "logged" || s === "blocked";
    })
    .sort();

  if (sourceKeys.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      availableFreezes: 0,
      frozenDays: new Set<DateKey>(),
      lastLoggedDate: null,
    };
  }

  const frozenDays = new Set<DateKey>();
  let available = 0;
  let lastEarn: Date | null = null;

  const cursor = atNoon(sourceKeys[0]);
  const end = atNoon(todayKey);

  while (cursor <= end) {
    const key = toDateKey(cursor);
    const status = records[key]?.status;
    const isToday = key === todayKey;

    if (status === "logged") {
      if (available < MAX_FREEZES) {
        const gapOk = !lastEarn || diffDays(lastEarn, cursor) >= EARN_INTERVAL_DAYS;
        if (gapOk && hasSixConsecutiveLoggedDays(records, cursor, resolved)) {
          available += 1;
          lastEarn = new Date(cursor);
        }
      }
    } else if (status === "blocked" || isRestDay(cursor, resolved)) {
      // neutral
    } else if (!isToday) {
      // A real miss in the past: spend a freeze if we have one, else the streak breaks.
      if (available > 0) {
        available -= 1;
        frozenDays.add(key);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  // Effective records = source log + derived freezes; reuse calculateStreak for parity.
  const effective: DayRecords = {};
  for (const k of sourceKeys) effective[k] = records[k];
  for (const k of frozenDays) effective[k] = { status: "freeze" };

  let lastLoggedDate: DateKey | null = null;
  for (const k of sourceKeys) {
    if (records[k]?.status === "logged") lastLoggedDate = k;
  }

  return {
    currentStreak: calculateStreak(effective, today, resolved),
    longestStreak: computeLongestStreak(effective, sourceKeys[0], todayKey, resolved),
    availableFreezes: available,
    frozenDays,
    lastLoggedDate,
  };
}
