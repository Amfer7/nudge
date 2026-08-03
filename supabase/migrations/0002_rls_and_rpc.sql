-- Row-Level Security + the redeem_invite RPC.
-- Privacy is the whole point: the anon key is public, so ALL protection lives
-- here. Treat these policies as security-critical.

alter table public.profiles     enable row level security;
alter table public.day_logs     enable row level security;
alter table public.invite_codes enable row level security;
alter table public.friendships  enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
--   * read your own row
--   * read a friend's row (friends only ever see username/display_name/avatar/
--     current_streak — the raw log is never here)
--   * insert / update only your own row
-- ---------------------------------------------------------------------------
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_select_friends"
  on public.profiles for select
  using (
    exists (
      select 1 from public.friendships f
      where f.user_id = auth.uid()
        and f.friend_id = public.profiles.id
    )
  );

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- day_logs: fully private. CRUD your own rows only. Friends NEVER see the log.
-- ---------------------------------------------------------------------------
create policy "day_logs_all_own"
  on public.day_logs for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- invite_codes: read + create only your own code. Redemption of *someone
-- else's* code goes through the SECURITY DEFINER function below (which bypasses
-- RLS), so no cross-user SELECT policy is needed.
-- ---------------------------------------------------------------------------
create policy "invite_codes_select_own"
  on public.invite_codes for select
  using (owner_id = auth.uid());

create policy "invite_codes_insert_own"
  on public.invite_codes for insert
  with check (owner_id = auth.uid());

-- ---------------------------------------------------------------------------
-- friendships: read your own edges. All writes go through redeem_invite (there
-- is deliberately no INSERT policy — only the definer function can write).
-- ---------------------------------------------------------------------------
create policy "friendships_select_own"
  on public.friendships for select
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- redeem_invite(code): the reciprocal-friendship pattern. Runs as the function
-- owner so it can insert the row the redeemer couldn't otherwise write (the
-- owner->redeemer edge). Guards self-redeem and duplicates.
-- ---------------------------------------------------------------------------
create or replace function public.redeem_invite(invite_code text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_me    uuid := auth.uid();
  v_username text;
begin
  if v_me is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select owner_id into v_owner
  from public.invite_codes
  where code = upper(btrim(invite_code));

  if v_owner is null then
    raise exception 'Invalid invite code' using errcode = 'P0002';
  end if;

  if v_owner = v_me then
    raise exception 'You cannot add yourself' using errcode = 'P0001';
  end if;

  -- Insert both directions atomically; idempotent if already friends.
  insert into public.friendships (user_id, friend_id)
  values (v_me, v_owner), (v_owner, v_me)
  on conflict do nothing;

  select username into v_username from public.profiles where id = v_owner;

  return json_build_object('owner_id', v_owner, 'username', v_username);
end;
$$;

revoke all on function public.redeem_invite(text) from public;
grant execute on function public.redeem_invite(text) to authenticated;
