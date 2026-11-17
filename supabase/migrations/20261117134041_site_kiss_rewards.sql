-- Phase 5: the whole site gives 💋 to spend at the Kiss Casino.
-- Additive, service-role-only, forced RLS, like the previous migrations.
-- Each event is credited at most once, ever: (user_id, event_key) is the
-- primary key, and the credit and the casino balance change together.

begin;

create table public.kiss_credits (
  user_id uuid not null,
  -- "<kind>:<id>", e.g. "game:snake", "letter:bad-day", "bucket:<uuid>".
  event_key text not null check (event_key ~ '^[a-z0-9-]{1,30}:[A-Za-z0-9._:-]{1,120}$'),
  amount integer not null check (amount between 1 and 100000),
  label text not null check (length(label) between 1 and 160),
  created_at timestamptz not null default timezone('utc', now()),
  -- Set once the toast has been shown to Valentina.
  announced_at timestamptz,
  primary key (user_id, event_key)
);

create index kiss_credits_user_created_idx
  on public.kiss_credits (user_id, created_at desc);
create index kiss_credits_unannounced_idx
  on public.kiss_credits (user_id) where announced_at is null;

alter table public.kiss_credits enable row level security;
alter table public.kiss_credits force row level security;
revoke all on public.kiss_credits from public, anon, authenticated;
grant select, insert, update, delete on public.kiss_credits to service_role;

-- Records the event and adds the kisses to the casino balance in one
-- transaction. Returns the new balance, or null if the event was already
-- credited. p_initial_state is used only when the casino was never opened.
create function public.credit_site_kisses(
  p_user_id uuid,
  p_key text,
  p_amount integer,
  p_label text,
  p_initial_state jsonb
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_balance integer;
begin
  if p_user_id is null or p_key is null or p_amount is null
    or p_amount < 1 or p_amount > 100000
    or jsonb_typeof(p_initial_state) is distinct from 'object' then
    raise exception 'Invalid kiss credit.';
  end if;

  insert into public.kiss_credits (user_id, event_key, amount, label)
  values (p_user_id, p_key, p_amount, p_label)
  on conflict (user_id, event_key) do nothing;
  if not found then
    return null;
  end if;

  update public.casino_state
     set balance = balance + p_amount,
         state = jsonb_set(state, '{balance}', to_jsonb(balance + p_amount)),
         version = version + 1,
         updated_at = timezone('utc', now())
   where user_id = p_user_id
  returning balance into new_balance;

  if not found then
    new_balance := coalesce((p_initial_state ->> 'balance')::integer, 0) + p_amount;
    insert into public.casino_state (user_id, version, balance, debt, state)
    values (
      p_user_id,
      1,
      new_balance,
      0,
      jsonb_set(p_initial_state, '{balance}', to_jsonb(new_balance))
    );
  end if;

  return new_balance;
end;
$$;

revoke all on function public.credit_site_kisses(uuid, text, integer, text, jsonb)
  from public, anon, authenticated;
grant execute on function public.credit_site_kisses(uuid, text, integer, text, jsonb)
  to service_role;

-- Marks the given credits as shown and returns them (oldest first).
create function public.take_kiss_announcements(p_user_id uuid)
returns table (event_key text, amount integer, label text, created_at timestamptz)
language sql
security invoker
set search_path = ''
as $$
  update public.kiss_credits k
     set announced_at = timezone('utc', now())
   where k.user_id = p_user_id and k.announced_at is null
  returning k.event_key, k.amount, k.label, k.created_at;
$$;

revoke all on function public.take_kiss_announcements(uuid)
  from public, anon, authenticated;
grant execute on function public.take_kiss_announcements(uuid) to service_role;

-- Bucket-list ticks already paid before this migration count as credited,
-- so they are never paid twice.
insert into public.kiss_credits (user_id, event_key, amount, label, created_at, announced_at)
select s.user_id,
       'bucket:' || l.id,
       (l.reward ->> 'kisses')::integer,
       left('Bucket list: ' || l.title, 160),
       l.rewarded_at,
       l.rewarded_at
  from public.life_lists l
  cross join (select distinct user_id from public.casino_state) s
 where l.rewarded_at is not null
   and (l.reward ->> 'kisses') ~ '^[0-9]{1,6}$'
   and (l.reward ->> 'kisses')::integer between 1 and 100000
on conflict (user_id, event_key) do nothing;

commit;
