-- Kiss Casino seasons: redeeming a coupon won at the casino resets the casino.
-- Additive only: two new columns with defaults, one index, a replaced commit
-- function (same signature) and one new function. No data is removed: the
-- kiss-debt ledger of a finished season stays, tagged with its season number.

begin;

alter table public.casino_state
  add column season integer not null default 1 check (season >= 1);

alter table public.casino_ledger
  add column season integer not null default 1 check (season >= 1);

create index casino_ledger_user_season_idx
  on public.casino_ledger (user_id, season, created_at desc);

-- Same contract as before; ledger rows are now tagged with the current season.
create or replace function public.commit_casino_state(
  p_user_id uuid,
  p_expected_version integer,
  p_balance integer,
  p_debt integer,
  p_state jsonb,
  p_wins jsonb,
  p_ledger jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_version integer;
  current_debt integer;
  current_season integer;
  ledger_delta integer;
  entry jsonb;
begin
  if p_user_id is null
    or p_expected_version is null or p_expected_version < 0
    or p_balance is null or p_balance < 0
    or p_debt is null or p_debt < 0
    or jsonb_typeof(p_state) is distinct from 'object'
    or jsonb_typeof(p_wins) is distinct from 'array'
    or jsonb_typeof(p_ledger) is distinct from 'array'
    or jsonb_array_length(p_wins) > 20
    or jsonb_array_length(p_ledger) > 20 then
    raise exception 'Invalid casino commit.';
  end if;

  select version, debt, season into current_version, current_debt, current_season
  from public.casino_state
  where user_id = p_user_id
  for update;

  if not found then
    if p_expected_version <> 0 then
      raise exception 'casino_version_conflict' using errcode = '40001';
    end if;
    current_version := 0;
    current_debt := 0;
    current_season := 1;
  elsif current_version <> p_expected_version then
    raise exception 'casino_version_conflict' using errcode = '40001';
  end if;

  select coalesce(sum((value ->> 'realKisses')::integer), 0)
    into ledger_delta
  from jsonb_array_elements(p_ledger);

  if p_debt <> current_debt + ledger_delta then
    raise exception 'Casino debt does not match its ledger.';
  end if;

  for entry in select value from jsonb_array_elements(p_ledger) loop
    insert into public.casino_ledger (user_id, kind, real_kisses, chips, label, created_at, season)
    values (
      p_user_id,
      entry ->> 'kind',
      (entry ->> 'realKisses')::integer,
      coalesce((entry ->> 'chips')::integer, 0),
      entry ->> 'label',
      coalesce((entry ->> 'at')::timestamptz, timezone('utc', now())),
      current_season
    );
  end loop;

  for entry in select value from jsonb_array_elements(p_wins) loop
    insert into public.casino_wins (user_id, coupon_id, code, prize_id, setting, won_at)
    values (
      p_user_id,
      entry ->> 'couponId',
      entry ->> 'code',
      entry ->> 'prizeId',
      entry ->> 'setting',
      coalesce((entry ->> 'wonAt')::timestamptz, timezone('utc', now()))
    );
    insert into public.coupon_state (user_id, coupon_id, unlocked_at)
    values (p_user_id, entry ->> 'couponId', timezone('utc', now()))
    on conflict (user_id, coupon_id) do update
      set unlocked_at = coalesce(public.coupon_state.unlocked_at, excluded.unlocked_at);
  end loop;

  insert into public.casino_state (user_id, version, balance, debt, state, season)
  values (
    p_user_id,
    current_version + 1,
    p_balance,
    p_debt,
    jsonb_set(p_state, '{season}', to_jsonb(current_season)),
    current_season
  )
  on conflict (user_id) do update
    set version = excluded.version,
        balance = excluded.balance,
        debt = excluded.debt,
        state = excluded.state;

  return current_version + 1;
end;
$$;

-- Redeems a coupon won at the casino and starts a fresh casino season, in one
-- transaction: either both happen or neither does. Each coupon works once.
create function public.redeem_casino_coupon_with_reset(
  p_user_id uuid,
  p_coupon_id text,
  p_redeemed_at timestamptz,
  p_expected_version integer,
  p_balance integer,
  p_state jsonb,
  p_reset_debt boolean
)
returns table (redeemed_at timestamptz, version integer, season integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_version integer;
  current_season integer;
  current_debt integer;
  existing_redeemed_at timestamptz;
begin
  if p_user_id is null
    or p_coupon_id is null or p_coupon_id !~ '^casino-c[0-9]{3,6}$'
    or p_redeemed_at is null
    or p_expected_version is null or p_expected_version < 1
    or p_balance is null or p_balance < 0
    or jsonb_typeof(p_state) is distinct from 'object'
    or p_reset_debt is null then
    raise exception 'Invalid casino redemption.';
  end if;

  select cs.version, cs.season, cs.debt
    into current_version, current_season, current_debt
  from public.casino_state cs
  where cs.user_id = p_user_id
  for update;

  if not found then
    raise exception 'casino_state_missing';
  elsif current_version <> p_expected_version then
    raise exception 'casino_version_conflict' using errcode = '40001';
  end if;

  perform 1 from public.casino_wins w
  where w.user_id = p_user_id and w.coupon_id = p_coupon_id;
  if not found then
    raise exception 'Not a Kiss Casino coupon.';
  end if;

  select c.redeemed_at into existing_redeemed_at
  from public.coupon_state c
  where c.user_id = p_user_id and c.coupon_id = p_coupon_id
  for update;
  if existing_redeemed_at is not null then
    raise exception 'coupon_already_redeemed';
  end if;

  insert into public.site_progress (user_id, last_visited_at)
  values (p_user_id, p_redeemed_at)
  on conflict (user_id) do update set last_visited_at = excluded.last_visited_at;

  insert into public.coupon_state (user_id, coupon_id, unlocked_at, redeemed_at)
  values (p_user_id, p_coupon_id, p_redeemed_at, p_redeemed_at)
  on conflict (user_id, coupon_id) do update
    set unlocked_at = coalesce(public.coupon_state.unlocked_at, excluded.unlocked_at),
        redeemed_at = excluded.redeemed_at;

  -- The finished season's ledger rows stay, tagged with their season.
  update public.casino_state cs
    set version = current_version + 1,
        season = current_season + 1,
        balance = p_balance,
        debt = case when p_reset_debt then 0 else current_debt end,
        state = jsonb_set(
          jsonb_set(p_state, '{season}', to_jsonb(current_season + 1)),
          '{debt}',
          to_jsonb(case when p_reset_debt then 0 else current_debt end)
        )
  where cs.user_id = p_user_id;

  return query select p_redeemed_at, current_version + 1, current_season + 1;
end;
$$;

revoke all on function public.redeem_casino_coupon_with_reset(uuid, text, timestamptz, integer, integer, jsonb, boolean)
  from public, anon, authenticated;
grant execute on function public.redeem_casino_coupon_with_reset(uuid, text, timestamptz, integer, integer, jsonb, boolean)
  to service_role;

commit;
