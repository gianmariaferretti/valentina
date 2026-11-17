-- Gianmaria's control panel (/admin). Additive, service-role-only, forced RLS.
--
-- content_overrides: what the panel adds or changes on top of the content in
--   the code. Same key as the code (coupon id, letter slug) to edit it; a new
--   key to add something. kind = 'coupon' | 'letter' | 'setting'.
-- coupon_deliveries: "consegnato" marks for redeemed coupons.
-- admin_reset_casino: a fresh casino season from the panel, archiving the
--   kiss debt exactly like redeeming a casino coupon does.

begin;

create table public.content_overrides (
  kind text not null check (kind in ('coupon', 'letter', 'setting')),
  key text not null check (key ~ '^[a-z0-9][a-z0-9-]{0,99}$'),
  data jsonb not null default '{}'::jsonb check (jsonb_typeof(data) = 'object'),
  hidden boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (kind, key)
);

create table public.coupon_deliveries (
  user_id uuid not null,
  coupon_id text not null check (length(coupon_id) between 1 and 100),
  delivered_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, coupon_id)
);

create trigger set_content_overrides_updated_at
before update on public.content_overrides
for each row execute function public.set_updated_at();

alter table public.content_overrides enable row level security;
alter table public.content_overrides force row level security;
alter table public.coupon_deliveries enable row level security;
alter table public.coupon_deliveries force row level security;

revoke all on public.content_overrides from public, anon, authenticated;
revoke all on public.coupon_deliveries from public, anon, authenticated;
grant select, insert, update, delete on public.content_overrides to service_role;
grant select, insert, update, delete on public.coupon_deliveries to service_role;

create function public.admin_reset_casino(
  p_user_id uuid,
  p_expected_version integer,
  p_balance integer,
  p_state jsonb,
  p_reset_debt boolean
)
returns table (version integer, season integer)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_version integer;
  current_season integer;
  current_debt integer;
begin
  if p_user_id is null
    or p_expected_version is null or p_expected_version < 1
    or p_balance is null or p_balance < 0
    or jsonb_typeof(p_state) is distinct from 'object'
    or p_reset_debt is null then
    raise exception 'Invalid casino reset.';
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

  return query select current_version + 1, current_season + 1;
end;
$$;

revoke all on function public.admin_reset_casino(uuid, integer, integer, jsonb, boolean)
  from public, anon, authenticated;
grant execute on function public.admin_reset_casino(uuid, integer, integer, jsonb, boolean)
  to service_role;

commit;
