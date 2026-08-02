# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Nudge** is a client-only, offline-first gamified workout streak tracker (React 19 + Vite). No backend, no accounts — all state lives in the browser's `localStorage`. The product philosophy is "forgiveness over perfection": missed days are softened by earned freezes, configurable rest days, and pre-blocked time off, rather than punished.

## Commands

```bash
npm run dev       # Vite dev server (exposes DEV-only time-travel controls, see below)
npm run build     # production build to dist/
npm run preview   # preview the production build
npm run lint      # ESLint (flat config) — see "Known issues": currently fails on a pre-existing baseline
npm run typecheck # tsc --noEmit (type-checks .ts/.tsx only)
npm test          # runs node:test across the repo
```

**TypeScript is being adopted incrementally.** `tsconfig.json` sets `allowJs: true` /
`checkJs: false`, so `.ts`/`.tsx` and the existing `.js`/`.jsx` coexist — only TypeScript
files are type-checked. Author new code in TS and convert existing files opportunistically
(logic-heavy modules first). ESLint has a separate `**/*.{ts,tsx}` block using `typescript-eslint`.

Run a single test file with the native test runner:

```bash
node --test src/hooks/useDayRecords.test.js
```

Tests use `node:test` + `node:assert/strict` directly (no Jest/Vitest). Pure logic functions are exported from `useDayRecords.js` specifically so they can be unit-tested without React.

## Architecture

The app is a single-page component tree with **no global store**. State is composed from independent custom hooks, each owning one persisted domain and reading/writing it through a repository layer.

- `src/main.jsx` → `src/App.jsx` → **`src/app/AppShell.jsx`** — `AppShell` is the real root: it wires all hooks to all components and owns UI-only state (which overlay is open, scroll/dock state, DEV panel). `App.jsx` is a trivial wrapper.
- **Repository layer** (`src/lib/repo/`) — the single seam over persistence. `types.ts` defines the typed (synchronous) `Repository` contract; `localRepo.ts` implements it over `localStorage` and owns **all** `localStorage` keys + defensive parsing (freeze-stripping, `normalizeRestDays`, defaults); `index.ts` exports the active `repo` (always `localRepo` today — this is where cloud sync will later choose `supabaseRepo`). `PRSection` is the one holdout not yet behind the repo (see below).
- **Hooks are the state layer** (`src/hooks/`). Each hook hydrates once via a **lazy `useState(() => repo.getX())` initializer** (not a mount effect — this is what keeps lint free of `set-state-in-effect`) and persists on change via `repo.saveX(...)` in a `useEffect`. If you add persistent state, add the domain to the `Repository` interface + `localRepo` and follow this exact pattern.
- **Server-state scaffold** — the app is wrapped in TanStack Query's `QueryClientProvider` (`src/app/Providers.jsx`, mounted in `main.jsx`; shared client in `src/lib/queryClient.ts`). There are **no query/mutation hooks yet** — there's no server state until the backend exists; they're authored with Supabase (plan.md Phase 1). The `AsyncRepository` interface (the Promise-returning mirror of `Repository`) is the contract `supabaseRepo` will implement; `asyncLocalRepo` (exported as `asyncRepo`) is a Promise wrapper over `localRepo` so the Query layer can be built/tested offline first.
- **Most components are presentational** (`src/components/`) and receive data + callbacks as props from `AppShell`. Styling is predominantly inline `style` objects using CSS custom properties (`var(--...)`). Exception: **`PRSection` is self-contained** — it owns its own `localStorage` (`nudge_pr_cards_v1`) via plain `useState`/`useEffect` and does *not* go through `AppShell`, the hook layer, or the repository. If you touch PRs, note it bypasses the repo/lazy-init pattern the hooks use.

### Streak engine — the core of the app

The streak/freeze logic lives in the pure, framework-agnostic module **`src/lib/streakEngine.ts`** (no React — so it can be reused server-side, e.g. the planned leaderboard recompute). The canonical data structure is `dayRecords`: a map of `"YYYY-MM-DD"` → `{ status }`. **Only `"logged"` and `"blocked"` are stored** (absence = a real miss). **Freezes are derived, never stored.**

The single source of truth is the raw log; everything else is a pure function of `(log, restDays, today)`:
- **`computeState(records, restDays, today)`** — the main entry point. Replays history chronologically and returns `{ currentStreak, longestStreak, availableFreezes, frozenDays: Set, lastLoggedDate }`. `useDayRecords` calls this on render (React Compiler memoizes it — no manual `useMemo`) and exposes `displayRecords` (log + derived frozen days) for the calendar.
- `calculateStreak` — walks backward from today; `logged` increments, `freeze`/`blocked`/rest-day neutral, an unrecorded non-rest day breaks. An unlogged *today* is skipped so the streak holds until a day is actually missed.
- `hasSixConsecutiveLoggedDays` / `evaluateFreezeSpend` — helper predicates (the latter powers the DEV readout).

