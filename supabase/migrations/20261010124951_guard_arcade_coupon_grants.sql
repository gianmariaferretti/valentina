begin;

create or replace function public.finish_arcade_run(
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

  -- Validate NEW grants against outcomes replayed by the trusted application server.
  -- Existing completed-run retries return their original receipt unchanged.
  if not coalesce(duplicate, false) then
    if exists (select 1 from jsonb_array_elements(p_reward_grants) g
      where g->>'kind' = 'coupon' and not (
        p_won and p_progress = 100 and (
          (p_game_id = 'maze' and p_ending = 'maze-escaped' and g->>'targetId' = 'weekend-getaway') or
          (p_game_id = 'snake' and p_ending = 'snake-complete' and p_score >= 750 and g->>'targetId' = 'coupon-with-no-rules') or
          (p_game_id = '365-memories' and p_ending = 'archive-complete' and g->>'targetId' = 'classified-coupon') or
          (p_game_id = 'break-defences' and p_ending in ('defences-breached','defences-perfect') and g->>'targetId' = 'evening-your-way') or
          (p_game_id = 'break-defences' and p_ending = 'defences-perfect' and g->>'targetId' = 'no-budget-date')
        )
      )) then raise exception 'Coupon does not match verified arcade outcome'; end if;
  end if;

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


-- Block newly granting retired GV-034 from older RPCs too. Do NOT delete or
-- invalidate historical unlocks/redemptions. Existing unlocked_at stays intact.
create function public.reject_retired_coupon_grant()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  if new.coupon_id = 'one-question-honest-answer' then
    if tg_op = 'INSERT' then raise exception 'GV-034 is retired'; end if;
    if old.unlocked_at is null and new.unlocked_at is not null then
      raise exception 'GV-034 is retired';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.reject_retired_coupon_grant() from public, anon, authenticated;
create trigger reject_retired_coupon_grant before insert or update on public.coupon_state
for each row execute function public.reject_retired_coupon_grant();

commit;
