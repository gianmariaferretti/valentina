-- Real notifications for Gianmaria (email via Resend) and hearts for Valentina.
-- Additive, service-role-only, forced RLS, like the previous migrations.
--
-- notification_outbox: every email, with its status (pending, sent, failed),
--   attempts and last error. Retried later; never blocks the site.
-- email_action_tokens: one row per signed link in an email (single use,
--   expires after 7 days). The link itself carries an HMAC signature.
-- miss_you_taps: each tap of "Miss you"; taps are bundled into the next email.
-- hearts: hearts sent back by Gianmaria, shown to Valentina until seen.

begin;

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('coupon_redeemed', 'miss_you', 'digest', 'test')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  subject text not null check (length(subject) between 1 and 200),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempts integer not null default 0 check (attempts between 0 and 100),
  last_error text check (last_error is null or length(last_error) <= 500),
  provider_id text check (provider_id is null or length(provider_id) <= 200),
  created_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now())
);

create index notification_outbox_created_idx
  on public.notification_outbox (created_at desc);
create index notification_outbox_pending_idx
  on public.notification_outbox (status, created_at)
  where status <> 'sent';

create table public.email_action_tokens (
  nonce text primary key check (nonce ~ '^[A-Za-z0-9_-]{16,64}$'),
  action text not null check (action in ('deliver', 'heart')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create table public.miss_you_taps (
  id bigint generated always as identity primary key,
  tapped_at timestamptz not null default timezone('utc', now()),
  notified_at timestamptz
);

create index miss_you_taps_pending_idx
  on public.miss_you_taps (tapped_at)
  where notified_at is null;

create table public.hearts (
  id uuid primary key default gen_random_uuid(),
  message text check (message is null or length(message) between 1 and 140),
  source text not null default 'panel' check (source in ('panel', 'email')),
  created_at timestamptz not null default timezone('utc', now()),
  seen_at timestamptz
);

create index hearts_unseen_idx on public.hearts (created_at) where seen_at is null;

create trigger set_notification_outbox_updated_at
before update on public.notification_outbox
for each row execute function public.set_updated_at();

alter table public.notification_outbox enable row level security;
alter table public.notification_outbox force row level security;
alter table public.email_action_tokens enable row level security;
alter table public.email_action_tokens force row level security;
alter table public.miss_you_taps enable row level security;
alter table public.miss_you_taps force row level security;
alter table public.hearts enable row level security;
alter table public.hearts force row level security;

revoke all on public.notification_outbox from public, anon, authenticated;
revoke all on public.email_action_tokens from public, anon, authenticated;
revoke all on public.miss_you_taps from public, anon, authenticated;
revoke all on public.hearts from public, anon, authenticated;
grant select, insert, update, delete on public.notification_outbox to service_role;
grant select, insert, update on public.email_action_tokens to service_role;
grant select, insert, update on public.miss_you_taps to service_role;
grant select, insert, update on public.hearts to service_role;

-- Marks a link as used, atomically: true only for the first use, before expiry.
create function public.use_email_action_token(p_nonce text)
returns table (action text, payload jsonb)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return query
  update public.email_action_tokens t
     set used_at = timezone('utc', now())
   where t.nonce = p_nonce
     and t.used_at is null
     and t.expires_at > timezone('utc', now())
  returning t.action, t.payload;
end;
$$;

-- Claims the taps not yet emailed, atomically, if the last "Miss you" email
-- left at least p_gap_seconds ago. Returns how many taps the email carries
-- (0 = wait: they will go in the next email).
create function public.claim_miss_you_taps(p_gap_seconds integer)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  last_sent timestamptz;
  claimed integer;
begin
  perform pg_advisory_xact_lock(hashtext('miss_you_taps'));
  select max(notified_at) into last_sent from public.miss_you_taps;
  if last_sent is not null
     and last_sent > timezone('utc', now()) - make_interval(secs => p_gap_seconds) then
    return 0;
  end if;
  update public.miss_you_taps
     set notified_at = timezone('utc', now())
   where notified_at is null;
  get diagnostics claimed = row_count;
  return claimed;
end;
$$;

revoke all on function public.use_email_action_token(text) from public, anon, authenticated;
revoke all on function public.claim_miss_you_taps(integer) from public, anon, authenticated;
grant execute on function public.use_email_action_token(text) to service_role;
grant execute on function public.claim_miss_you_taps(integer) to service_role;

commit;
