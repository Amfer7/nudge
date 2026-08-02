/// <reference types="node" />
import test from "node:test";
import assert from "node:assert/strict";
import { msUntilNextDaily } from "./notifications.ts";

test("msUntilNextDaily targets later the same day when the hour is still ahead", () => {
  const now = new Date("2026-02-09T08:00:00");
  // 19:00 today is 11 hours away.
  assert.equal(msUntilNextDaily(19, now), 11 * 60 * 60 * 1000);
});

test("msUntilNextDaily rolls to tomorrow when the hour has already passed", () => {
  const now = new Date("2026-02-09T20:30:00");
  // 19:00 today has passed → 19:00 tomorrow is 22.5 hours away.
  assert.equal(msUntilNextDaily(19, now), 22.5 * 60 * 60 * 1000);
});

test("msUntilNextDaily rolls to tomorrow when exactly at the target hour", () => {
  const now = new Date("2026-02-09T19:00:00");
  assert.equal(msUntilNextDaily(19, now), 24 * 60 * 60 * 1000);
});
