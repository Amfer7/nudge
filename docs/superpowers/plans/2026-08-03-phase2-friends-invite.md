# Phase 2 (part 1): Friends + Invite — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let signed-in users share a personal invite code/QR, redeem someone else's, and see a friends list with each friend's current streak.

**Architecture:** A null-safe async Supabase module (`friends.ts`) sits over the Phase-1 `redeem_invite` RPC and RLS-scoped `profiles` reads. TanStack Query hooks (the app's first) wrap it. A dedicated `FriendsOverlay` and an `/add/:code` deep-link route consume the hooks; a one-shot `nudge_pending_invite` in `localStorage` carries a code across a signed-out → signed-in transition, auto-redeemed by `SyncProvider`.

**Tech Stack:** React 19, react-router-dom 7, TanStack Query 5, `@supabase/supabase-js`, `qrcode` (new dep), `node:test` + `node:assert/strict`.

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-08-03-phase2-friends-invite-design.md`.
- **No schema changes.** All DB plumbing (`invite_codes`, `friendships`, `redeem_invite` RPC, friend-visible `profiles` RLS) already exists from Phase 1.
- **Null-safe everywhere:** all Supabase access goes through a `requireClient()` guard; when `!isSupabaseConfigured` the feature shows a guard UI and never throws. The app must remain byte-for-byte the offline app when unconfigured.
- **Anonymous-first:** queries are `enabled` only for a signed-in user with a profile; anonymous users fire nothing.
- New logic authored in **TypeScript**; `.jsx` for components (matches existing components).
- Tests use `node:test` + `node:assert/strict`, imported from `.ts` with a `/// <reference types="node" />` header (see `src/lib/notifications.test.ts`). Only **pure** logic is unit-tested; Supabase I/O and React hooks/components are verified manually.
- `npm run lint` must stay **green (0 problems)**; `npm run typecheck` must pass.
- Styling: inline `style` objects using `var(--...)` CSS custom properties (match `SignIn.jsx` / `BlockDatesOverlay`). No hardcoded colors except the QR quiet-zone card (must be light in every theme).
- Unfriend is **out of scope** (no DELETE policy exists).

---

## File Structure

- Create `src/lib/friends.ts` — `Friend` type, pure `inviteUrl` + `mapRedeemError`, async `listFriends` + `redeemInvite`.
- Create `src/lib/friends.test.ts` — unit tests for the pure helpers.
- Create `src/lib/pendingInvite.ts` — get/set/clear for the `nudge_pending_invite` localStorage key.
- Create `src/lib/pendingInvite.test.ts` — unit tests for the storage helper.
- Create `src/hooks/useFriends.ts` — `useFriends` + `useRedeemInvite` Query hooks.
- Create `src/components/InviteQR.jsx` — QR card + copy/share (adds `qrcode` dep).
- Create `src/components/FriendsOverlay.jsx` — the overlay.
- Create `src/routes/AddFriend.jsx` — `/add/:code` deep-link handler.
- Modify `src/main.jsx` — add the `/add/:code` route.
- Modify `src/providers/SyncProvider.jsx` — auto-redeem pending invite after sync.
- Modify `src/app/AppShell.jsx` — overlay state + entry button.
- Modify `src/components/SignIn.jsx` — update the "next update" copy.
- Modify `package.json` — add `qrcode`.

---

### Task 1: Pure helpers in `friends.ts` (`inviteUrl`, `mapRedeemError`)

**Files:**
- Create: `src/lib/friends.ts`
- Test: `src/lib/friends.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `inviteUrl(origin: string, code: string): string` → `` `${origin}/add/${code}` ``
  - `mapRedeemError(code: string | undefined): string` — maps PG error codes to human copy.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/friends.test.ts
/// <reference types="node" />
import test from "node:test";
import assert from "node:assert/strict";
import { inviteUrl, mapRedeemError } from "./friends.ts";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/friends.test.ts`
Expected: FAIL — cannot find module `./friends.ts` (or export missing).

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/friends.ts
// Friend graph over the Phase-1 redeem_invite RPC + RLS-scoped profile reads.
// Pure helpers live here too so they can be unit-tested without a live backend.
import { supabase } from "./supabase";

export interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  current_streak: number;
}

