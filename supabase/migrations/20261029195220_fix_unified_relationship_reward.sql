begin;

-- Correct the output-column ambiguity in the reward call. No table data changes.
create or replace function public.finish_unified_relationship_exam(
  p_user_id uuid, p_id uuid, p_answers jsonb, p_score integer
)
returns table (final_score integer, passed boolean, reward_was_new boolean, attempts_remaining integer)
language plpgsql security invoker set search_path = ''
as $$
declare
  v_attempt public.italian_corner_attempts%rowtype;
  v_new boolean := false;
  v_count integer;
begin
  if p_user_id is null or p_id is null or jsonb_typeof(p_answers) <> 'object'
    or p_score is null or p_score not between 0 and 20 then
    raise exception 'Invalid relationship examination submission';
  end if;
  select * into v_attempt from public.italian_corner_attempts
    where id = p_id and user_id = p_user_id and quiz_id = 'boyfriend-v2'
    for update;
  if not found then raise exception 'Attempt not found'; end if;
  select count(*) into v_count from public.italian_corner_attempts
    where user_id = p_user_id and quiz_id = 'boyfriend-v2';
  if v_attempt.status = 'completed' then
    return query select v_attempt.score::integer, v_attempt.passed, false,
      greatest(0, 2 - v_count);
    return;
  end if;
  if v_attempt.status <> 'active' then raise exception 'Attempt expired'; end if;
  -- A late paper is recorded as a failed attempt, never a pass.
  if now() > v_attempt.expires_at then p_score := 0; end if;
  update public.italian_corner_attempts
    set status = 'completed', completed_at = now(), answers = p_answers,
      score = p_score, passed = (p_score >= 16), updated_at = now()
    where id = p_id;
  if p_score >= 16 then
    select grant_result.reward_was_new into v_new from public.grant_experience_coupon(
      p_user_id, 'gianmaria-exam-reward', 'gianmaria-exam-secret',
      'quiz:boyfriend-v2'
    ) as grant_result;
  end if;
  return query select p_score, p_score >= 16, v_new, greatest(0, 2 - v_count);
end;
$$;

commit;
