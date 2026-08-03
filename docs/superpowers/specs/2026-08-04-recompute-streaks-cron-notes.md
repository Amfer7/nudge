# Recompute-streaks cron — deferred design notes

**Status:** DEFERRED (not implemented). Captured 2026-08-04 mid-brainstorm; the
decision was that we don't need it yet. Pick this up when the social/Standings
view matters enough that stale friend streaks feel broken.

## The problem it solves

A streak is a function of **time**, not just data: `computeState(records,
restDays, today)` takes `today`, so a user's current streak changes as days pass
even with no new writes. Today the denormalized `profiles.current_streak` /
`longest_streak` / `last_logged_date` are only refreshed by `pushDenormalizedStreak`
in `SyncProvider` — i.e. **only when a signed-in user opens the app and
logs/changes a day** (or on login/sync).

Because RLS forbids friends from reading each other's raw `day_logs`, friends see
only the denormalized `current_streak`. So an **inactive** user's streak stays
frozen at its last-synced value in everyone else's Standings list — usually
**inflated** ("my friend still shows 🔥30 but quit a week ago"). It does NOT
affect the user's own view (their client recomputes live on render).

A nightly server-side recompute keeps friends' Standings accurate for inactive
users.

## Decisions already made (brainstorm)

1. **Engine location — Deno Edge Function reusing `streakEngine.ts`.** The
   function imports the EXACT `src/lib/streakEngine.ts` + `src/utils/dateUtils.js`
   the client uses (both confirmed pure / dependency-free / ESM, so Deno runs them
   verbatim). Rejected: reimplementing `computeState` in SQL/plpgsql — it would
   duplicate the freeze/rest-day rules in two places and risk the exact
   client/server drift the engine was written to prevent.

2. **Scheduling — `pg_cron` + `pg_net`, in a migration.** Enable both extensions
   and schedule a nightly HTTP POST to the Edge Function from Postgres, checked in
   under `supabase/migrations/` alongside the existing SQL (self-contained,
   version-controlled). Rejected: Dashboard cron (schedule lives out-of-repo) and
   GitHub Actions cron (external dep + extra secret).

## Known caveat: timezone

`streakEngine`/`toDateKey`/`isRestDay` use the runtime's **local** time, which on
a Supabase Edge Function is **UTC**. So the server's "today" and weekday are
UTC-based; at timezone edges a snapshot could be recomputed up to a day
early/late. It **self-corrects when the user next opens the app** (client
recomputes in their real local tz). Since this only affects how an *inactive*
user appears to friends, UTC is an acceptable approximation — document it rather
than build per-user timezone storage (which we don't have).

## Sketch of the remaining design (not yet ratified)

- **Edge Function `supabase/functions/recompute-streaks/`:** runs with
  `service_role` (env `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` auto-injected).
  Fetch all `profiles (id, prefs)` and all `day_logs (user_id, date, status)`;
  group logs by user in memory; for each user build `DayRecords`, pull `restDays`
  from `prefs`, run `computeState(records, restDays, new Date())`, and update the
  profile's `current_streak` / `longest_streak` / `last_logged_date` /
  `streak_updated_at`. Per-user compute errors are collected, not fatal — the run
  continues and returns a `{ updated, failed }` summary.
- **Testability:** extract a pure helper (e.g. `computeProfileSnapshot(logs,
  prefs, today)` → `{ current_streak, longest_streak, last_logged_date }`) kept
  free of the Supabase client, unit-tested with `node --experimental-strip-types
  --test` (the engine itself is already covered by `streakEngine.test.ts`). The
  Supabase I/O glue is verified manually.
- **Migration `0003_recompute_cron.sql`:** `create extension pg_cron` +
  `pg_net`; `cron.schedule(...)` a nightly `net.http_post` to the function URL
  with an `Authorization: Bearer <service_role>` header (store the key/URL via
  Vault or a settings row rather than inlining).
- **Auth of the cron→function call:** default Edge Function JWT verification
  passes for a `service_role` bearer; optionally add a `CRON_SECRET` header check
  for defense-in-depth.
- **Docs:** add deploy steps to `SUPABASE_SETUP.md` (`supabase functions deploy
  recompute-streaks`, set secrets, run the migration).

## Cheaper alternative that needs NO server (fallback if we never build this)

Compute a **staleness** flag client-side: if a friend's `last_logged_date` is
more than ~1–2 days behind now, render their streak dimmed / with an "· inactive"
note instead of trusting the number. Fixes the *misleading* part with zero
infrastructure. (Not implemented either — noted as an option.)

## When picked up

Resume from the brainstorming flow (architecture section was mid-approval),
finish the design sections, write the spec + plan, then implement.
