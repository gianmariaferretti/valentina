begin;

-- Private, server-only state. Static questions and lessons remain in source files.
create table public.italian_corner_attempts (
  id uuid primary key,
  user_id uuid not null,
  quiz_id text not null check (quiz_id in ('italian', 'gianmaria')),
  status text not null default 'active' check (status in ('active', 'completed', 'expired')),
  started_at timestamptz not null default now(),
  expires_at timestamptz not null,
  completed_at timestamptz,
  question_ids jsonb not null check (jsonb_typeof(question_ids) = 'array'),
  option_orders jsonb not null check (jsonb_typeof(option_orders) = 'object'),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  score smallint check (score between 0 and 15),
  passed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > started_at),
  check ((status = 'completed' and completed_at is not null and score is not null)
    or (status <> 'completed' and completed_at is null))
);
create index italian_corner_attempts_user_quiz_idx
  on public.italian_corner_attempts (user_id, quiz_id, started_at desc);

create table public.italian_lesson_progress (
  user_id uuid not null,
  lesson_id text not null check (length(lesson_id) between 1 and 100),
  status text not null default 'started' check (status in ('started', 'completed')),
  last_activity_at timestamptz not null default now(),
  completed_at timestamptz,
  best_score smallint check (best_score between 0 and 100),
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index italian_lesson_progress_resume_idx
  on public.italian_lesson_progress (user_id, last_activity_at desc);

create table public.italian_exercise_results (
  user_id uuid not null,
  lesson_id text not null,
  exercise_id text not null,
  attempts integer not null default 1 check (attempts > 0),
  best_score smallint not null check (best_score between 0 and 100),
  latest_score smallint not null check (latest_score between 0 and 100),
  last_answer jsonb not null default 'null'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, lesson_id, exercise_id)
);

create table public.italian_vocabulary_review (
  user_id uuid not null,
  vocabulary_id text not null check (length(vocabulary_id) between 1 and 140),
  correct_count integer not null default 0 check (correct_count >= 0),
  incorrect_count integer not null default 0 check (incorrect_count >= 0),
  due_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, vocabulary_id)
);
create index italian_vocabulary_review_due_idx
  on public.italian_vocabulary_review (user_id, due_at);

create table public.italian_level_exams (
  id uuid primary key,
  user_id uuid not null,
  level text not null check (level in ('A2', 'B1', 'B2')),
  score smallint not null check (score between 0 and 100),
  passed boolean not null,
  completed_at timestamptz not null default now()
);
create index italian_level_exams_user_level_idx
  on public.italian_level_exams (user_id, level, completed_at desc);

do $$
declare table_name text;
begin
  foreach table_name in array array[
    'italian_corner_attempts', 'italian_lesson_progress',
    'italian_exercise_results', 'italian_vocabulary_review', 'italian_level_exams'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on public.%I from public, anon, authenticated', table_name);
    execute format('grant select, insert, update on public.%I to service_role', table_name);
  end loop;
end $$;

create function public.start_italian_corner_attempt(
  p_user_id uuid, p_id uuid, p_quiz_id text, p_question_ids jsonb, p_option_orders jsonb
)
returns setof public.italian_corner_attempts
language plpgsql security invoker set search_path = ''
as $$
declare
  v_limit integer;
  v_count integer;
  v_existing public.italian_corner_attempts%rowtype;
begin
  if p_user_id is null or p_id is null or p_quiz_id not in ('italian', 'gianmaria')
    or jsonb_typeof(p_question_ids) <> 'array' or jsonb_typeof(p_option_orders) <> 'object' then
    raise exception 'Invalid quiz attempt';
  end if;
  v_limit := case p_quiz_id when 'italian' then 3 else 2 end;
  if jsonb_array_length(p_question_ids) <> case p_quiz_id when 'italian' then 15 else 10 end then
    raise exception 'Invalid question count';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text || ':' || p_quiz_id, 0));
  update public.italian_corner_attempts set status = 'expired', updated_at = now()
    where user_id = p_user_id and quiz_id = p_quiz_id and status = 'active' and expires_at <= now();
  select * into v_existing from public.italian_corner_attempts
    where user_id = p_user_id and quiz_id = p_quiz_id and status = 'active'
    order by started_at desc limit 1;
  if found then return next v_existing; return; end if;
  select count(*) into v_count from public.italian_corner_attempts
    where user_id = p_user_id and quiz_id = p_quiz_id;
  if v_count >= v_limit then raise exception 'Attempt limit reached'; end if;
  insert into public.italian_corner_attempts
    (id, user_id, quiz_id, expires_at, question_ids, option_orders)
    values (p_id, p_user_id, p_quiz_id, now() + interval '10 minutes', p_question_ids, p_option_orders)
    returning * into v_existing;
  return next v_existing;
