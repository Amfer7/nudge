# Supabase setup (Phase 1: cloud sync + optional auth)

The code for cloud sync is merged, but it stays **completely dormant** until you
provision a Supabase project and set two env vars. With no env vars, Nudge runs
exactly as the offline, local-only app — this is by design (anonymous-first).

Do these steps once to turn sync on.

## 1. Create the project
1. Go to <https://supabase.com> → **New project**. Pick a name/region, set a DB
   password (save it).
2. Wait for it to finish provisioning.

## 2. Run the migrations
The schema, Row-Level Security, and the `redeem_invite` RPC live in
`supabase/migrations/`. Apply them in order.

**Option A — dashboard (simplest):** open **SQL Editor** → paste the contents of
`supabase/migrations/0001_init.sql`, run it → then paste
`supabase/migrations/0002_rls_and_rpc.sql`, run it.

**Option B — CLI:**
```bash
npm i -g supabase
supabase link --project-ref <your-project-ref>
supabase db push
```

## 3. Configure auth
In the dashboard → **Authentication**:
1. **Providers → Email:** enable it. For quick testing you can turn *off*
   "Confirm email"; leave it on for production.
2. **Providers → Google:** enable, then paste a Google OAuth **Client ID** and
   **Client secret**. Create those at
   <https://console.cloud.google.com> → *APIs & Services → Credentials → OAuth
   client ID → Web application*. In the Google client, add this **Authorized
   redirect URI** (copy it from the Supabase Google provider screen — it looks
   like `https://<project-ref>.supabase.co/auth/v1/callback`).
3. **URL Configuration:**
   - *Site URL:* your app origin (e.g. `http://localhost:5173` for dev, and your
     Vercel URL for prod).
   - *Redirect URLs:* add `http://localhost:5173/auth/callback` and
     `https://<your-domain>/auth/callback`. The app always returns to
     `/auth/callback` after OAuth.

## 4. Set the env vars
From the dashboard → **Settings → API**, copy the **Project URL** and the
**anon public** key. Then:
```bash
cp .env.example .env.local
```
Fill in:
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```
(Both are public and safe in the client bundle — RLS is what protects data.
Never put the `service_role` key here.) Restart `npm run dev`.

On Vercel, add the same two vars under **Project → Settings → Environment
Variables** and redeploy.

## 5. SPA routing for the OAuth callback (prod only)
The app now uses client-side routing (`/auth/callback`). Static hosts must fall
back to `index.html` for unknown paths. Vercel does this automatically for Vite
projects; if you see a 404 on `/auth/callback`, add a `vercel.json`:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

## What works after this
- **Settings → Sign in to sync**: Google + email/password. Anonymous users see
  no change.
- First sign-in asks for a **username** and creates your `profiles` row + a
  personal invite code.
- Your **raw log + rest-day prefs** sync to `day_logs` / `profiles.prefs`; the
  denormalized `current_streak` is recomputed on every change. localStorage
  stays the offline cache (write-through).
- Sign out → back to local-only.

## Verifying it (matches plan.md "Verification")
- **Auth/sync:** sign in on two browsers with the same account → the second
  shows the synced log/streak.
- **RLS:** with two accounts, confirm in the SQL editor that user A cannot
  `select` user B's `day_logs`.
- **Migration:** log some days offline, then sign in → those days appear in
  `day_logs`.

## Friends + invite (Phase 2, part 1 — shipped)
- The **Friends** overlay: your invite QR/code with copy/share, an add-a-friend
  box, and your friends list (each friend's `@username` + current streak).
- The `/add/:code` deep link: opening a shared invite redeems it; if you're
  signed out it's stashed and auto-redeemed once you sign in.
- Uses the Phase-1 plumbing (`friendships`, `invite_codes`, `redeem_invite`) —
  no new migration required.

## Still local-only (Phase 2 rest / Phase 3)
- The friends **leaderboard** (ranked view) — separate spec.
- The nightly `recompute-streaks` Edge Function (`current_streak` is currently
  recomputed on every sync, which keeps friends' streaks live without it).
- Unfriend (needs a new `friendships` DELETE policy / RPC).
- Syncing workouts / PRs / exercise-completion (Phase 3).