// Build the shareable deep link for an invite code. Kept pure/testable.
export function inviteUrl(origin: string, code: string): string {
  return `${origin.replace(/\/$/, "")}/add/${code}`;
}

// Map redeem_invite's Postgres error codes (see 0002_rls_and_rpc.sql) to copy.
export function mapRedeemError(code: string | undefined): string {
  switch (code) {
    case "P0002":
      return "That invite code doesn't exist.";
    case "P0001":
      return "You can't add yourself.";
    case "28000":
      return "Please sign in first.";
    default:
      return "Couldn't add that friend. Try again.";
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/friends.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/friends.ts src/lib/friends.test.ts
git commit -m "feat(friends): pure invite-url + redeem-error helpers"
```

---

### Task 2: Pending-invite storage (`pendingInvite.ts`)

**Files:**
- Create: `src/lib/pendingInvite.ts`
- Test: `src/lib/pendingInvite.test.ts`

**Interfaces:**
- Consumes: a `Storage`-shaped object (defaults to `localStorage`), injectable for tests.
- Produces:
  - `setPendingInvite(code: string, store?: PendingStore): void`
  - `getPendingInvite(store?: PendingStore): string | null`
  - `clearPendingInvite(store?: PendingStore): void`
  - `PENDING_INVITE_KEY = "nudge_pending_invite"`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/pendingInvite.test.ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/lib/pendingInvite.test.ts`
Expected: FAIL — cannot find module `./pendingInvite.ts`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/pendingInvite.ts
// A one-shot invite code carried across a signed-out -> signed-in transition
// (e.g. clicking /add/:code while logged out, incl. the OAuth redirect round
// trip). Online-only + transient, so it lives outside the repository layer.
export const PENDING_INVITE_KEY = "nudge_pending_invite";

interface PendingStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStore(): PendingStore | null {
  return typeof localStorage !== "undefined" ? localStorage : null;
}

export function setPendingInvite(code: string, store = defaultStore()): void {
  store?.setItem(PENDING_INVITE_KEY, code);
}

export function getPendingInvite(store = defaultStore()): string | null {
  return store?.getItem(PENDING_INVITE_KEY) ?? null;
}

export function clearPendingInvite(store = defaultStore()): void {
  store?.removeItem(PENDING_INVITE_KEY);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/lib/pendingInvite.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/pendingInvite.ts src/lib/pendingInvite.test.ts
git commit -m "feat(friends): pending-invite localStorage helper"
```

---

### Task 3: Supabase I/O — `listFriends` + `redeemInvite`

**Files:**
- Modify: `src/lib/friends.ts`

**Interfaces:**
- Consumes: `Friend`, `mapRedeemError` (Task 1); `supabase` client.
- Produces:
  - `listFriends(): Promise<Friend[]>`
  - `redeemInvite(code: string): Promise<{ owner_id: string; username: string }>` — throws `Error(mapRedeemError(pgCode))` on failure.

No unit test (live-backend I/O); verified manually in Task 9. Keep these wrappers thin — all branching logic already lives in the tested pure helpers.

- [ ] **Step 1: Add the client guard + functions**

Append to `src/lib/friends.ts`:

```ts
function requireClient() {
  if (!supabase) throw new Error("Cloud sync is not configured.");
  return supabase;
}

// Friends reachable via the caller's friendship edges. RLS restricts both the
// rows (only your friends) and the columns exposed on a friend's profile.
export async function listFriends(): Promise<Friend[]> {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return [];

  const { data: edges, error: edgeErr } = await client
    .from("friendships")
    .select("friend_id")
    .eq("user_id", userId);
  if (edgeErr) throw edgeErr;

  const ids = (edges ?? []).map((e) => e.friend_id as string);
  if (ids.length === 0) return [];

  const { data, error } = await client
    .from("profiles")
    .select("id, username, display_name, avatar_url, current_streak")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as Friend[];
}

// Redeem someone else's invite code via the reciprocal-friendship RPC. Maps the
// RPC's Postgres error codes to friendly copy.
export async function redeemInvite(
  code: string,
): Promise<{ owner_id: string; username: string }> {
  const client = requireClient();
  const { data, error } = await client.rpc("redeem_invite", {
    invite_code: code.trim().toUpperCase(),
  });
  if (error) {
    throw new Error(mapRedeemError((error as { code?: string }).code));
  }
  return data as { owner_id: string; username: string };
}
```

- [ ] **Step 2: Verify it type-checks and lints**

Run: `npm run typecheck && npm run lint`
Expected: both pass; 0 lint problems. Existing pure-helper tests still green: `node --test src/lib/friends.test.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/friends.ts
git commit -m "feat(friends): listFriends + redeemInvite Supabase I/O"
```

---

### Task 4: Query hooks — `useFriends` + `useRedeemInvite`

**Files:**
- Create: `src/hooks/useFriends.ts`

**Interfaces:**
- Consumes: `listFriends`, `redeemInvite`, `Friend` (Tasks 1/3); `useAuth` (`user`, `configured`); `useSync` (`profile`); `queryClient` semantics via `useQueryClient`.
- Produces:
  - `FRIENDS_QUERY_KEY = ["friends"]`
  - `useFriends()` → `UseQueryResult<Friend[]>`
  - `useRedeemInvite()` → `UseMutationResult<{owner_id,username}, Error, string>`

No unit test (React hooks over live I/O); verified manually in Task 9.

- [ ] **Step 1: Write the hooks**

```ts
// src/hooks/useFriends.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { listFriends, redeemInvite, type Friend } from "../lib/friends";
import { useAuth } from "../providers/AuthProvider";
import { useSync } from "../providers/SyncProvider";

export const FRIENDS_QUERY_KEY = ["friends"] as const;

// The app's first server-state query. Enabled only for a signed-in user who has
// finished onboarding (has a profile), so anonymous users fire nothing.
export function useFriends() {
  const { user, configured } = useAuth();
  const { profile } = useSync();
  return useQuery<Friend[]>({
    queryKey: FRIENDS_QUERY_KEY,
    queryFn: listFriends,
    enabled: Boolean(configured && user && profile),
  });
}

export function useRedeemInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => redeemInvite(code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
    },
  });
}
```

- [ ] **Step 2: Verify it type-checks and lints**

Run: `npm run typecheck && npm run lint`
Expected: both pass. (If `useSync` isn't exported as a named hook, confirm against `src/providers/SyncProvider.jsx` — it is: `export function useSync()`.)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useFriends.ts
git commit -m "feat(friends): useFriends + useRedeemInvite query hooks"
```

