# Plan: Add Cloud Sync, Optional Auth, and a Friends Leaderboard to Nudge

## Context

Nudge is currently a **client-only, offline-first** habit tracker: all state lives in
`localStorage` across independent hooks, with no backend. The user wants to add:
a cloud database, **optional** authentication (the app must still work anonymously),
cloud sync for signed-in users, and a **leaderboard ranking friends by current streak**,
where friends are added instantly via an **invite code / QR**.

Decisions locked in with the user:
- **Backend:** Supabase (Postgres + Auth + RLS + Edge Functions).
- **Auth model:** Anonymous-first. No account = works exactly like today. Signing in is
  optional and unlocks cloud sync + leaderboard; local data migrates up on first login.
- **Sign-in methods:** Google (primary) + Email/password.
- **Leaderboard metric:** Current streak.
- **Friends:** Invite code + QR. Redeeming a code makes the two users **mutually** friends
  instantly (no accept step). QR/link are sharing methods over the same redeem flow.

### Guiding principle that makes this tractable
`dayRecords` (the raw log of `logged`/`blocked` days) is the single source of truth; streak
and freezes are **derived** from it. Therefore **syncing = syncing the raw log + prefs**, not
the derived state. This is why Phase 0 (below) extracts a single pure streak engine and moves
freezes from *stored* to *derived* — it removes the effect-cascade and makes both sync and
server-side leaderboard computation clean by reusing one implementation.

---

## Phase 0 — Prerequisite refactor: single derived streak engine

Goal: one framework-agnostic module reused by the React app AND the server.

- **Extract** the pure functions currently in `src/hooks/useDayRecords.js`
  (`calculateStreak`, `hasSixConsecutiveLoggedDays`, `evaluateFreezeSpend`) plus a new
  `computeState(log, restDays, today) -> { currentStreak, longestStreak, availableFreezes,
  frozenDays: Set<dateKey>, lastLoggedDate }` into `src/lib/streakEngine.js` (no React imports).
- **Derive freezes instead of storing them.** Remove the two mutating `useEffect`s in
  `useDayRecords.js` that write `meta.freezeCount` / `{status:"freeze"}` records; compute
  freezes on render via `useMemo(computeState(...))`. This eliminates the cascading-render
  lint errors and the undo special-casing (`useDayRecords.js:210`).
- **Delete** `src/app/selectors.js` (dead, buggy duplicate — `getWeek?.()` fallback bug).
- Keep `src/hooks/useDayRecords.test.js` green; add tests for `computeState` (streak +
  derived freezes) as the guardrail for this refactor.

Representative files: `src/lib/streakEngine.js` (new), `src/hooks/useDayRecords.js`,
`src/components/CalendarOverlay.jsx` (read frozen days from derived `frozenDays` set),
`src/app/selectors.js` (delete).

---

## Phase 1 — Supabase foundation, optional auth, and sync

### 1a. Project + client
- Add `@supabase/supabase-js`. Create `src/lib/supabase.js` exporting a configured client.
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (public; RLS protects data). Add to
  `.gitignore`-safe `.env.local` and Vercel env.
- Add `react-router-dom` — the app currently has no router but now needs routes for the
  OAuth callback and the invite deep-link (`/add/:code`). Keep the existing UI as the `/` route.

### 1b. Schema (SQL migrations under `supabase/migrations/`)
- **`profiles`** — `id uuid pk references auth.users`, `username unique`, `display_name`,
  `avatar_url`, `prefs jsonb` (rest_days, freeze_visibility), and **denormalized leaderboard
  fields**: `current_streak int`, `longest_streak int`, `last_logged_date date`,
  `streak_updated_at timestamptz`.
- **`day_logs`** — normalized: `user_id uuid`, `date date`, `status text check in
  ('logged','blocked')`, `updated_at timestamptz`, PK `(user_id, date)`. (Frozen days are
  derived, not stored.)
- **`invite_codes`** — `code text pk`, `owner_id uuid`, `created_at`. v1: one stable personal
  code per user (their QR). (Expiring/one-use codes = later.)
- **`friendships`** — directed two-row model: `user_id uuid`, `friend_id uuid`,
  `created_at`, PK `(user_id, friend_id)`. A redeem creates both directions atomically.

### 1c. Row-Level Security (privacy is the point here)
- `day_logs`: user CRUD **own rows only**. Friends never see your raw log.
- `profiles`: SELECT own + SELECT rows of your friends (policy joins `friendships`);
  UPDATE own only. Friends only ever see `username/display_name/avatar/current_streak`.
- `friendships` / `invite_codes`: SELECT own; writes go through an RPC.
- **`redeem_invite(code)`** as a `SECURITY DEFINER` Postgres function: looks up the code,
  guards against self-redeem and already-friends, and inserts **both** friendship rows
  (owner→redeemer and redeemer→owner). This is the standard pattern for letting a redeemer
  create the reciprocal row the owner couldn't otherwise write.

