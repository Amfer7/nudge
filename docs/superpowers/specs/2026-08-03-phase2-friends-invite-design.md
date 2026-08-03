# Phase 2 (part 1): Friends + Invite — Design

**Date:** 2026-08-03
**Status:** Approved, ready for planning
**Scope:** Friend graph only — share your invite code/QR, redeem someone else's,
see your friends list with their current streak. **Leaderboard and the nightly
`recompute-streaks` Edge Function are out of scope** (separate later specs).

## Context

Phase 1 already shipped the full database plumbing this feature needs:

- `invite_codes` — one stable personal code per user (created on first sign-in by
  `ensureInviteCode()` in `src/lib/profiles.ts`).
- `friendships` — directed two-row model; a redeem inserts **both** directions
  atomically.
- `redeem_invite(code)` RPC — `SECURITY DEFINER`; guards self-redeem and
  duplicates, returns `{ owner_id, username }`.
- `profiles` RLS — a user can `select` a **friend's** row, exposing only
  `username / display_name / avatar_url / current_streak`. The raw day log is
  never exposed.
- `current_streak` is already recomputed and pushed on every sync
  (`pushDenormalizedStreak` in `SyncProvider.jsx`), so friends' streaks are live
  without the deferred nightly cron.

No schema changes are required for this spec.

The app already mounts `QueryClientProvider` (`src/app/Providers.jsx`) with **zero
query hooks so far** — CLAUDE.md calls this "the server-state scaffold." Friends
is its first real consumer.

## Decisions (from brainstorming)

- **Scope:** friends + invite only; leaderboard and Edge Function deferred.
- **Data layer:** TanStack Query (the existing scaffold), not plain local state.
- **QR:** add the lightweight `qrcode` dependency to render a real scannable QR.
  Scanning is handled by the phone's native camera opening the `/add/:code`
  link — **no in-app camera scanner**.
- **Placement:** a dedicated **Friends overlay** (like `BlockDatesOverlay` /
  `CalendarOverlay`), not a Settings section. Exact entry-point placement is
  intentionally left rough — the user will rearrange UI later; the plan only
  needs a functional entry point.
- **Redeem-when-signed-out:** persist the code and **auto-add after sign-in**.
- **Friend rows:** show `@username` + **current streak**.
- **Unfriend:** **deferred.** No `DELETE` RLS policy exists on `friendships`
  today (both rows are definer-written); adding unfriend would need a new
  migration + RPC. Out of scope here.

## Architecture

Five units, each independently understandable and testable:

### 1. `src/lib/friends.ts` — async Supabase module

Mirrors `profiles.ts`: a null-safe `requireClient()` guard, plain async functions,
no React.

```ts
export interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  current_streak: number;
}

// Join friendships -> friend profiles; RLS already restricts columns/rows.
export async function listFriends(): Promise<Friend[]>;

// Calls the redeem_invite RPC; maps PG error codes to friendly messages:
//   P0002 -> "That invite code doesn't exist."
//   P0001 -> "You can't add yourself."
//   28000 -> "Please sign in first."
export async function redeemInvite(code: string): Promise<{ owner_id: string; username: string }>;
```

`listFriends` selects the friend profile rows reachable via the caller's
`friendships` edges, requesting only `id, username, display_name, avatar_url,
current_streak`. Implementation detail (either is fine): a two-step query
(`friendships` → `profiles in (...)`) or a PostgREST embedded select — pick
whichever reads cleanly against the actual FK metadata; the two-step form is the
safe default if the embed doesn't resolve.

`redeemInvite` trims/normalizes input the same way the RPC does (`upper(btrim())`)
before sending, and returns the RPC payload.

`removeFriend` is **not** implemented (unfriend deferred).

### 2. `src/hooks/useFriends.ts` — first TanStack Query hooks

```ts
export function useFriends() // useQuery(['friends'], listFriends), enabled: signedIn
export function useRedeemInvite() // useMutation(redeemInvite) -> invalidateQueries(['friends'])
```

- `useFriends` is `enabled` only when there is a signed-in user with a profile
  (read auth/sync context), so anonymous users never fire the query.
- `useRedeemInvite` invalidates `['friends']` on success so the list refetches.
- Uses the shared client from `src/lib/queryClient.ts`.

### 3. `src/components/InviteQR.jsx` — QR card

- Adds the **`qrcode`** dependency (MIT, ~15KB).
- Renders the invite URL as a QR onto a `<canvas>` (or `toDataURL` `<img>`).
- Drawn on a **light** card with a quiet zone regardless of theme (QR contrast
  must not depend on `data-theme`).
- Invite URL: `` `${window.location.origin}/add/${inviteCode}` ``.
- Below the QR: the human code in monospace, a **Copy link** button, and a
  **Share** button using `navigator.share` when available, falling back to
  clipboard copy.
- Self-contained; takes `inviteCode` as a prop.

### 4. `src/components/FriendsOverlay.jsx` — the overlay

Styled like the existing overlays (same shell, inline `var(--...)` styles).
Top to bottom:

1. **Your invite** — `InviteQR` (code from `useSync().inviteCode`).
2. **Add a friend** — text input + **Add** button wired to `useRedeemInvite()`.
   On success: inline "Added @username", clear input, list refetches via
   invalidation. On error: the mapped message inline.