---

### Task 5: `InviteQR` component (+ `qrcode` dep)

**Files:**
- Create: `src/components/InviteQR.jsx`
- Modify: `package.json` (via `npm install`)

**Interfaces:**
- Consumes: `inviteUrl` (Task 1); `qrcode`.
- Produces: `<InviteQR code={string} />` default export.

No unit test (DOM/canvas + share API); verified manually in Task 9.

- [ ] **Step 1: Add the dependency**

Run: `npm install qrcode`
Expected: `qrcode` appears under `dependencies` in `package.json`; lockfile updates.

- [ ] **Step 2: Write the component**

```jsx
// src/components/InviteQR.jsx
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { inviteUrl } from "../lib/friends";

// Your personal invite: a scannable QR of /add/<code> plus the human code and
// copy/share affordances. The QR sits on a fixed light card so it scans in any
// theme (QR contrast must not depend on data-theme).
function InviteQR({ code }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const url = inviteUrl(window.location.origin, code);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 176, margin: 1 }, () => {});
    }
  }, [url]);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "Add me on Nudge", url });
        return;
      }
    } catch {
      // fall through to copy
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the code is shown below regardless */
    }
  }

  return (
    <section style={styles.section}>
      <div style={styles.title}>Your invite</div>
      <div style={styles.qrCard}>
        <canvas ref={canvasRef} />
      </div>
      <div style={styles.code}>{code}</div>
      <div style={styles.row}>
        <button style={styles.btn} onClick={copy}>
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button style={styles.btn} onClick={share}>
          Share
        </button>
      </div>
    </section>
  );
}

const styles = {
  section: { display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" },
  title: { fontWeight: 600, fontSize: "16px", alignSelf: "flex-start" },
  qrCard: {
    background: "#ffffff",
    padding: "12px",
    borderRadius: "12px",
    lineHeight: 0,
  },
  code: {
    fontFamily: "monospace",
    fontWeight: 700,
    fontSize: "18px",
    letterSpacing: "2px",
    color: "var(--text)",
  },
  row: { display: "flex", gap: "8px" },
  btn: {
    padding: "9px 14px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "13px",
  },
};

export default InviteQR;
```

