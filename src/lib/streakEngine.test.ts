/// <reference types="node" />
import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateStreak,
  computeState,
  evaluateFreezeSpend,
  hasSixConsecutiveLoggedDays,
  type DayRecords,
} from "./streakEngine.ts";

function dateAtNoon(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

// ---- ported from the original useDayRecords tests ----

test("default Sunday rest day is neutral when unlogged", () => {
  const records = {
    "2026-02-09": { status: "logged" }, // Monday
    "2026-02-07": { status: "logged" }, // Saturday
  } as const;

  assert.equal(calculateStreak(records, dateAtNoon("2026-02-09"), [0]), 2);
});

test("logged Sunday still increases streak count", () => {
  const records = {
    "2026-02-09": { status: "logged" }, // Monday
    "2026-02-08": { status: "logged" }, // Sunday
    "2026-02-07": { status: "logged" }, // Saturday
  } as const;

  assert.equal(calculateStreak(records, dateAtNoon("2026-02-09"), [0]), 3);
});

test("custom rest day is neutral for streak continuity", () => {
  const records = {
    "2026-02-12": { status: "logged" }, // Thursday
    "2026-02-10": { status: "logged" }, // Tuesday
  } as const;

  assert.equal(calculateStreak(records, dateAtNoon("2026-02-12"), [3]), 2);
});

test("six consecutive logged days can pass through rest days", () => {
  const records = {
    "2026-02-16": { status: "logged" }, // Monday
    "2026-02-15": { status: "logged" }, // Sunday
    "2026-02-14": { status: "logged" }, // Saturday
    "2026-02-13": { status: "logged" }, // Friday
    "2026-02-11": { status: "logged" }, // Wednesday
    "2026-02-10": { status: "logged" }, // Tuesday
  } as const;

  assert.equal(
    hasSixConsecutiveLoggedDays(records, dateAtNoon("2026-02-16"), [4]),
    true
  );
});

test("freeze spend skips rest and blocked days and targets nearest real miss", () => {
  const records = {
    "2026-02-09": { status: "logged" }, // Monday
    "2026-02-08": { status: "blocked" }, // Sunday
  } as const;

  assert.equal(
    evaluateFreezeSpend(records, 1, dateAtNoon("2026-02-11"), [6]),
    "2026-02-10"
  );
});

// ---- new computeState (derived-freeze) tests ----

test("computeState on an empty log is all zeros", () => {
  const state = computeState({}, [0], dateAtNoon("2026-02-16"));
  assert.equal(state.currentStreak, 0);
  assert.equal(state.longestStreak, 0);
  assert.equal(state.availableFreezes, 0);
  assert.equal(state.frozenDays.size, 0);
  assert.equal(state.lastLoggedDate, null);
});

test("computeState counts a simple streak with no freezes earned", () => {
  const records: DayRecords = {
    "2026-02-09": { status: "logged" }, // Mon
    "2026-02-10": { status: "logged" }, // Tue
    "2026-02-11": { status: "logged" }, // Wed
  };
  const state = computeState(records, [0], dateAtNoon("2026-02-11"));
  assert.equal(state.currentStreak, 3);
  assert.equal(state.longestStreak, 3);
  assert.equal(state.availableFreezes, 0);
  assert.equal(state.lastLoggedDate, "2026-02-11");
});

test("computeState earns one freeze after six consecutive logged days", () => {
  const records: DayRecords = {
    "2026-02-09": { status: "logged" }, // Mon
    "2026-02-10": { status: "logged" }, // Tue
    "2026-02-11": { status: "logged" }, // Wed
    "2026-02-12": { status: "logged" }, // Thu
    "2026-02-13": { status: "logged" }, // Fri
    "2026-02-14": { status: "logged" }, // Sat
  };
  const state = computeState(records, [0], dateAtNoon("2026-02-14"));
  assert.equal(state.currentStreak, 6);
  assert.equal(state.availableFreezes, 1);
  assert.equal(state.frozenDays.size, 0);
});

test("computeState auto-spends an earned freeze on a later real miss", () => {
  const records: DayRecords = {
    "2026-02-09": { status: "logged" },
    "2026-02-10": { status: "logged" },
    "2026-02-11": { status: "logged" },
    "2026-02-12": { status: "logged" },
    "2026-02-13": { status: "logged" },
    "2026-02-14": { status: "logged" }, // earns a freeze here
    // 2026-02-15 Sunday rest (neutral)
    // 2026-02-16 Monday MISSED -> freeze should cover it
  };
  const state = computeState(records, [0], dateAtNoon("2026-02-17"));
  assert.equal(state.availableFreezes, 0);
  assert.equal(state.frozenDays.has("2026-02-16"), true);
  assert.equal(state.currentStreak, 6); // preserved across the frozen miss
});

test("computeState ignores pre-existing freeze records and re-derives them", () => {
  const base: DayRecords = {
    "2026-02-09": { status: "logged" },
    "2026-02-10": { status: "logged" },
    "2026-02-11": { status: "logged" },
    "2026-02-12": { status: "logged" },
    "2026-02-13": { status: "logged" },
    "2026-02-14": { status: "logged" },
  };
  const withLegacyFreeze: DayRecords = {
    ...base,
    "2026-02-16": { status: "freeze" },
  };

  const a = computeState(base, [0], dateAtNoon("2026-02-17"));
  const b = computeState(withLegacyFreeze, [0], dateAtNoon("2026-02-17"));

  assert.equal(a.availableFreezes, b.availableFreezes);
  assert.equal(a.currentStreak, b.currentStreak);
  assert.deepEqual([...a.frozenDays].sort(), [...b.frozenDays].sort());
});
