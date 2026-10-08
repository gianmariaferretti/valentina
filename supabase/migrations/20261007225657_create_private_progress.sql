begin;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.site_progress (
  user_id uuid primary key,
  memories_discovered integer not null default 0 check (memories_discovered >= 0),
  last_visited_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.coupon_state (
  user_id uuid not null,
  coupon_id text not null check (length(coupon_id) between 1 and 100),
  unlocked_at timestamptz,
  redeemed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, coupon_id),
  check (redeemed_at is null or unlocked_at is not null)
);

create table if not exists public.challenge_scores (
  user_id uuid not null,
  challenge_id text not null check (length(challenge_id) between 1 and 100),
  best_score integer not null default 0 check (best_score >= 0),
  attempts integer not null default 0 check (attempts >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, challenge_id)
);

create table if not exists public.quiz_attempts (
  user_id uuid not null,
  id uuid not null,
  status text not null default 'active' check (status in ('active', 'completed', 'abandoned')),
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz,
  score smallint check (score between 0 and 10),
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, id),
  check (
    (status = 'completed' and completed_at is not null and score is not null)
    or status <> 'completed'
  )
);

create table if not exists public.letter_state (
  user_id uuid not null,
  letter_slug text not null check (length(letter_slug) between 1 and 160),
  opened_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, letter_slug)
);

create table if not exists public.achievements (
  user_id uuid not null,
  achievement_id text not null check (length(achievement_id) between 1 and 120),
  unlocked_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, achievement_id)
);

create table if not exists public.discoveries (
  user_id uuid not null,
  discovery_id text not null check (length(discovery_id) between 1 and 160),
  discovery_type text not null check (discovery_type in ('reward', 'coupon', 'challenge', 'secret', 'memory')),
  source text not null check (length(source) between 1 and 120),
  discovered_at timestamptz not null default timezone('utc', now()),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, discovery_id)
);

create index if not exists challenge_scores_user_updated_idx
  on public.challenge_scores (user_id, updated_at desc);
create index if not exists quiz_attempts_user_status_idx
  on public.quiz_attempts (user_id, status, started_at desc);
create index if not exists discoveries_user_type_idx
  on public.discoveries (user_id, discovery_type, discovered_at desc);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'site_progress',
    'coupon_state',
    'challenge_scores',
    'quiz_attempts',
    'letter_state',
    'achievements',
    'discoveries'
  ] loop
    execute format(
      'drop trigger if exists %I on public.%I',
      'set_' || table_name || '_updated_at',
      table_name
    );
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      'set_' || table_name || '_updated_at',
      table_name
    );
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update, delete on table public.%I to service_role', table_name);
  end loop;
end;
$$;

create or replace function public.redeem_coupon_state(
  p_user_id uuid,
  p_coupon_id text,
  p_redeemed_at timestamptz
)
returns table (redeemed_at timestamptz)
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_redeemed_at timestamptz;
begin
  insert into public.site_progress (user_id, last_visited_at)
  values (p_user_id, p_redeemed_at)
  on conflict (user_id) do update set last_visited_at = excluded.last_visited_at;

  insert into public.coupon_state (user_id, coupon_id, unlocked_at, redeemed_at)
  values (p_user_id, p_coupon_id, p_redeemed_at, p_redeemed_at)
  on conflict (user_id, coupon_id) do update
    set unlocked_at = coalesce(public.coupon_state.unlocked_at, excluded.unlocked_at),
        redeemed_at = coalesce(public.coupon_state.redeemed_at, excluded.redeemed_at)
  returning public.coupon_state.redeemed_at into saved_redeemed_at;

  return query select saved_redeemed_at;
end;
$$;

