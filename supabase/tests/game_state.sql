-- Run after all three migrations. Ephemeral fixture UUID; EVERY write rolls back.
begin;
set local role service_role;
do $$
declare
  test_user uuid := gen_random_uuid();
  first_run uuid := gen_random_uuid();
  next_run uuid;
  stale_run uuid := gen_random_uuid();
  rejected boolean;
  saved record;
  grants jsonb := '[
    {"id":"test-achievement","kind":"achievement","targetId":"test-achievement"},
    {"id":"test-coupon","kind":"coupon","targetId":"test-coupon"},
    {"id":"test-discovery","kind":"discovery","targetId":"test-discovery"},
    {"id":"test-secret","kind":"secret","targetId":"test-secret"},
    {"id":"test-item","kind":"item","targetId":"test-item"}
  ]'::jsonb;
begin
  assert not has_function_privilege('anon', 'public.begin_arcade_run(uuid,uuid,text,text,timestamptz)', 'execute');
  assert not has_function_privilege('authenticated', 'public.finish_arcade_run(uuid,uuid,text,integer,integer,text,smallint,text,boolean,jsonb,text[],timestamptz,integer)', 'execute');
  assert not has_table_privilege('anon', 'public.challenge_scores', 'select');

  perform * from public.begin_arcade_run(first_run, test_user, 'test-game', 'standard', now());
  select * into saved from public.begin_arcade_run(first_run, test_user, 'test-game', 'standard', now());
  assert saved.attempts = 1, 'Repeated begin must not increment attempts';
  assert saved.last_played_at is not null and saved.best_time_ms is null;

  rejected := false;
  begin
    perform * from public.finish_arcade_run(first_run, test_user, 'test-game', 100, 10000, 'standard', 100::smallint, 'win', true,
      '[{"id":"bad","kind":"unsupported","targetId":"bad"}]'::jsonb, '{}'::text[], now(), 30);
  exception when others then rejected := true;
  end;
  assert rejected, 'Invalid reward must abort metrics and grants together';
  assert (select wins = 0 and best_score = 0 and best_time_ms is null from public.challenge_scores where user_id = test_user and challenge_id = 'test-game');

  select * into saved from public.finish_arcade_run(first_run, test_user, 'test-game', 100, 10000, 'standard', 100::smallint, 'win', true, grants, array['note'], now(), 30);
  assert saved.wins = 1 and saved.losses = 0 and saved.best_score = 100;
  assert saved.best_time_ms = 10000 and saved.fewest_moves = 30;
  assert saved.last_result = 'win' and saved.last_played_at is not null;
  assert cardinality(saved.newly_granted_reward_ids) = 5;
  assert cardinality(saved.unlocked_rewards) = 5 and saved.discovered_secrets = array['note'];
  assert (select count(*) = 1 from public.achievements where user_id = test_user);
  assert (select count(*) = 1 from public.coupon_state where user_id = test_user and unlocked_at is not null and redeemed_at is null);

  -- Repeating the run with a fabricated better time/moves must NOT change any aggregate.
  select * into saved from public.finish_arcade_run(first_run, test_user, 'test-game', 9999, 1, 'standard', 100::smallint, 'win', true, grants, array['note'], now(), 1);
  assert saved.wins = 1 and saved.best_score = 100 and saved.best_time_ms = 10000 and saved.fewest_moves = 30;
  assert cardinality(saved.newly_granted_reward_ids) = 0;
  update public.coupon_state set redeemed_at = now() where user_id = test_user and coupon_id = 'test-coupon';

  next_run := gen_random_uuid();
  select * into saved from public.begin_arcade_run(next_run, test_user, 'test-game', 'standard', now());
  assert saved.last_result = 'win' and saved.best_time_ms = 10000, 'Beginning a replay retains the last result and best records';
  select * into saved from public.finish_arcade_run(next_run, test_user, 'test-game', 200, 8000, 'standard', 100::smallint, 'win', true, grants, '{}'::text[], now(), 25);
  assert saved.best_score = 200 and saved.best_time_ms = 8000 and saved.fewest_moves = 25;
  assert saved.wins = 2 and saved.attempts = 2;
  assert cardinality(saved.newly_granted_reward_ids) = 0, 'Already earned rewards are not granted again';
  assert (select redeemed_at is not null from public.coupon_state where user_id = test_user and coupon_id = 'test-coupon'), 'Unlock never unredeems a used coupon';

  next_run := gen_random_uuid();
  perform * from public.begin_arcade_run(next_run, test_user, 'test-game', 'standard', now());
  select * into saved from public.finish_arcade_run(next_run, test_user, 'test-game', 50, 12000, 'standard', 100::smallint, 'win', true, grants, '{}'::text[], now(), 45);
  assert saved.best_score = 200 and saved.best_time_ms = 8000 and saved.fewest_moves = 25, 'Slower/worse victories preserve best records';

  perform * from public.begin_arcade_run(stale_run, test_user, 'test-game', 'standard', now());
  next_run := gen_random_uuid();
  perform * from public.begin_arcade_run(next_run, test_user, 'test-game', 'standard', now());
  rejected := false;
  begin
    perform * from public.finish_arcade_run(stale_run, test_user, 'test-game', 999, 1, 'standard', 100::smallint, 'win', true, grants, '{}'::text[], now(), 1);
  exception when others then rejected := true;
  end;
  assert rejected, 'A superseded device/run cannot finish';
  select * into saved from public.finish_arcade_run(next_run, test_user, 'test-game', 50, 2, 'standard', 40::smallint, 'loss', false, '[]'::jsonb, '{}'::text[], now(), 1);
  assert saved.attempts = 5 and saved.wins = 3 and saved.losses = 1;
  assert saved.best_time_ms = 8000 and saved.fewest_moves = 25, 'A quick failure cannot set a best completion record';
  assert saved.progress = 100 and saved.completed_at is not null;
  assert saved.last_result = 'loss';

  -- Original DB interface remains compatible; historical data is not deleted or re-keyed.
  perform * from public.record_challenge_result(test_user, 'snake', 500, true, 'test-legacy-coupon', now());
  assert (select best_score = 500 and attempts = 1 from public.challenge_scores where user_id = test_user and challenge_id = 'snake');
end;
$$;
rollback;
