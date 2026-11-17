-- Access security: login attempt limits, revocable sessions and an access log.
-- Additive, service-role-only, forced RLS, like the previous migrations.
-- Also closes two small RLS gaps from the security audit (A9): forced RLS on
-- the italian_* tables and an explicit revoke from public on the first seven.

begin;

-- "Log out of every device": sessions issued before revoked_before are invalid.
create table public.auth_revocations (
  scope text primary key check (scope in ('visitor', 'admin')),
  revoked_before timestamptz not null,
  updated_at timestamptz not null default timezone('utc', now())
);

-- Sliding-window counters for login attempts, per scope and fingerprint
-- (an HMAC of the client IP, or 'global' for the site-wide ceiling).
create table public.auth_attempts (
  scope text not null check (scope in ('visitor', 'admin', 'contract')),
  fingerprint text not null check (length(fingerprint) between 6 and 128),
  window_started_at timestamptz not null default timezone('utc', now()),
  attempts integer not null default 1 check (attempts between 0 and 100000),
  primary key (scope, fingerprint)
);

-- Recent logins and failures, shown in the control panel. Kept 90 days.
create table public.auth_events (
  id bigint generated always as identity primary key,
  scope text not null check (scope in ('visitor', 'admin', 'contract')),
  kind text not null check (kind in ('login', 'failed', 'blocked', 'logout_all')),
  fingerprint text check (fingerprint is null or length(fingerprint) between 6 and 128),
  detail text check (detail is null or length(detail) <= 160),
  created_at timestamptz not null default timezone('utc', now())
);

create index auth_events_created_idx on public.auth_events (created_at desc);

alter table public.auth_revocations enable row level security;
alter table public.auth_revocations force row level security;
alter table public.auth_attempts enable row level security;
alter table public.auth_attempts force row level security;
alter table public.auth_events enable row level security;
alter table public.auth_events force row level security;

revoke all on public.auth_revocations from public, anon, authenticated;
revoke all on public.auth_attempts from public, anon, authenticated;
revoke all on public.auth_events from public, anon, authenticated;
grant select on public.auth_revocations to service_role;
grant select on public.auth_events to service_role;

-- Counts one attempt and answers whether it is still allowed.
create function public.register_auth_attempt(
  p_scope text,
  p_fingerprint text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_attempts integer;
begin
  if p_limit is null or p_limit < 1 or p_limit > 1000
    or p_window_seconds is null or p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'Invalid attempt limit.';
  end if;

  insert into public.auth_attempts as a (scope, fingerprint, attempts)
  values (p_scope, p_fingerprint, 1)
  on conflict (scope, fingerprint) do update
  set window_started_at = case
        when a.window_started_at < timezone('utc', now()) - make_interval(secs => p_window_seconds)
        then timezone('utc', now()) else a.window_started_at end,
      attempts = case
        when a.window_started_at < timezone('utc', now()) - make_interval(secs => p_window_seconds)
        then 1 else least(a.attempts + 1, 100000) end
  returning attempts into saved_attempts;

  return saved_attempts <= p_limit;
end;
$$;

-- A successful login clears that fingerprint's counter.
create function public.clear_auth_attempts(p_scope text, p_fingerprint text)
returns void
language sql
security invoker
set search_path = ''
as $$
  delete from public.auth_attempts
  where scope = p_scope and fingerprint = p_fingerprint;
$$;

create function public.record_auth_event(
  p_scope text,
  p_kind text,
  p_fingerprint text,
  p_detail text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  insert into public.auth_events (scope, kind, fingerprint, detail)
  values (p_scope, p_kind, p_fingerprint, left(p_detail, 160));
  delete from public.auth_events
  where created_at < timezone('utc', now()) - interval '90 days';
end;
$$;

create function public.revoke_all_sessions(p_scope text, p_revoked_before timestamptz)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_revoked_before is null
    or p_revoked_before > timezone('utc', now()) + interval '1 minute' then
    raise exception 'Invalid revocation time.';
  end if;
  insert into public.auth_revocations (scope, revoked_before)
  values (p_scope, p_revoked_before)
  on conflict (scope) do update
    set revoked_before = greatest(public.auth_revocations.revoked_before, excluded.revoked_before),
        updated_at = timezone('utc', now());
  insert into public.auth_events (scope, kind) values (p_scope, 'logout_all');
end;
$$;

revoke all on function public.register_auth_attempt(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.clear_auth_attempts(text, text) from public, anon, authenticated;
revoke all on function public.record_auth_event(text, text, text, text) from public, anon, authenticated;
revoke all on function public.revoke_all_sessions(text, timestamptz) from public, anon, authenticated;
grant execute on function public.register_auth_attempt(text, text, integer, integer) to service_role;
grant execute on function public.clear_auth_attempts(text, text) to service_role;
grant execute on function public.record_auth_event(text, text, text, text) to service_role;
grant execute on function public.revoke_all_sessions(text, timestamptz) to service_role;

-- Audit A9.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'italian_corner_attempts', 'italian_lesson_progress',
    'italian_exercise_results', 'italian_vocabulary_review', 'italian_level_exams'
  ] loop
    execute format('alter table public.%I force row level security', table_name);
  end loop;
  foreach table_name in array array[
    'site_progress', 'coupon_state', 'challenge_scores', 'quiz_attempts',
    'letter_state', 'achievements', 'discoveries'
  ] loop
    execute format('revoke all on table public.%I from public', table_name);
  end loop;
end $$;

commit;