create or replace function public.record_challenge_result(
  p_user_id uuid,
  p_challenge_id text,
  p_score integer,
  p_completed boolean,
  p_reward_coupon_id text,
  p_recorded_at timestamptz
)
returns table (
  challenge_id text,
  best_score integer,
  attempts integer,
  completed_at timestamptz,
  coupon_unlocked boolean
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_score public.challenge_scores%rowtype;
  was_unlocked boolean := false;
begin
  insert into public.site_progress (user_id, last_visited_at)
  values (p_user_id, p_recorded_at)
  on conflict (user_id) do update set last_visited_at = excluded.last_visited_at;

  insert into public.challenge_scores (
    user_id, challenge_id, best_score, attempts, completed_at
  ) values (
    p_user_id,
    p_challenge_id,
    p_score,
    1,
    case when p_completed then p_recorded_at else null end
  )
  on conflict (user_id, challenge_id) do update
    set best_score = greatest(public.challenge_scores.best_score, excluded.best_score),
        attempts = public.challenge_scores.attempts + 1,
        completed_at = coalesce(public.challenge_scores.completed_at, excluded.completed_at)
  returning * into saved_score;

  if p_completed then
    select not exists (
      select 1 from public.coupon_state
      where user_id = p_user_id
        and coupon_id = p_reward_coupon_id
        and unlocked_at is not null
    ) into was_unlocked;

    insert into public.coupon_state (user_id, coupon_id, unlocked_at)
    values (p_user_id, p_reward_coupon_id, p_recorded_at)
    on conflict (user_id, coupon_id) do update
      set unlocked_at = coalesce(public.coupon_state.unlocked_at, excluded.unlocked_at);

    insert into public.discoveries (
      user_id, discovery_id, discovery_type, source, discovered_at
    ) values
      (p_user_id, 'challenge:' || p_challenge_id, 'challenge', p_challenge_id, p_recorded_at),
      (p_user_id, 'coupon:' || p_reward_coupon_id, 'coupon', p_challenge_id, p_recorded_at)
    on conflict (user_id, discovery_id) do nothing;
  end if;

  return query select
    saved_score.challenge_id,
    saved_score.best_score,
    saved_score.attempts,
    saved_score.completed_at,
    was_unlocked;
end;
$$;

create or replace function public.open_letter_state(
  p_user_id uuid,
  p_letter_slug text,
  p_opened_at timestamptz,
  p_reward_id text default null,
  p_reward_coupon_id text default null
)
returns table (
  opened_at timestamptz,
  letter_was_new boolean,
  reward_was_new boolean,
  coupon_was_new boolean
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_opened_at timestamptz;
  new_letter boolean;
  new_reward boolean := false;
  new_coupon boolean := false;
begin
  select not exists (
    select 1 from public.letter_state
    where user_id = p_user_id and letter_slug = p_letter_slug
  ) into new_letter;

  insert into public.letter_state (user_id, letter_slug, opened_at)
  values (p_user_id, p_letter_slug, p_opened_at)
  on conflict (user_id, letter_slug) do update
    set opened_at = public.letter_state.opened_at
  returning public.letter_state.opened_at into saved_opened_at;

  if p_reward_id is not null then
    select not exists (
      select 1 from public.discoveries
      where user_id = p_user_id and discovery_id = p_reward_id
    ) into new_reward;

    insert into public.discoveries (
      user_id, discovery_id, discovery_type, source, discovered_at
    ) values (p_user_id, p_reward_id, 'reward', 'open-when:' || p_letter_slug, p_opened_at)
    on conflict (user_id, discovery_id) do nothing;
  end if;

  if p_reward_coupon_id is not null then
    select not exists (
      select 1 from public.coupon_state
      where user_id = p_user_id
        and coupon_id = p_reward_coupon_id
        and unlocked_at is not null
    ) into new_coupon;

    insert into public.coupon_state (user_id, coupon_id, unlocked_at)
    values (p_user_id, p_reward_coupon_id, p_opened_at)
    on conflict (user_id, coupon_id) do update
      set unlocked_at = coalesce(public.coupon_state.unlocked_at, excluded.unlocked_at);

    insert into public.discoveries (
      user_id, discovery_id, discovery_type, source, discovered_at
    ) values (
      p_user_id,
      'coupon:' || p_reward_coupon_id,
      'coupon',
      'open-when:' || p_letter_slug,
      p_opened_at
    ) on conflict (user_id, discovery_id) do nothing;
  end if;

  insert into public.site_progress (user_id, last_visited_at)
  values (p_user_id, p_opened_at)
  on conflict (user_id) do update set last_visited_at = excluded.last_visited_at;

  return query select saved_opened_at, new_letter, new_reward, new_coupon;
end;
$$;

create or replace function public.complete_quiz_attempt(
  p_user_id uuid,
  p_attempt_id uuid,
  p_answers jsonb,
  p_score smallint,
  p_completed_at timestamptz,
  p_achievement_id text default null,
  p_reward_id text default null,
  p_reward_coupon_id text default null
)
returns table (
  achievement_was_new boolean,
  reward_was_new boolean,
  coupon_was_new boolean
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_achievement boolean := false;
  new_reward boolean := false;
  new_coupon boolean := false;
begin
  update public.quiz_attempts
  set status = 'completed',
      answers = p_answers,
      score = p_score,
      completed_at = p_completed_at
  where user_id = p_user_id
    and id = p_attempt_id
    and status = 'active';

  if not found then
    raise exception 'Quiz attempt is missing or already completed.';
  end if;

  if p_achievement_id is not null then
    select not exists (
      select 1 from public.achievements
      where user_id = p_user_id and achievement_id = p_achievement_id
    ) into new_achievement;

    insert into public.achievements (user_id, achievement_id, unlocked_at)
    values (p_user_id, p_achievement_id, p_completed_at)
    on conflict (user_id, achievement_id) do nothing;
  end if;

  if p_reward_id is not null then
    select not exists (
      select 1 from public.discoveries
      where user_id = p_user_id and discovery_id = p_reward_id
    ) into new_reward;

    insert into public.discoveries (
      user_id, discovery_id, discovery_type, source, discovered_at
    ) values (p_user_id, p_reward_id, 'reward', 'quiz', p_completed_at)
    on conflict (user_id, discovery_id) do nothing;
  end if;

  if p_reward_coupon_id is not null then
    select not exists (
      select 1 from public.coupon_state
      where user_id = p_user_id
        and coupon_id = p_reward_coupon_id
        and unlocked_at is not null
    ) into new_coupon;

    insert into public.coupon_state (user_id, coupon_id, unlocked_at)
    values (p_user_id, p_reward_coupon_id, p_completed_at)
    on conflict (user_id, coupon_id) do update
      set unlocked_at = coalesce(public.coupon_state.unlocked_at, excluded.unlocked_at);

    insert into public.discoveries (
      user_id, discovery_id, discovery_type, source, discovered_at
    ) values (
      p_user_id,
      'coupon:' || p_reward_coupon_id,
      'coupon',
      'quiz',
      p_completed_at
    ) on conflict (user_id, discovery_id) do nothing;
  end if;

  insert into public.site_progress (user_id, last_visited_at)
  values (p_user_id, p_completed_at)
  on conflict (user_id) do update set last_visited_at = excluded.last_visited_at;

  return query select new_achievement, new_reward, new_coupon;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.redeem_coupon_state(uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.record_challenge_result(uuid, text, integer, boolean, text, timestamptz) from public, anon, authenticated;
revoke all on function public.open_letter_state(uuid, text, timestamptz, text, text) from public, anon, authenticated;
revoke all on function public.complete_quiz_attempt(uuid, uuid, jsonb, smallint, timestamptz, text, text, text) from public, anon, authenticated;

grant execute on function public.redeem_coupon_state(uuid, text, timestamptz) to service_role;
grant execute on function public.record_challenge_result(uuid, text, integer, boolean, text, timestamptz) to service_role;
grant execute on function public.open_letter_state(uuid, text, timestamptz, text, text) to service_role;
grant execute on function public.complete_quiz_attempt(uuid, uuid, jsonb, smallint, timestamptz, text, text, text) to service_role;

commit;
