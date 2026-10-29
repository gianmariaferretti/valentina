begin;

-- The legacy 'italian' and 'gianmaria' papers and their rewards remain intact.
-- Only the new exam ID counts toward the new two-attempt limit. No rows are
-- deleted, reset, or reclassified.
alter table public.italian_corner_attempts
  drop constraint italian_corner_attempts_quiz_id_check;
alter table public.italian_corner_attempts
  add constraint italian_corner_attempts_quiz_id_check
  check (quiz_id in ('italian', 'gianmaria', 'boyfriend-v2'));

alter table public.italian_corner_attempts
  drop constraint italian_corner_attempts_score_check;
alter table public.italian_corner_attempts
  add constraint italian_corner_attempts_score_check
  check (score between 0 and case when quiz_id = 'boyfriend-v2' then 20 else 15 end);

-- The same private, RLS-enabled table stores the versioned paper. Only the
-- service role can call these functions, through authenticated server actions.
create or replace function public.start_unified_relationship_exam(
  p_user_id uuid, p_id uuid, p_quiz_id text, p_question_ids jsonb, p_option_orders jsonb
)
returns setof public.italian_corner_attempts
language plpgsql security invoker set search_path = ''
as $$
declare
  v_existing public.italian_corner_attempts%rowtype;
  v_count integer;
begin
  if p_user_id is null or p_id is null or p_quiz_id <> 'boyfriend-v2'
    or jsonb_typeof(p_question_ids) <> 'array'
    or jsonb_array_length(p_question_ids) <> 20
    or jsonb_typeof(p_option_orders) <> 'object'
    or (select count(distinct value) from jsonb_array_elements_text(p_question_ids)) <> 20 then
    raise exception 'Invalid relationship examination';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_user_id::text || ':boyfriend-v2', 0)
  );
  update public.italian_corner_attempts
    set status = 'expired', updated_at = now()
    where user_id = p_user_id and quiz_id = 'boyfriend-v2'
      and status = 'active' and expires_at <= now();
  select * into v_existing from public.italian_corner_attempts
    where user_id = p_user_id and quiz_id = 'boyfriend-v2' and status = 'active'
    order by started_at desc limit 1;
  if found then return next v_existing; return; end if;
  select count(*) into v_count from public.italian_corner_attempts
    where user_id = p_user_id and quiz_id = 'boyfriend-v2';
  if v_count >= 2 then raise exception 'Attempt limit reached'; end if;
  insert into public.italian_corner_attempts
    (id, user_id, quiz_id, expires_at, question_ids, option_orders)
    values (p_id, p_user_id, 'boyfriend-v2', now() + interval '15 minutes',
      p_question_ids, p_option_orders)
    returning * into v_existing;
  return next v_existing;
end;
$$;

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

revoke all on function public.start_unified_relationship_exam(uuid, uuid, text, jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function public.finish_unified_relationship_exam(uuid, uuid, jsonb, integer)
  from public, anon, authenticated;
grant execute on function public.start_unified_relationship_exam(uuid, uuid, text, jsonb, jsonb)
  to service_role;
grant execute on function public.finish_unified_relationship_exam(uuid, uuid, jsonb, integer)
  to service_role;

commit;
