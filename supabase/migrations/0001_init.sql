-- Nudge Phase 1 schema.
-- Design: the raw day log is the single source of truth and is PRIVATE to each
-- user. Streak/freezes are derived, never stored. Only a denormalized snapshot
-- of a user's streak is exposed to friends (see profiles + RLS in 0002).

-- ---------------------------------------------------------------------------
-- profiles: one row per user. Public-to-friends fields + private prefs.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                uuid primary key references auth.users (id) on delete cascade,
  username          text not null,
  display_name      text,
  avatar_url        text,
  prefs             jsonb not null default '{}'::jsonb,
  -- Denormalized leaderboard snapshot (recomputed on each sync + nightly cron).
  current_streak    integer not null default 0,
  longest_streak    integer not null default 0,
  last_logged_date  date,
  streak_updated_at timestamptz,
  created_at        timestamptz not null default now(),
  constraint username_format check (username = lower(username)),
  constraint username_length check (char_length(username) between 3 and 30)
);

-- Case-insensitive uniqueness (usernames are stored lowercase already).
create unique index if not exists profiles_username_key
  on public.profiles (lower(username));

-- ---------------------------------------------------------------------------
-- day_logs: the normalized raw log. Only user-authored statuses are stored;
-- frozen days are derived by the streak engine and never persisted.
-- ---------------------------------------------------------------------------
create table if not exists public.day_logs (
  user_id    uuid not null references auth.users (id) on delete cascade,
  date       date not null,
  status     text not null check (status in ('logged', 'blocked')),
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- ---------------------------------------------------------------------------
-- invite_codes: one stable personal code per user (their QR in Phase 2).
-- ---------------------------------------------------------------------------
create table if not exists public.invite_codes (
  code       text primary key,
  owner_id   uuid not null unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- friendships: directed two-row model. A redeem inserts BOTH directions
-- atomically via the redeem_invite() RPC (0002). Mutual, no accept step.
-- ---------------------------------------------------------------------------
create table if not exists public.friendships (
  user_id    uuid not null references auth.users (id) on delete cascade,
  friend_id  uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint no_self_friend check (user_id <> friend_id)
);
