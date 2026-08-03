/// <reference types="node" />
import test from "node:test";
import assert from "node:assert/strict";
import {
  setPendingInvite,
  getPendingInvite,
  clearPendingInvite,
} from "./pendingInvite.ts";

function fakeStore() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => (m.has(k) ? m.get(k)! : null),
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

test("get returns null when nothing is stored", () => {
  assert.equal(getPendingInvite(fakeStore()), null);
});

test("set then get round-trips the code", () => {
  const s = fakeStore();
  setPendingInvite("ABCD2345", s);
  assert.equal(getPendingInvite(s), "ABCD2345");
});

test("clear removes a stored code", () => {
  const s = fakeStore();
  setPendingInvite("ABCD2345", s);
  clearPendingInvite(s);
  assert.equal(getPendingInvite(s), null);
});