3. **Friends list** — `useFriends()`: each row shows avatar / `@username` +
   current streak (🔥 N). Explicit **loading** and **empty** states
   ("No friends yet — share your code above").

**Signed-out / unconfigured guard:** if not signed in (or
`!isSupabaseConfigured`), the overlay body shows a short "Sign in to add friends"
prompt with a button that opens the existing Settings/SignIn surface, instead of
the add/list UI.

### 5. `/add/:code` deep link + auto-add

**Route:** add `<Route path="/add/:code" element={<AddFriend />} />` in
`src/main.jsx` (replacing the existing "Phase 2" comment). New
`src/routes/AddFriend.jsx`.

**Behavior by state:**

- **Signed in, profile exists:** call `redeemInvite(code)` immediately; show
  "Added @username" or the mapped error, plus a button back to `/`.
- **Signed out / mid-onboarding:** persist the code as a **pending invite** in
  `localStorage` (key `nudge_pending_invite`), route to `/`, where the
  SignIn surface prompts sign-in.
- **Unconfigured build (`!isSupabaseConfigured`):** show "Friends need cloud
  sync, which isn't enabled in this build" + a link home.

**Auto-add trigger:** in `SyncProvider`, right after activation reaches
`"synced"` (profile ready + sink installed), check `nudge_pending_invite`; if
present, redeem it, invalidate the `['friends']` query, and clear the key.
One-shot; survives the OAuth redirect round-trip. Expose a small
`redeemPending()` helper so the logic lives in one place. `SyncProvider` must be
able to invalidate the friends query (it is already inside the Query provider).

**Pending-invite storage:** a tiny helper pair (get/set/clear) for
`nudge_pending_invite`. Not part of the repository layer (online-only, transient)
— it lives alongside `AddFriend`/`SyncProvider`, like the self-contained keys.

### Copy cleanup

Update the `SignIn.jsx` line "friends & QR arrive in the next update" to point at
the new Friends overlay instead.

## Data flow

```
Share:   useSync().inviteCode ──> InviteQR ──> QR of /add/<code>  (+ Copy/Share)

Redeem (in-app):  input code ──> useRedeemInvite ──> redeem_invite RPC
                     └─ onSuccess ──> invalidate ['friends'] ──> useFriends refetch

Redeem (link, signed in):   /add/:code ──> AddFriend ──> redeemInvite ──> home

Redeem (link, signed out):  /add/:code ──> save nudge_pending_invite ──> /
                              ──> user signs in ──> SyncProvider reaches "synced"
                              ──> redeemPending() ──> redeem + invalidate + clear

List:    useFriends ──> listFriends ──> friendships⨝profiles (RLS-scoped)
                     ──> rows: @username + current_streak
```

## Error handling

- All Supabase calls go through `requireClient()`; unconfigured build short-circuits
  to the guard UI rather than throwing.
- RPC Postgres error codes mapped to human messages (see `friends.ts`).
- `redeemInvite` is idempotent server-side (`on conflict do nothing`); re-adding an
  existing friend succeeds quietly and the list simply stays correct.
- Auto-add failures (e.g. a stale/invalid pending code) are logged and the key is
  cleared regardless, so a bad link can't wedge every future sign-in.
- Query errors surface as an inline "Couldn't load friends — retry" affordance.

## Testing

Follow the repo convention: `node:test` + `node:assert/strict`, pure logic
extracted so it's testable without React or a live Supabase.

- **Pending-invite helper** — get/set/clear round-trips; clear removes the key;
  get on empty returns null. (Pure, unit-tested.)
- **Error-code mapping** — a pure `mapRedeemError(code)` returns the expected
  message for `P0001` / `P0002` / `28000` / unknown. (Pure, unit-tested.)
- **Invite URL builder** — a pure `inviteUrl(origin, code)` produces
  `origin + "/add/" + code`. (Pure, unit-tested.)
- Supabase I/O (`listFriends`, `redeemInvite`) and the Query hooks are **not**
  unit-tested here (no live backend in `node:test`); they're verified manually
  per the checklist below. Keep the thin I/O wrappers dumb so the tested pure
  helpers hold the logic.
- `npm run lint` stays green; new logic authored in TS and type-checked by
  `npm run typecheck`.

## Manual verification

- Two accounts in two browsers: A opens the Friends overlay, B scans/opens A's
  link → both show each other with the correct current streak.
- In-app add by typing the code works and refetches the list.
- Signed-out link flow: open `/add/:code` while logged out → sign in → friend is
  auto-added exactly once; refreshing doesn't re-trigger.
- Self-add and bad-code show the mapped messages.
- Unconfigured build (`isSupabaseConfigured === false`): overlay shows the guard;
  `/add/:code` shows the "needs cloud sync" message; no crashes.

## Out of scope (later specs)

- Leaderboard (ranked view of friends' streaks).
- Nightly `recompute-streaks` Edge Function / cron.
- Unfriend (needs a new `friendships` DELETE policy or RPC + migration).
- Syncing workouts / PRs / exercise-completion (Phase 3).
