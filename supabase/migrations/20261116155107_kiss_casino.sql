-- Kiss Casino: additive, service-role-only persistence.
-- Draws are computed on the server (crypto.randomInt) and committed here
-- atomically with an optimistic version check, so concurrent tabs or devices
-- can never double-spend a balance or lose a debt entry.
-- No existing table is altered. Casino wins also unlock their coupon in the
-- existing coupon_state table, so the normal redemption flow applies.

begin;

create table public.casino_state (
  user_id uuid primary key,
  version integer not null default 0 check (version >= 0),
  balance integer not null check (balance between 0 and 100000000),
  debt integer not null check (debt between 0 and 100000000),
  state jsonb not null check (jsonb_typeof(state) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.casino_wins (
  user_id uuid not null,
  coupon_id text not null check (coupon_id ~ '^casino-c[0-9]{3,6}$'),
  code text not null check (code ~ '^GV-C[0-9]{3,6}$'),
  prize_id text not null check (length(prize_id) between 1 and 80),
  setting text not null check (setting in ('together', 'apart')),
  won_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, coupon_id),
  unique (user_id, code)
);

create table public.casino_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null,
  kind text not null check (kind in ('purchase', 'piggy', 'interest', 'payment', 'forgiven')),
  real_kisses integer not null check (real_kisses <> 0 and abs(real_kisses) <= 1000000),
  chips integer not null default 0 check (chips >= 0),
  label text not null check (length(label) between 1 and 120),
  created_at timestamptz not null default timezone('utc', now()),
  check (
    (kind in ('purchase', 'piggy', 'interest') and real_kisses > 0)
    or (kind in ('payment', 'forgiven') and real_kisses < 0)
  )
);

create index casino_ledger_user_created_idx
  on public.casino_ledger (user_id, created_at desc);
create index casino_wins_user_won_idx
  on public.casino_wins (user_id, won_at desc);

create trigger set_casino_state_updated_at
before update on public.casino_state
for each row execute function public.set_updated_at();

alter table public.casino_state enable row level security;
alter table public.casino_state force row level security;
alter table public.casino_wins enable row level security;
alter table public.casino_wins force row level security;
alter table public.casino_ledger enable row level security;
alter table public.casino_ledger force row level security;

revoke all on public.casino_state from public, anon, authenticated;
revoke all on public.casino_wins from public, anon, authenticated;
revoke all on public.casino_ledger from public, anon, authenticated;

grant select, insert, update on public.casino_state to service_role;
grant select, insert on public.casino_wins to service_role;
grant select, insert on public.casino_ledger to service_role;

-- Atomically: check the expected version, verify the debt matches the ledger
-- delta, append ledger rows, record wins (and unlock their coupons), and save
-- the new state. Returns the new version.
create function public.commit_casino_state(
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

  select version, debt into current_version, current_debt
  from public.casino_state
  where user_id = p_user_id
  for update;

  if not found then
    if p_expected_version <> 0 then
      raise exception 'casino_version_conflict' using errcode = '40001';
    end if;
    current_version := 0;
    current_debt := 0;
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
    insert into public.casino_ledger (user_id, kind, real_kisses, chips, label, created_at)
    values (
      p_user_id,
      entry ->> 'kind',
      (entry ->> 'realKisses')::integer,
      coalesce((entry ->> 'chips')::integer, 0),
      entry ->> 'label',
      coalesce((entry ->> 'at')::timestamptz, timezone('utc', now()))
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

  insert into public.casino_state (user_id, version, balance, debt, state)
  values (p_user_id, current_version + 1, p_balance, p_debt, p_state)
  on conflict (user_id) do update
    set version = excluded.version,
        balance = excluded.balance,
        debt = excluded.debt,
        state = excluded.state;

  return current_version + 1;
end;
$$;

revoke all on function public.commit_casino_state(uuid, integer, integer, integer, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.commit_casino_state(uuid, integer, integer, integer, jsonb, jsonb, jsonb)
  to service_role;

commit;
