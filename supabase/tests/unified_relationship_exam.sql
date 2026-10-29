-- Run as a privileged database role after the grant and unified exam migrations.
-- Every synthetic attempt and reward is rolled back.
begin;

do $$
declare
  v_user uuid := gen_random_uuid();
  v_first uuid := gen_random_uuid();
  v_second uuid := gen_random_uuid();
  v_third uuid := gen_random_uuid();
  v_questions jsonb := (
    select jsonb_agg('test-' || n order by n)
    from generate_series(1, 20) as n
  );
  v_started public.italian_corner_attempts%rowtype;
  v_result record;
begin
  select * into v_started from public.start_unified_relationship_exam(
    v_user, v_first, 'boyfriend-v2', v_questions, '{}'::jsonb
  );
  if v_started.id <> v_first then raise exception 'First paper not created'; end if;

  select * into v_started from public.start_unified_relationship_exam(
    v_user, v_second, 'boyfriend-v2', v_questions, '{}'::jsonb
  );
  if v_started.id <> v_first then raise exception 'Active paper was not reused'; end if;

  select * into v_result from public.finish_unified_relationship_exam(
    v_user, v_first, '{}'::jsonb, 17
  );
  if v_result.final_score <> 17 or not v_result.passed
    or not v_result.reward_was_new or v_result.attempts_remaining <> 1 then
    raise exception 'Passing result or reward incorrect';
  end if;
  if not exists (
    select 1 from public.coupon_state
    where user_id = v_user and coupon_id = 'gianmaria-exam-secret' and unlocked_at is not null
  ) then raise exception 'Reward coupon missing'; end if;

  select * into v_result from public.finish_unified_relationship_exam(
    v_user, v_first, '{}'::jsonb, 17
  );
  if v_result.reward_was_new then raise exception 'Completion is not idempotent'; end if;

  select * into v_started from public.start_unified_relationship_exam(
    v_user, v_second, 'boyfriend-v2', v_questions, '{}'::jsonb
  );
  if v_started.id <> v_second then raise exception 'Second paper not created'; end if;
  select * into v_result from public.finish_unified_relationship_exam(
    v_user, v_second, '{}'::jsonb, 18
  );
  if v_result.reward_was_new or v_result.attempts_remaining <> 0 then
    raise exception 'Duplicate reward or incorrect attempt limit';
  end if;

  begin
    perform * from public.start_unified_relationship_exam(
      v_user, v_third, 'boyfriend-v2', v_questions, '{}'::jsonb
    );
    raise exception 'Third paper was accepted';
  exception when others then
    if sqlerrm <> 'Attempt limit reached' then raise; end if;
  end;
end $$;

rollback;
