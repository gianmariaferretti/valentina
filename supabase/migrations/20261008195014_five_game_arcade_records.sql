begin;

alter table public.challenge_scores
  add column best_time_ms integer check (best_time_ms > 0 and best_time_ms <= 21600000),
  add column fewest_moves integer check (fewest_moves >= 0),
  add column last_result text,
  add column last_played_at timestamptz;

-- Preserve historical results. Old boards are not comparable to the new timed rules,
-- so best_time_ms intentionally starts null, rather than claiming an old best time.
update public.challenge_scores set last_result = ending, last_played_at = coalesce(started_at, updated_at);

create function public.begin_arcade_run(
  p_run_id uuid, p_user_id uuid, p_game_id text, p_difficulty text, p_started_at timestamptz
)
returns setof public.challenge_scores
language plpgsql security invoker set search_path = public
as $$
begin
  perform public.begin_game_run(p_run_id, p_user_id, p_game_id, p_difficulty, p_started_at);
  return query update public.challenge_scores as score
    set last_played_at = p_started_at
    where score.user_id = p_user_id and score.challenge_id = p_game_id
    returning score.*;
end;
$$;

create function public.finish_arcade_run(
  p_run_id uuid, p_user_id uuid, p_game_id text, p_score integer, p_duration_ms integer,
  p_difficulty text, p_progress smallint, p_ending text, p_won boolean,
  p_reward_grants jsonb, p_discovered_secrets text[], p_finished_at timestamptz,
  p_moves integer default null
)
returns table (
  game_id text, best_score integer, latest_score integer, attempts integer,
  started_at timestamptz, completed_at timestamptz, duration_ms integer,
  difficulty text, progress smallint, ending text, wins integer, losses integer,
  unlocked_rewards text[], discovered_secrets text[], best_time_ms integer,
  fewest_moves integer, last_result text, last_played_at timestamptz,
  newly_granted_reward_ids text[]
)
language plpgsql security invoker set search_path = public
as $$
declare
  locked_game public.challenge_scores%rowtype;
  saved_game public.challenge_scores%rowtype;
  finished record;
  duplicate boolean;
begin
  if p_moves is not null and (p_moves < 0 or p_moves > 2048) then raise exception 'Invalid move count'; end if;
  select * into locked_game from public.challenge_scores as score
    where score.user_id = p_user_id and score.challenge_id = p_game_id for update;
  duplicate := locked_game.last_finished_run_id = p_run_id;

  -- Reuse the existing atomic reward transaction and active-run/idempotency guards.
  select * into finished from public.finish_game_run(
    p_run_id, p_user_id, p_game_id, p_score, p_duration_ms, p_difficulty,
    p_progress, p_ending, p_won, p_reward_grants, p_discovered_secrets, p_finished_at
  );
  if not coalesce(duplicate, false) then
    update public.challenge_scores as score set
      best_time_ms = case when p_won and p_duration_ms > 0
        then least(coalesce(score.best_time_ms, p_duration_ms), p_duration_ms) else score.best_time_ms end,
      fewest_moves = case when p_won and p_moves is not null
        then least(coalesce(score.fewest_moves, p_moves), p_moves) else score.fewest_moves end,
      last_result = p_ending, last_played_at = p_finished_at
      where score.user_id = p_user_id and score.challenge_id = p_game_id;
  end if;
  select * into saved_game from public.challenge_scores as score
    where score.user_id = p_user_id and score.challenge_id = p_game_id;
  return query select saved_game.challenge_id, saved_game.best_score, saved_game.latest_score,
    saved_game.attempts, saved_game.started_at, saved_game.completed_at, saved_game.duration_ms,
    saved_game.difficulty, saved_game.progress, saved_game.ending, saved_game.wins, saved_game.losses,
    saved_game.unlocked_rewards, saved_game.discovered_secrets, saved_game.best_time_ms,
    saved_game.fewest_moves, saved_game.last_result, saved_game.last_played_at,
    finished.newly_granted_reward_ids;
end;
$$;

revoke all on function public.begin_arcade_run(uuid, uuid, text, text, timestamptz) from public, anon, authenticated;
revoke all on function public.finish_arcade_run(uuid, uuid, text, integer, integer, text, smallint, text, boolean, jsonb, text[], timestamptz, integer) from public, anon, authenticated;
grant execute on function public.begin_arcade_run(uuid, uuid, text, text, timestamptz) to service_role;
grant execute on function public.finish_arcade_run(uuid, uuid, text, integer, integer, text, smallint, text, boolean, jsonb, text[], timestamptz, integer) to service_role;

commit;
