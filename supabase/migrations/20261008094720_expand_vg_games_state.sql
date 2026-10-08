begin;

alter table public.challenge_scores
  add column started_at timestamptz,
  add column latest_score integer not null default 0 check (latest_score >= 0),
  add column duration_ms integer not null default 0 check (duration_ms >= 0 and duration_ms <= 21600000),
  add column difficulty text not null default 'standard'
    check (difficulty in ('story', 'standard', 'daring')),
  add column progress smallint not null default 0 check (progress between 0 and 100),
  add column ending text check (ending is null or length(ending) between 1 and 80),
  add column wins integer not null default 0 check (wins >= 0),
  add column losses integer not null default 0 check (losses >= 0),
  add column unlocked_rewards text[] not null default '{}'::text[],
  add column discovered_secrets text[] not null default '{}'::text[],
  add column active_run_id uuid,
  add column last_finished_run_id uuid;

alter table public.discoveries
  drop constraint discoveries_discovery_type_check,
  add constraint discoveries_discovery_type_check
    check (discovery_type in ('reward', 'coupon', 'challenge', 'secret', 'memory', 'item'));

create or replace function public.begin_game_run(
  p_run_id uuid,
  p_user_id uuid,
  p_game_id text,
  p_difficulty text,
  p_started_at timestamptz
)
returns table (
  game_id text,
  best_score integer,
  latest_score integer,
  attempts integer,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  difficulty text,
  progress smallint,
  ending text,
  wins integer,
  losses integer,
  unlocked_rewards text[],
  discovered_secrets text[]
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_game public.challenge_scores%rowtype;
begin
  if p_run_id is null
    or p_user_id is null
    or p_game_id is null
    or length(p_game_id) not between 1 and 100
    or p_difficulty is null
    or p_difficulty not in ('story', 'standard', 'daring')
    or p_started_at is null
  then
    raise exception 'Invalid game run start.';
  end if;

  insert into public.site_progress (user_id, last_visited_at)
  values (p_user_id, p_started_at)
  on conflict (user_id) do update set last_visited_at = excluded.last_visited_at;

  insert into public.challenge_scores (
    user_id,
    challenge_id,
    active_run_id,
    attempts,
    started_at,
    difficulty,
    latest_score,
    duration_ms,
    progress,
    ending
  ) values (
    p_user_id,
    p_game_id,
    p_run_id,
    1,
    p_started_at,
    p_difficulty,
    0,
    0,
    0,
    null
  )
  on conflict (user_id, challenge_id) do update
    set attempts = public.challenge_scores.attempts + case
          when public.challenge_scores.active_run_id = p_run_id then 0 else 1
        end,
        active_run_id = p_run_id,
        started_at = excluded.started_at,
        difficulty = excluded.difficulty,
        latest_score = 0,
        duration_ms = 0,
        ending = null
  returning * into saved_game;

  return query select
    saved_game.challenge_id,
    saved_game.best_score,
    saved_game.latest_score,
    saved_game.attempts,
    saved_game.started_at,
    saved_game.completed_at,
    saved_game.duration_ms,
    saved_game.difficulty,
    saved_game.progress,
    saved_game.ending,
    saved_game.wins,
    saved_game.losses,
    saved_game.unlocked_rewards,
    saved_game.discovered_secrets;
end;
$$;

create or replace function public.finish_game_run(
  p_run_id uuid,
  p_user_id uuid,
  p_game_id text,
  p_score integer,
  p_duration_ms integer,
  p_difficulty text,
  p_progress smallint,
  p_ending text,
  p_won boolean,
  p_reward_grants jsonb,
  p_discovered_secrets text[],
  p_finished_at timestamptz
)
returns table (
  game_id text,
  best_score integer,
  latest_score integer,
  attempts integer,
  started_at timestamptz,
  completed_at timestamptz,
  duration_ms integer,
  difficulty text,
  progress smallint,
  ending text,
  wins integer,
  losses integer,
  unlocked_rewards text[],
  discovered_secrets text[],
  newly_granted_reward_ids text[]
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  saved_game public.challenge_scores%rowtype;
  grant_record jsonb;
  grant_id text;
  grant_kind text;
  target_id text;
  grant_title text;
  new_grants text[] := '{}'::text[];
  reward_ids text[] := '{}'::text[];
  secret_ids text[] := '{}'::text[];
  was_new boolean;
begin
  if p_run_id is null
    or p_user_id is null
    or p_game_id is null
    or length(p_game_id) not between 1 and 100
    or p_score is null
    or p_score not between 0 and 10000000
    or p_duration_ms is null
    or p_duration_ms not between 0 and 21600000
    or p_difficulty is null
    or p_difficulty not in ('story', 'standard', 'daring')
    or p_progress is null
    or p_progress not between 0 and 100
    or p_ending is null
    or length(p_ending) not between 1 and 80
    or p_won is null
    or p_finished_at is null
    or p_discovered_secrets is null
    or cardinality(p_discovered_secrets) > 50
    or p_reward_grants is null
    or jsonb_typeof(p_reward_grants) <> 'array'
    or jsonb_array_length(p_reward_grants) > 50
  then
    raise exception 'Invalid game run result.';
  end if;

  -- Lock the aggregate row so retries and concurrent devices cannot count
  -- the same result twice or finish a run superseded by a newer attempt.
  select * into saved_game
  from public.challenge_scores as score
  where score.user_id = p_user_id and score.challenge_id = p_game_id
  for update;

  if not found then
    raise exception 'Game run must be started before it can finish.';
  end if;

  if saved_game.last_finished_run_id = p_run_id then
    return query select
      saved_game.challenge_id, saved_game.best_score, saved_game.latest_score,
      saved_game.attempts, saved_game.started_at, saved_game.completed_at,
      saved_game.duration_ms, saved_game.difficulty, saved_game.progress,
      saved_game.ending, saved_game.wins, saved_game.losses,
      saved_game.unlocked_rewards, saved_game.discovered_secrets,
      '{}'::text[];
    return;
  end if;

  if saved_game.active_run_id is distinct from p_run_id
    or saved_game.difficulty <> p_difficulty
  then
    raise exception 'Game run is stale or no longer active.';
  end if;

  select coalesce(array_agg(distinct value->>'id'), '{}'::text[])
  into reward_ids
  from jsonb_array_elements(p_reward_grants) as value
  where value->>'id' is not null and value->>'id' <> '';

  select coalesce(array_agg(distinct secret_id), '{}'::text[])
  into secret_ids
  from unnest(p_discovered_secrets) as secret_id
  where secret_id is not null and secret_id <> '';

  insert into public.challenge_scores (
    user_id,
    challenge_id,
    best_score,
    latest_score,
    attempts,
    started_at,
    completed_at,
    duration_ms,
    difficulty,
    progress,
    ending,
    wins,
    losses,
    unlocked_rewards,
    discovered_secrets
  ) values (
    p_user_id,
    p_game_id,
    p_score,
    p_score,
    1,
    p_finished_at - make_interval(secs => p_duration_ms / 1000.0),
    case when p_won then p_finished_at else null end,
    p_duration_ms,
    p_difficulty,
    p_progress,
    p_ending,
    case when p_won then 1 else 0 end,
    case when p_won then 0 else 1 end,
    reward_ids,
    secret_ids
  )
  on conflict (user_id, challenge_id) do update
    set best_score = greatest(public.challenge_scores.best_score, excluded.best_score),
        latest_score = excluded.latest_score,
        completed_at = case
          when p_won then coalesce(public.challenge_scores.completed_at, excluded.completed_at)
          else public.challenge_scores.completed_at
        end,
        duration_ms = excluded.duration_ms,
        difficulty = excluded.difficulty,
        progress = greatest(public.challenge_scores.progress, excluded.progress),
        ending = excluded.ending,
        active_run_id = null,
        last_finished_run_id = p_run_id,
        wins = public.challenge_scores.wins + case when p_won then 1 else 0 end,
        losses = public.challenge_scores.losses + case when p_won then 0 else 1 end,
        unlocked_rewards = array(
          select distinct item
          from unnest(public.challenge_scores.unlocked_rewards || excluded.unlocked_rewards) as item
          where item is not null and item <> ''
        ),
        discovered_secrets = array(
          select distinct item
          from unnest(public.challenge_scores.discovered_secrets || excluded.discovered_secrets) as item
          where item is not null and item <> ''
        )
  returning * into saved_game;

  for grant_record in select value from jsonb_array_elements(p_reward_grants)
  loop
    grant_id := grant_record->>'id';
    grant_kind := grant_record->>'kind';
    target_id := grant_record->>'targetId';
    grant_title := coalesce(grant_record->>'title', target_id);

    if grant_id is null or grant_id = '' or target_id is null or target_id = '' then
      raise exception 'Reward grant is missing an id or targetId.';
    end if;

    if grant_kind = 'achievement' then
      select not exists (
        select 1 from public.achievements
        where user_id = p_user_id and achievement_id = target_id
      ) into was_new;

      insert into public.achievements (
        user_id, achievement_id, unlocked_at, metadata
      ) values (
        p_user_id,
        target_id,
        p_finished_at,
        jsonb_build_object('source', 'game:' || p_game_id, 'title', grant_title)
      ) on conflict (user_id, achievement_id) do nothing;
    elsif grant_kind = 'coupon' then
      select not exists (
        select 1 from public.coupon_state
        where user_id = p_user_id
          and coupon_id = target_id
          and unlocked_at is not null
      ) into was_new;

      insert into public.coupon_state (user_id, coupon_id, unlocked_at)
      values (p_user_id, target_id, p_finished_at)
      on conflict (user_id, coupon_id) do update
        set unlocked_at = coalesce(public.coupon_state.unlocked_at, excluded.unlocked_at);

      insert into public.discoveries (
        user_id, discovery_id, discovery_type, source, discovered_at
      ) values (
        p_user_id,
        'coupon:' || target_id,
        'coupon',
        'game:' || p_game_id,
        p_finished_at
      ) on conflict (user_id, discovery_id) do nothing;
    elsif grant_kind in ('discovery', 'secret', 'item') then
      select not exists (
        select 1 from public.discoveries
        where user_id = p_user_id and discovery_id = target_id
      ) into was_new;

      insert into public.discoveries (
        user_id,
        discovery_id,
        discovery_type,
        source,
        discovered_at,
        metadata
      ) values (
        p_user_id,
        target_id,
        case when grant_kind = 'discovery' then 'reward' else grant_kind end,
        'game:' || p_game_id,
        p_finished_at,
        jsonb_build_object('rewardId', grant_id, 'title', grant_title)
      ) on conflict (user_id, discovery_id) do nothing;
    else
      raise exception 'Unsupported reward kind: %', grant_kind;
    end if;

    if was_new then
      new_grants := array_append(new_grants, grant_id);
    end if;
  end loop;

  insert into public.discoveries (
    user_id,
    discovery_id,
    discovery_type,
    source,
    discovered_at,
    metadata
  ) values (
    p_user_id,
    'game:' || p_game_id,
    'challenge',
    'game:' || p_game_id,
    p_finished_at,
    jsonb_build_object('ending', p_ending, 'score', p_score, 'won', p_won)
  ) on conflict (user_id, discovery_id) do update
    set metadata = excluded.metadata;

  insert into public.site_progress (user_id, last_visited_at)
  values (p_user_id, p_finished_at)
  on conflict (user_id) do update set last_visited_at = excluded.last_visited_at;

  return query select
    saved_game.challenge_id,
    saved_game.best_score,
    saved_game.latest_score,
    saved_game.attempts,
    saved_game.started_at,
    saved_game.completed_at,
    saved_game.duration_ms,
    saved_game.difficulty,
    saved_game.progress,
    saved_game.ending,
    saved_game.wins,
    saved_game.losses,
    saved_game.unlocked_rewards,
    saved_game.discovered_secrets,
    new_grants;
end;
$$;

-- Preserve Snake/Maze while resolving the original OUT parameter/column
-- ambiguity in its conflict target (challenge_id is also a return variable).
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
    p_user_id, p_challenge_id, p_score, 1,
    case when p_completed then p_recorded_at else null end
  )
  on conflict on constraint challenge_scores_pkey do update
    set best_score = greatest(public.challenge_scores.best_score, excluded.best_score),
        attempts = public.challenge_scores.attempts + 1,
        completed_at = coalesce(public.challenge_scores.completed_at, excluded.completed_at)
  returning * into saved_score;

  if p_completed then
    select not exists (
      select 1 from public.coupon_state
      where user_id = p_user_id and coupon_id = p_reward_coupon_id and unlocked_at is not null
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

  return query select saved_score.challenge_id, saved_score.best_score,
    saved_score.attempts, saved_score.completed_at, was_unlocked;
end;
$$;

revoke all on function public.begin_game_run(uuid, uuid, text, text, timestamptz)
  from public, anon, authenticated;
revoke all on function public.finish_game_run(
  uuid, uuid, text, integer, integer, text, smallint, text, boolean, jsonb, text[], timestamptz
) from public, anon, authenticated;

grant execute on function public.begin_game_run(uuid, uuid, text, text, timestamptz)
  to service_role;
grant execute on function public.finish_game_run(
  uuid, uuid, text, integer, integer, text, smallint, text, boolean, jsonb, text[], timestamptz
) to service_role;

commit;