end;
$$;

create function public.finish_italian_corner_attempt(
  p_user_id uuid, p_id uuid, p_answers jsonb, p_score integer
)
returns table (final_score integer, passed boolean, reward_was_new boolean, attempts_remaining integer)
language plpgsql security invoker set search_path = ''
as $$
declare
  v_attempt public.italian_corner_attempts%rowtype;
  v_threshold integer;
  v_limit integer;
  v_reward text;
  v_coupon text;
  v_new integer := 0;
  v_count integer;
begin
  if p_user_id is null or p_id is null or jsonb_typeof(p_answers) <> 'object'
    or p_score is null or p_score not between 0 and 15 then
    raise exception 'Invalid submission';
  end if;
  select * into v_attempt from public.italian_corner_attempts
    where id = p_id and user_id = p_user_id for update;
  if not found then raise exception 'Attempt not found'; end if;
  v_threshold := case v_attempt.quiz_id when 'italian' then 12 else 8 end;
  v_limit := case v_attempt.quiz_id when 'italian' then 3 else 2 end;
  v_reward := case v_attempt.quiz_id when 'italian' then 'italian-challenge-reward' else 'gianmaria-exam-reward' end;
  v_coupon := case v_attempt.quiz_id when 'italian' then 'italian-challenge-secret' else 'gianmaria-exam-secret' end;
  if v_attempt.status = 'completed' then
    select count(*) into v_count from public.italian_corner_attempts where user_id = p_user_id and quiz_id = v_attempt.quiz_id;
    return query select v_attempt.score::integer, v_attempt.passed, false, greatest(0, v_limit - v_count);
    return;
  end if;
  if v_attempt.status <> 'active' then raise exception 'Attempt expired'; end if;
  -- A late request cannot turn a timed-out paper into a pass.
  if now() > v_attempt.expires_at then p_score := 0; end if;
  update public.italian_corner_attempts
    set status = 'completed', completed_at = now(), answers = p_answers,
      score = p_score, passed = (p_score >= v_threshold), updated_at = now()
    where id = p_id;
  if p_score >= v_threshold then
    insert into public.coupon_state (user_id, coupon_id, unlocked_at)
      values (p_user_id, v_coupon, now())
      on conflict (user_id, coupon_id) do update
        set unlocked_at = coalesce(public.coupon_state.unlocked_at, excluded.unlocked_at);
    insert into public.discoveries (user_id, discovery_id, discovery_type, source)
      values (p_user_id, v_reward, 'reward', 'italian-corner:' || v_attempt.quiz_id)
      on conflict (user_id, discovery_id) do nothing;
    get diagnostics v_new = row_count;
    insert into public.discoveries (user_id, discovery_id, discovery_type, source)
      values (p_user_id, 'coupon:' || v_coupon, 'coupon', 'italian-corner:' || v_attempt.quiz_id)
      on conflict (user_id, discovery_id) do nothing;
  end if;
  select count(*) into v_count from public.italian_corner_attempts where user_id = p_user_id and quiz_id = v_attempt.quiz_id;
  return query select p_score, p_score >= v_threshold, v_new = 1, greatest(0, v_limit - v_count);
end;
$$;

revoke all on function public.start_italian_corner_attempt(uuid, uuid, text, jsonb, jsonb) from public, anon, authenticated;
revoke all on function public.finish_italian_corner_attempt(uuid, uuid, jsonb, integer) from public, anon, authenticated;
grant execute on function public.start_italian_corner_attempt(uuid, uuid, text, jsonb, jsonb) to service_role;
grant execute on function public.finish_italian_corner_attempt(uuid, uuid, jsonb, integer) to service_role;

create function public.record_italian_exercise(
  p_user_id uuid, p_lesson_id text, p_exercise_id text, p_score integer, p_answer jsonb
)
returns table (attempts integer, best_score integer, latest_score integer)
language plpgsql security invoker set search_path = ''
as $$
declare v_record public.italian_exercise_results%rowtype;
begin
  if p_user_id is null or coalesce(length(p_lesson_id), 0) not between 1 and 100
    or coalesce(length(p_exercise_id), 0) not between 1 and 100 or p_score not between 0 and 100
    or p_answer is null then raise exception 'Invalid exercise result'; end if;
  insert into public.italian_exercise_results
    (user_id, lesson_id, exercise_id, best_score, latest_score, last_answer)
    values (p_user_id, p_lesson_id, p_exercise_id, p_score, p_score, p_answer)
    on conflict (user_id, lesson_id, exercise_id) do update
      set attempts = public.italian_exercise_results.attempts + 1,
          best_score = greatest(public.italian_exercise_results.best_score, excluded.best_score),
          latest_score = excluded.latest_score, last_answer = excluded.last_answer,
          updated_at = now()
    returning * into v_record;
  insert into public.italian_lesson_progress (user_id, lesson_id, last_activity_at)
    values (p_user_id, p_lesson_id, now())
    on conflict (user_id, lesson_id) do update
      set last_activity_at = now(), updated_at = now();
  return query select v_record.attempts, v_record.best_score::integer, v_record.latest_score::integer;
