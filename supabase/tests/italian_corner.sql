-- Run only against a disposable/local database after the Italian Corner migration.
-- All state is rolled back. Never point this file at the owner's live progress.
begin;

do $$
declare
  u uuid := 'ee000000-0000-4000-8000-000000000001';
  a uuid := 'ee000000-0000-4000-8000-000000000002';
  b uuid := 'ee000000-0000-4000-8000-000000000003';
  c uuid := 'ee000000-0000-4000-8000-000000000004';
  paper jsonb := '["q01","q02","q03","q04","q05","q06","q07","q08","q09","q10","q11","q12","q13","q14","q15"]';
  orders jsonb := '{}'::jsonb;
  result record;
begin
  if pg_catalog.has_function_privilege('anon', 'public.start_italian_corner_attempt(uuid,uuid,text,jsonb,jsonb)', 'EXECUTE')
    or pg_catalog.has_function_privilege('authenticated', 'public.finish_italian_corner_attempt(uuid,uuid,jsonb,integer)', 'EXECUTE') then
    raise exception 'Browser roles must not execute quiz RPCs';
  end if;

  perform public.start_italian_corner_attempt(u, a, 'italian', paper, orders);
  select * into result from public.finish_italian_corner_attempt(u, a, '{}'::jsonb, 12);
  if result.final_score <> 12 or not result.passed or not result.reward_was_new or result.attempts_remaining <> 2 then
    raise exception 'First pass/reward failed';
  end if;
  select * into result from public.finish_italian_corner_attempt(u, a, '{}'::jsonb, 12);
  if result.reward_was_new then raise exception 'Duplicate reward was granted'; end if;
  if (select count(*) from public.coupon_state where user_id = u and coupon_id = 'italian-challenge-secret') <> 1
    or (select count(*) from public.discoveries where user_id = u and discovery_id = 'italian-challenge-reward') <> 1 then
    raise exception 'Reward not unique';
  end if;

  perform public.start_italian_corner_attempt(u, b, 'italian', paper, orders);
  update public.italian_corner_attempts
    set started_at = now() - interval '11 minutes', expires_at = now() - interval '1 second'
    where id = b;
  select * into result from public.finish_italian_corner_attempt(u, b, '{}'::jsonb, 15);
  if result.final_score <> 0 or result.passed then raise exception 'Timer not enforced'; end if;
  perform public.start_italian_corner_attempt(u, c, 'italian', paper, orders);
  -- An active paper resumes by design; expire it before testing the hard cap.
  update public.italian_corner_attempts
    set status = 'expired', started_at = now() - interval '11 minutes',
        expires_at = now() - interval '1 second'
    where id = c;
  begin
    perform public.start_italian_corner_attempt(u, 'ee000000-0000-4000-8000-000000000005', 'italian', paper, orders);
    raise exception 'Attempt limit not enforced';
  exception when others then
    if sqlerrm = 'Attempt limit not enforced' then raise; end if;
  end;

  perform public.record_italian_exercise(u, 'a2-001', 'mc-1', 60, '"a"'::jsonb);
  select * into result from public.record_italian_exercise(u, 'a2-001', 'mc-1', 100, '"b"'::jsonb);
  if result.attempts <> 2 or result.best_score <> 100 then raise exception 'Exercise best score failed'; end if;
  perform public.complete_italian_lesson(u, 'a2-001', 85);
  if (select count(*) from public.achievements where user_id = u and achievement_id = 'italian-academy-first-lesson') <> 1 then
    raise exception 'Lesson badge not granted';
  end if;
  select * into result from public.record_italian_level_exam(u, 'ee000000-0000-4000-8000-000000000006', 'A2', 70);
  if not result.passed then raise exception 'A2 threshold failed'; end if;
end $$;

rollback;