- [ ] **Step 3: Verify build + lint**

Run: `npm run lint && npm run build`
Expected: 0 lint problems; build succeeds (confirms `qrcode` resolves in the bundle).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/InviteQR.jsx
git commit -m "feat(friends): InviteQR card with qrcode"
```

---

### Task 6: `FriendsOverlay` component

**Files:**
- Create: `src/components/FriendsOverlay.jsx`

**Interfaces:**
- Consumes: `useFriends`, `useRedeemInvite` (Task 4); `InviteQR` (Task 5); `useAuth`, `useSync`; `mapRedeemError` is already baked into `redeemInvite`.
- Produces: `<FriendsOverlay visible={bool} onClose={fn} onOpenSettings={fn} />` default export. (Mirrors `BlockDatesOverlay`'s `visible`/`onClose` prop shape — confirm exact shell markup against `src/components/BlockDatesOverlay.jsx` and match it.)

No unit test; verified manually in Task 9.

- [ ] **Step 1: Write the component**

```jsx
// src/components/FriendsOverlay.jsx
import { useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useSync } from "../providers/SyncProvider";
import { useFriends, useRedeemInvite } from "../hooks/useFriends";
import InviteQR from "./InviteQR";

// Friends: your invite QR/code, an add-a-friend box, and the friends list with
// each friend's current streak. Signed-out / unconfigured users get a prompt to
// sign in instead of the add/list UI. Styled like the other overlays.
function FriendsOverlay({ visible, onClose, onOpenSettings }) {
  const { user, configured } = useAuth();
  const { profile, inviteCode } = useSync();
  const friends = useFriends();
  const redeem = useRedeemInvite();
  const [codeInput, setCodeInput] = useState("");
  const [added, setAdded] = useState(null);

  if (!visible) return null;

  const signedIn = configured && user && profile;

  async function handleAdd(e) {
    e.preventDefault();
    setAdded(null);
    try {
      const res = await redeem.mutateAsync(codeInput);
      setAdded(`Added @${res.username}`);
      setCodeInput("");
    } catch {
      /* redeem.error carries the mapped message */
    }
  }

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.heading}>Friends</div>
          <button style={styles.close} onClick={onClose}>
            Close
          </button>
        </div>

        {!signedIn ? (
          <div style={styles.body}>
            <div style={styles.muted}>
              {configured
                ? "Sign in to share your code and add friends."
                : "Friends need cloud sync, which isn't enabled in this build."}
            </div>
            {configured && (
              <button
                style={styles.primaryBtn}
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
              >
                Sign in
              </button>
            )}
          </div>
        ) : (
          <div style={styles.body}>
            {inviteCode && <InviteQR code={inviteCode} />}

            <form onSubmit={handleAdd} style={styles.addForm}>
              <div style={styles.title}>Add a friend</div>
              <div style={styles.addRow}>
                <input
                  style={styles.input}
                  placeholder="Invite code"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  autoCapitalize="characters"
                  required
                />
                <button
                  style={styles.primaryBtn}
                  type="submit"
                  disabled={redeem.isPending || codeInput.trim().length === 0}
                >
                  {redeem.isPending ? "Adding…" : "Add"}
                </button>
              </div>
              {added && <div style={styles.notice}>{added}</div>}
              {redeem.isError && (
                <div style={styles.error}>{String(redeem.error.message)}</div>
              )}
            </form>

            <div style={styles.listWrap}>
              <div style={styles.title}>Your friends</div>
              {friends.isLoading && <div style={styles.muted}>Loading…</div>}
              {friends.isError && (
                <div style={styles.error}>Couldn't load friends — retry.</div>
              )}
              {friends.data && friends.data.length === 0 && (
                <div style={styles.muted}>
                  No friends yet — share your code above.
                </div>
              )}
              {friends.data?.map((f) => (
                <div key={f.id} style={styles.friendRow}>
                  <span style={styles.handle}>@{f.username}</span>
                  <span style={styles.streak}>🔥 {f.current_streak}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
    padding: "16px",
  },
  panel: {
    width: "min(420px, 100%)",
    maxHeight: "85vh",
    overflowY: "auto",
    background: "var(--card, var(--bg))",
    border: "1px solid var(--border)",
    borderRadius: "16px",
    padding: "18px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "14px",
  },
  heading: { fontWeight: 700, fontSize: "18px", color: "var(--text)" },
  close: {
    padding: "6px 12px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    cursor: "pointer",
    fontSize: "13px",
  },
  body: { display: "flex", flexDirection: "column", gap: "18px" },
  addForm: { display: "flex", flexDirection: "column", gap: "8px" },
  addRow: { display: "flex", gap: "8px" },
  title: { fontWeight: 600, fontSize: "15px", color: "var(--text)" },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: "14px",
  },
  primaryBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid rgba(45, 255, 196, 0.55)",
    background: "rgba(7, 22, 14, 0.72)",
    color: "var(--text)",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
  },
  listWrap: { display: "flex", flexDirection: "column", gap: "8px" },
  friendRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
  },
  handle: { fontWeight: 600, color: "var(--text)" },
  streak: { color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" },
  muted: { fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.45 },
  notice: { fontSize: "13px", color: "var(--text)" },
  error: { fontSize: "13px", color: "#ff8a8a" },
};

export default FriendsOverlay;
```

- [ ] **Step 2: Verify lint + build**

Run: `npm run lint && npm run build`
Expected: 0 lint problems; build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/FriendsOverlay.jsx
git commit -m "feat(friends): FriendsOverlay (invite, add, list)"
```

---

### Task 7: `/add/:code` deep-link route

**Files:**
- Create: `src/routes/AddFriend.jsx`
- Modify: `src/main.jsx`

**Interfaces:**
- Consumes: `useAuth`, `useSync`, `redeemInvite` (Task 3), `setPendingInvite` (Task 2); `isSupabaseConfigured`; router `useParams`/`useNavigate`.
- Produces: `<AddFriend />` default export; a new route in `main.jsx`.

No unit test; verified manually in Task 9.

- [ ] **Step 1: Write the route component**

```jsx
// src/routes/AddFriend.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { useSync } from "../providers/SyncProvider";
import { isSupabaseConfigured } from "../lib/supabase";
import { redeemInvite } from "../lib/friends";
import { setPendingInvite } from "../lib/pendingInvite";

// Landing for a shared invite link.
//   - signed in + onboarded  -> redeem now, show result.
//   - signed out / onboarding -> stash the code, bounce home to sign in
//                                (SyncProvider auto-redeems once synced).
//   - unconfigured build      -> explain that friends need cloud sync.
function AddFriend() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, configured } = useAuth();
  const { profile } = useSync();
  const [state, setState] = useState({ kind: "working", msg: "Adding…" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isSupabaseConfigured) {
        setState({
          kind: "error",
          msg: "Friends need cloud sync, which isn't enabled in this build.",
        });
        return;
      }
      if (!(configured && user && profile)) {
        // Not ready to redeem yet — stash and let sign-in + SyncProvider finish it.
        setPendingInvite(code);
        navigate("/", { replace: true });
        return;
      }
      try {
        const res = await redeemInvite(code);
        if (!cancelled) setState({ kind: "ok", msg: `Added @${res.username}!` });
      } catch (e) {
        if (!cancelled) setState({ kind: "error", msg: String(e.message ?? e) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, user, configured, profile, navigate]);

  return (
    <div style={styles.wrap}>
      <div style={styles.msg}>{state.msg}</div>
      <Link to="/" style={styles.link}>
        Back to Nudge
      </Link>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "var(--bg)",
    color: "var(--text)",
    textAlign: "center",
  },
  msg: { fontSize: "18px", fontWeight: 600 },
  link: { color: "var(--text-muted)", textDecoration: "underline" },
};

export default AddFriend;
```

- [ ] **Step 2: Register the route in `main.jsx`**

In `src/main.jsx`, add the import and route. Replace the existing comment about the Phase-2 deep link.

```jsx
import AddFriend from "./routes/AddFriend";
```

```jsx
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/add/:code" element={<AddFriend />} />
        <Route path="*" element={<App />} />
      </Routes>
```

Also update the block comment so it no longer says the deep link "lands in Phase 2."

- [ ] **Step 3: Verify lint + build**

Run: `npm run lint && npm run build`
Expected: 0 lint problems; build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/routes/AddFriend.jsx src/main.jsx
git commit -m "feat(friends): /add/:code deep-link route"
```

---

### Task 8: Auto-redeem pending invite in `SyncProvider`

**Files:**
- Modify: `src/providers/SyncProvider.jsx`

**Interfaces:**
- Consumes: `redeemInvite` (Task 3), `getPendingInvite`/`clearPendingInvite` (Task 2), `FRIENDS_QUERY_KEY` (Task 4), `useQueryClient`.
- Produces: no new public API; after activation reaches `"synced"`, a pending invite is redeemed once, the `["friends"]` query is invalidated, and the key cleared.

No unit test (integration over live auth); verified manually in Task 9.

- [ ] **Step 1: Add imports**

At the top of `src/providers/SyncProvider.jsx`, add:

```jsx
import { useQueryClient } from "@tanstack/react-query";
import { redeemInvite } from "../lib/friends";
import { getPendingInvite, clearPendingInvite } from "../lib/pendingInvite";
import { FRIENDS_QUERY_KEY } from "../hooks/useFriends";
```

- [ ] **Step 2: Add the helper + call it after activation**

Inside `SyncProvider`, get the query client:

```jsx
  const queryClient = useQueryClient();
```

Add a one-shot redeemer (place near `activateSync`):

```jsx
  // If the user arrived via /add/:code while signed out, a code was stashed.
  // Redeem it once now that we're synced, then clear it so a bad link can't
  // wedge every future sign-in.
  async function redeemPending() {
    const code = getPendingInvite();
    if (!code) return;
    try {
      await redeemInvite(code);
      void queryClient.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
    } catch (e) {
      console.error("[sync] pending invite redeem failed", e);
    } finally {
      clearPendingInvite();
    }
  }
```

Call `await redeemPending();` immediately after each place activation completes and status becomes `"synced"` — in the effect's success branch (after `await activateSync(myProfile);`) and in `completeOnboarding` (after `await activateSync(created);`). Example, in the effect:

```jsx
        setProfile(myProfile);
        await activateSync(myProfile);
        if (cancelled) return;
        await redeemPending();
        setStatus("synced");
```

and in `completeOnboarding`:

```jsx
      const created = await createProfile(username);
      setProfile(created);
      await activateSync(created);
      await redeemPending();
      setStatus("synced");
```

- [ ] **Step 3: Verify lint + build**

Run: `npm run lint && npm run build`
Expected: 0 lint problems; build succeeds. (Watch for an import cycle: `SyncProvider` → `useFriends` imports `useSync` from `SyncProvider`. Importing only the constant `FRIENDS_QUERY_KEY` is fine at module load; if the bundler warns, inline `["friends"]` in `SyncProvider` instead.)

- [ ] **Step 4: Commit**

```bash
git add src/providers/SyncProvider.jsx
git commit -m "feat(friends): auto-redeem pending invite after sync"
```

---

### Task 9: Wire the overlay into `AppShell` + copy cleanup + manual verification

**Files:**
- Modify: `src/app/AppShell.jsx`
- Modify: `src/components/SignIn.jsx`

**Interfaces:**
- Consumes: `FriendsOverlay` (Task 6).
- Produces: a `friendsOpen` UI state + entry button; end-to-end feature.

- [ ] **Step 1: Import + state + entry button in `AppShell`**

Add the import alongside the other overlay imports:

```jsx
import FriendsOverlay from "../components/FriendsOverlay";
```

Add UI state next to `blockPickerOpen`:

```jsx
  const [friendsOpen, setFriendsOpen] = useState(false);
```

Add a functional entry point near the existing block-dates button (placement is intentionally rough — the user will rearrange UI later):

```jsx
        <button onClick={() => setFriendsOpen(true)}>Friends</button>
```

Render the overlay alongside the other overlays (near `BlockDatesOverlay`):

```jsx
      <FriendsOverlay
        visible={friendsOpen}
        onClose={() => setFriendsOpen(false)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
```

- [ ] **Step 2: Update the SignIn copy**

In `src/components/SignIn.jsx`, change the invite-code line so it no longer promises a future update:

```jsx
      {inviteCode && (
        <div style={styles.muted}>
          Your invite code: <span style={styles.code}>{inviteCode}</span>{" "}
          <span style={styles.dim}>(share it from the Friends screen)</span>
        </div>
      )}
```

- [ ] **Step 3: Verify lint + build + full test run**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: 0 lint problems; typecheck passes; all `node:test` files pass (including the two new pure-helper suites); build succeeds.

- [ ] **Step 4: Manual verification (requires a configured Supabase build)**

With `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` set and `npm run dev`:
1. Sign in as user A → open Friends → a QR + code render; **Copy link** and **Share** work.
2. In a second browser, sign in as user B, open A's `/add/<code>` link → shows "Added @A"; A's Friends list shows @B (and vice-versa after refetch) with the correct 🔥 streak.
3. Type a code into the **Add a friend** box → success adds + list refetches; a bad code shows "That invite code doesn't exist."; your own code shows "You can't add yourself."
4. Signed-out link flow: sign out, open `/add/<code>` → bounced home; sign in → friend auto-added exactly once; reload → not re-added.
5. Unconfigured build (unset env, `npm run dev`): Friends overlay shows the "cloud sync isn't enabled" guard; `/add/<code>` shows the same message; no crashes.

- [ ] **Step 5: Commit**

```bash
git add src/app/AppShell.jsx src/components/SignIn.jsx
git commit -m "feat(friends): wire FriendsOverlay into AppShell + copy cleanup"
```

---

## Self-Review notes

- **Spec coverage:** friends.ts I/O + pure helpers (Tasks 1,3), pending invite (Task 2), Query hooks (Task 4), InviteQR/qrcode (Task 5), FriendsOverlay incl. signed-out/unconfigured guard + streak rows (Task 6), `/add/:code` + auto-add (Tasks 7,8), copy cleanup (Task 9), unfriend deferred (not implemented) — all mapped.
- **Type consistency:** `Friend`, `inviteUrl`, `mapRedeemError`, `redeemInvite`, `listFriends`, `FRIENDS_QUERY_KEY`, `getPendingInvite/setPendingInvite/clearPendingInvite` used with identical signatures across tasks.
- **Manual-only I/O:** Supabase/React units are explicitly not unit-tested; the tested surface is the three pure helpers, matching the spec's testing section.