end;
$$;

create function public.record_italian_vocabulary_review(
  p_user_id uuid, p_vocabulary_id text, p_known boolean
)
returns table (correct_count integer, incorrect_count integer, due_at timestamptz)
language plpgsql security invoker set search_path = ''
as $$
declare v_record public.italian_vocabulary_review%rowtype;
begin
  if p_user_id is null or coalesce(length(p_vocabulary_id), 0) not between 1 and 140 or p_known is null
    then raise exception 'Invalid vocabulary review'; end if;
  insert into public.italian_vocabulary_review
    (user_id, vocabulary_id, correct_count, incorrect_count, due_at)
    values (p_user_id, p_vocabulary_id, case when p_known then 1 else 0 end,
      case when p_known then 0 else 1 end, now() + case when p_known then interval '3 days' else interval '1 day' end)
    on conflict (user_id, vocabulary_id) do update
      set correct_count = public.italian_vocabulary_review.correct_count + case when p_known then 1 else 0 end,
          incorrect_count = public.italian_vocabulary_review.incorrect_count + case when p_known then 0 else 1 end,
          due_at = now() + case when p_known then interval '3 days' else interval '1 day' end,
          updated_at = now()
    returning * into v_record;
  return query select v_record.correct_count, v_record.incorrect_count, v_record.due_at;
end;
$$;

create function public.complete_italian_lesson(
  p_user_id uuid, p_lesson_id text, p_score integer
)
returns void language plpgsql security invoker set search_path = ''
as $$
begin
  if p_user_id is null or coalesce(length(p_lesson_id), 0) not between 1 and 100
    or p_score not between 0 and 100 then raise exception 'Invalid lesson completion'; end if;
  insert into public.italian_lesson_progress
    (user_id, lesson_id, status, last_activity_at, completed_at, best_score)
    values (p_user_id, p_lesson_id, 'completed', now(), now(), p_score)
    on conflict (user_id, lesson_id) do update
      set status = 'completed', last_activity_at = now(),
          completed_at = coalesce(public.italian_lesson_progress.completed_at, now()),
          best_score = greatest(coalesce(public.italian_lesson_progress.best_score, 0), excluded.best_score),
          updated_at = now();
  insert into public.achievements (user_id, achievement_id, metadata)
    values (p_user_id, 'italian-academy-first-lesson', pg_catalog.jsonb_build_object('source', p_lesson_id))
    on conflict (user_id, achievement_id) do nothing;
end;
$$;

create function public.record_italian_level_exam(
  p_user_id uuid, p_id uuid, p_level text, p_score integer
)
returns table (score integer, passed boolean)
language plpgsql security invoker set search_path = ''
as $$
declare v_threshold integer;
begin
  if p_user_id is null or p_id is null or p_level not in ('A2', 'B1', 'B2')
    or p_score not between 0 and 100 then raise exception 'Invalid level examination'; end if;
  v_threshold := case p_level when 'A2' then 70 when 'B1' then 75 else 80 end;
  insert into public.italian_level_exams (id, user_id, level, score, passed)
    values (p_id, p_user_id, p_level, p_score, p_score >= v_threshold);
  if p_score >= v_threshold then
    insert into public.achievements (user_id, achievement_id, metadata)
      values (p_user_id, 'italian-academy-' || lower(p_level), pg_catalog.jsonb_build_object('level', p_level))
      on conflict (user_id, achievement_id) do nothing;
  end if;
  return query select p_score, p_score >= v_threshold;
end;
$$;

revoke all on function public.record_italian_exercise(uuid, text, text, integer, jsonb) from public, anon, authenticated;
revoke all on function public.record_italian_vocabulary_review(uuid, text, boolean) from public, anon, authenticated;
revoke all on function public.complete_italian_lesson(uuid, text, integer) from public, anon, authenticated;
revoke all on function public.record_italian_level_exam(uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.record_italian_exercise(uuid, text, text, integer, jsonb) to service_role;
grant execute on function public.record_italian_vocabulary_review(uuid, text, boolean) to service_role;
grant execute on function public.complete_italian_lesson(uuid, text, integer) to service_role;
grant execute on function public.record_italian_level_exam(uuid, uuid, text, integer) to service_role;

commit;
