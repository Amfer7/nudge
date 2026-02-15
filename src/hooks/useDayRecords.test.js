import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateStreak,
  evaluateFreezeSpend,
  hasSixConsecutiveLoggedDays,
} from "./useDayRecords.js";

function dateAtNoon(key) {
  return new Date(`${key}T12:00:00`);
}

test("default Sunday rest day is neutral when unlogged", () => {
  const records = {
    "2026-02-09": { status: "logged" }, // Monday
    "2026-02-07": { status: "logged" }, // Saturday
  };

  const streak = calculateStreak(records, dateAtNoon("2026-02-09"), [0]);
  assert.equal(streak, 2);
});

test("logged Sunday still increases streak count", () => {
  const records = {
    "2026-02-09": { status: "logged" }, // Monday
    "2026-02-08": { status: "logged" }, // Sunday
    "2026-02-07": { status: "logged" }, // Saturday
  };

  const streak = calculateStreak(records, dateAtNoon("2026-02-09"), [0]);
  assert.equal(streak, 3);
});

test("custom rest day is neutral for streak continuity", () => {
  const records = {
    "2026-02-12": { status: "logged" }, // Thursday
    "2026-02-10": { status: "logged" }, // Tuesday
  };

  const streak = calculateStreak(records, dateAtNoon("2026-02-12"), [3]); // Wednesday rest day
  assert.equal(streak, 2);
});

test("six consecutive logged days can pass through rest days", () => {
  const records = {
    "2026-02-16": { status: "logged" }, // Monday
    "2026-02-15": { status: "logged" }, // Sunday
    "2026-02-14": { status: "logged" }, // Saturday
    "2026-02-13": { status: "logged" }, // Friday
    "2026-02-11": { status: "logged" }, // Wednesday
    "2026-02-10": { status: "logged" }, // Tuesday
  };

  const eligible = hasSixConsecutiveLoggedDays(records, dateAtNoon("2026-02-16"), [4]); // Thursday rest day
  assert.equal(eligible, true);
});

test("freeze spend skips rest and blocked days and targets nearest real miss", () => {
  const records = {
    "2026-02-09": { status: "logged" }, // Monday
    "2026-02-08": { status: "blocked" }, // Sunday
    // 2026-02-07 missing (Saturday rest day)
    // 2026-02-10 missing (Tuesday real miss, nearest)
  };

  const freezeDay = evaluateFreezeSpend(records, 1, dateAtNoon("2026-02-11"), [6]); // Saturday rest day
  assert.equal(freezeDay, "2026-02-10");
});