### 1d. Auth + anonymous-first wiring
- `src/lib/auth.js` / an `AuthProvider` context exposing `user`, `signInGoogle`,
  `signInEmail`, `signOut`.
- Settings panel gains a "Sign in to sync" section (Google button + email/password form).
  Anonymous users see the app **unchanged**.
- First sign-in onboarding: pick a `username` (unique check) → create `profiles` row +
  generate personal `invite_code`.

### 1e. Sync layer (keep hook interfaces identical so the UI barely changes)
- Introduce a **repository abstraction**: `localRepo` (today's localStorage behavior) and
  `supabaseRepo`, chosen by auth state via a `SyncProvider`. `useDayRecords`,
  `useStreakPreferences`, etc. read/write through the active repo — **component props stay the
  same**, so `AppShell` wiring is largely untouched.
- **Migration on first login:** read `fitness_day_records` + `fitness_streak_prefs` from
  localStorage, upsert into `day_logs` + `profiles.prefs`.
- **Merge policy:** last-write-wins per day (`day_logs.updated_at`). Conflicts only arise
  across offline multi-device use; per-day LWW is sufficient and simple.
- **Write-through:** local optimistic update → upsert to Supabase. localStorage remains the
  offline cache so the app still works with no connection.
- On each successful sync, recompute `computeState(...)` and write denormalized
  `current_streak/longest_streak/last_logged_date` to the user's `profiles` row.
- Scope for v1: sync **log + prefs + profile** (all that streak/leaderboard needs). Workouts,
  PRs, and exercise-completion stay local for now (Phase 3).

---

## Phase 2 — Friends, QR, and the leaderboard

- **Invite/QR UI (Settings → Friends):** show the user's personal invite link
  (`<appUrl>/add/<code>`) and a rendered QR (add `qrcode` lib for generation). "Copy link"
  + "Show QR". No in-app camera scanner in v1 — a friend's phone camera opens the link.
- **`/add/:code` route:** if signed in → call `redeem_invite`, show "You're now friends with
  @owner". If anonymous → prompt sign-in, then redeem.
- **Friends list + leaderboard:** query friends' `profiles` joined via `friendships`, ranked
  by `current_streak` (include self). Optional Supabase Realtime subscription for live updates.
- **Daily freshness cron:** a Supabase **Edge Function** (Deno runs JS) that imports the same
  `streakEngine.js` and recomputes `current_streak` for all users nightly, so streaks decay
  correctly even when a user hasn't opened the app. One engine, two runtimes — no duplicated
  logic.

---

## Phase 3 — Later / optional (out of scope for first cut)
Sync workouts/PRs/exercise-completion (same repo pattern, more tables); in-app QR camera
scanner (`@zxing/browser`); expiring/one-use invite codes; additional leaderboard metrics
(longest streak, weekly activity).

---

## Files (representative, not exhaustive)
- New: `src/lib/streakEngine.js`, `src/lib/supabase.js`, `src/lib/auth.js`,
  `src/lib/repo/{localRepo,supabaseRepo}.js`, `src/providers/{AuthProvider,SyncProvider}.jsx`,
  `src/routes/AddFriend.jsx`, `src/components/{SignIn,FriendsLeaderboard,InviteQR}.jsx`,
  `supabase/migrations/*.sql`, `supabase/functions/recompute-streaks/`.
- Modified: `src/hooks/useDayRecords.js`, `src/hooks/useStreakPreferences.js`,
  `src/app/AppShell.jsx` (mount providers/router, add Friends section), `src/main.jsx`
  (router), `src/components/SettingsPanel.jsx` / `CalendarOverlay.jsx`, `package.json`,
  `src/app/version.ts` (bump).
- Deleted: `src/app/selectors.js`.

## Verification
- **Phase 0:** `node --test` — existing streak tests + new `computeState` tests pass;
  `npm run lint` no longer reports `set-state-in-effect` from the freeze effects; anonymous
  app behaves identically in `npm run dev`.
- **Auth/sync:** sign in with Google and email/password; confirm profile+username created and
  local data migrated; sign out → back to local-only; sign in on a second browser shows the
  synced log/streak.
- **RLS:** with two test users, confirm user A cannot read user B's `day_logs` (Supabase SQL
  editor / API) — only B's denormalized `current_streak` via friendship.
- **Friends/leaderboard:** open user B's `/add/:code` (or scan QR) as user A → mutual
  friendship created (both directions), self-redeem and duplicate blocked; leaderboard lists
  both, ranked by current streak.
- **Cron:** invoke the `recompute-streaks` edge function and confirm an inactive user's
  `current_streak` decays to the correct value.

## Notes / risks
- Denormalized `current_streak` can be **stale between syncs**; the nightly cron bounds this.
  A fully-live alternative is a SQL/edge streak function per query (heavier) — deferred.
- No schema-migration layer exists client-side today; guard all reads defensively (mirror the
  existing `normalizeRestDays` / `resolveRestDays` patterns) when shapes change.
- The anon key is public by design; **all** protection rests on RLS — treat the policies as
  security-critical and test them explicitly.
