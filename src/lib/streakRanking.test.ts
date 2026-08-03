/// <reference types="node" />
import test from "node:test";
import assert from "node:assert/strict";
import { rankStreaks } from "./streakRanking.ts";

const me = { id: "me", username: "amfer", current_streak: 5 };
const friend = (id: string, username: string, current_streak: number) => ({
  id,
  username,
  display_name: null,
  avatar_url: null,
  current_streak,
});

test("ranks me + friends by current_streak descending", () => {
  const rows = rankStreaks(me, [friend("a", "alice", 9), friend("b", "bob", 2)]);
  assert.deepEqual(
    rows.map((r) => r.username),
    ["alice", "amfer", "bob"],
  );
});

test("flags exactly the caller's own row with isMe", () => {
  const rows = rankStreaks(me, [friend("a", "alice", 9)]);
  assert.deepEqual(
    rows.map((r) => [r.username, r.isMe]),
    [
      ["alice", false],
      ["amfer", true],
    ],
  );
});

test("breaks ties by username ascending for a stable order", () => {
  const rows = rankStreaks(me, [friend("z", "zoe", 5), friend("a", "aaron", 5)]);
  assert.deepEqual(
    rows.map((r) => r.username),
    ["aaron", "amfer", "zoe"],
  );
});

test("returns just the friends, sorted, when there is no me", () => {
  const rows = rankStreaks(null, [friend("a", "alice", 1), friend("b", "bob", 4)]);
  assert.deepEqual(
    rows.map((r) => [r.username, r.isMe]),
    [
      ["bob", false],
      ["alice", false],
    ],
  );
});
