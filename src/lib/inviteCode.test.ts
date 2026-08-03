/// <reference types="node" />
import test from "node:test";
import assert from "node:assert/strict";
import { inviteUrl, mapRedeemError } from "./inviteCode.ts";

test("inviteUrl builds an /add/<code> URL from origin + code", () => {
  assert.equal(inviteUrl("https://nudge.app", "ABCD2345"), "https://nudge.app/add/ABCD2345");
});

test("inviteUrl does not double a trailing slash on origin", () => {
  assert.equal(inviteUrl("https://nudge.app/", "ABCD2345"), "https://nudge.app/add/ABCD2345");
});

test("mapRedeemError maps known PG codes to friendly copy", () => {
  assert.equal(mapRedeemError("P0002"), "That invite code doesn't exist.");
  assert.equal(mapRedeemError("P0001"), "You can't add yourself.");
  assert.equal(mapRedeemError("28000"), "Please sign in first.");
});

test("mapRedeemError falls back for unknown/undefined codes", () => {
  assert.equal(mapRedeemError(undefined), "Couldn't add that friend. Try again.");
  assert.equal(mapRedeemError("XXXXX"), "Couldn't add that friend. Try again.");
});