Freeze rules (all derived inside `computeState`): earn 1 freeze per 6 consecutive logged days, at most 1 per rolling 7 days, capped at **3**; a freeze is auto-spent to cover the nearest past unplanned miss. Because freezes are derived, `undoToday` just deletes the day — no freeze bookkeeping — and there is no effect cascade.

> History: freezes used to be *stored* in a `meta` object and synced via mutating `useEffect`s; that (and a dead `src/app/selectors.js` duplicate) were removed when the engine moved to `streakEngine.ts`. See `changes.txt` for the rationale.

### Rest days vs. blocked days vs. freezes — don't conflate

- **Rest days** are recurring weekdays (default `[0]` = Sunday), configurable via `useStreakPreferences` (max 3). They never break a streak and never need logging. `isRestDay(date, restDays)` in `dateUtils.js` is the check; most streak functions take `restDays` as an argument.
- **Blocked days** are specific future dates the user pre-declares as time off. Neutral for streaks, stored as `{ status: "blocked" }`. Enforced rule (`BlockDatesOverlay`, `minDate = today + 2`): **at least 2 days ahead** (copy in `AppShell` and the overlay footer both reflect this).
- **Freezes** are a consumable resource that retroactively patch an *unplanned* miss.

### Dates

All date keys are **local-time** `YYYY-MM-DD` via `toDateKey` — never use `toISOString()` (UTC) for keys. Date helpers live in `src/utils/dateUtils.js`.

### DEV time simulation

`useDayRecords` exposes `dayOffset`/`setDayOffset`; `getToday()` adds the offset to the real date. `AppShell` renders a DEV-only panel (guarded by `import.meta.env.DEV`) with -7/-1/Today/+1/+7/Reset buttons and a `devSummary` readout, so you can exercise streak/freeze behavior across simulated days without waiting. This panel is stripped from production builds.

## Persistence & versioning

localStorage keys (note the legacy `fitness_` prefix from the app's original name; PR section uses `nudge_`) are centralized in `src/lib/repo/localRepo.ts` (`KEYS`), except the self-contained PR section:
`fitness_day_records`, `fitness_workouts_by_weekday`, `fitness_exercise_completion`, `fitness_streak_prefs`, `fitness_theme`, `nudge_pr_cards_v1`.

Because there is no schema migration layer, changing the shape of any stored object can silently break existing users. When you change a persisted structure, normalize/guard on read — the defensive parsing now lives in `localRepo.ts` (`normalizeRestDays`, `sanitizeDayRecords`, per-domain defaults); mirror that pattern there rather than in the hooks.

App name/version are centralized in `src/app/version.ts` and shown in the footer + `WhatsNewCard`. Bump these when cutting a release (commit history uses "Release vX.Y.Z").

## Theming

Themes are driven by `data-theme` on `<html>`, set by `useTheme`. Options are `dark` (the `:root` default), `light`, and `system` (resolves to dark/light via `prefers-color-scheme`). All colors are CSS custom properties defined in `src/styles/globals.css` — add new colors as variables there and reference them via `var(--...)` rather than hardcoding, so both themes stay consistent. (`src/index.css` is largely leftover Vite boilerplate.)

## PWA

The app is an installable, offline-first PWA via **`vite-plugin-pwa`** (configured in `vite.config.js`). `registerType: 'autoUpdate'` + `injectRegister: 'auto'` means the SW registration is injected automatically (no `virtual:pwa-register` import in app code) and updates apply on next load. The manifest + Workbox SW are only emitted by `npm run build` (check `dist/manifest.webmanifest`, `dist/sw.js`); dev output lands in the git-ignored `dev-dist/`. Icons live in `public/` (`pwa-64/192/512`, `maskable-icon-512`, `apple-touch-icon`) — they're composited onto a dark canvas from the portrait `public/logo.jpg`; **regenerate the whole set together** if the logo changes so sizes/background stay consistent.

**Local reminders** are a scaffold, not server push. `src/lib/notifications.ts` holds the Notification API wrappers plus the pure, unit-tested `msUntilNextDaily`; `useReminders` arms a daily `setTimeout` *while the app is open* and persists its preference (`ReminderPrefs`, key `nudge_reminders`) through the repository layer. True background push (fires when the app is closed) needs user identity + push tokens and is deferred to the database phase.

## Conventions

- ESLint `no-unused-vars` ignores names matching `^[A-Z_]` (so unused capitalized imports/constants won't error).
- React Compiler is enabled (`babel-plugin-react-compiler` in `vite.config.js`) — avoid manual `useMemo`/`useCallback` micro-optimizations; let the compiler handle memoization.

## Known issues

`npm run lint` is **green (0 problems)** — keep it that way. The former baseline (7 `set-state-in-effect` errors + 1 `exhaustive-deps` warning) was cleared in Step 3 by moving hydration to lazy `useState(() => repo.getX())` initializers, resetting `CalendarOverlay`'s month during render instead of in an effect, and letting `StreakHero`'s rAF tick drive the count-up. If you reintroduce a mount-effect `setState` for persistence, you'll bring the errors back — use the repo + lazy-init pattern instead.
