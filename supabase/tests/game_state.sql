-- Run AFTER both migrations. Everything, including fixture data, rolls back.
begin;
set local role service_role;

do $$
declare
  test_user uuid := gen_random_uuid();
  first_run uuid := gen_random_uuid();
  second_run uuid := gen_random_uuid();
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
  assert not has_function_privilege('anon', 'public.begin_game_run(uuid,uuid,text,text,timestamptz)', 'execute');
  assert not has_function_privilege('authenticated', 'public.finish_game_run(uuid,uuid,text,integer,integer,text,smallint,text,boolean,jsonb,text[],timestamptz)', 'execute');

  perform * from public.begin_game_run(first_run, test_user, 'test-game', 'standard', now());
  select * into saved from public.begin_game_run(first_run, test_user, 'test-game', 'standard', now());
  assert saved.attempts = 1, 'Repeated begin must not count a new attempt';

  rejected := false;
  begin
    perform * from public.finish_game_run(first_run, test_user, 'test-game', 100, 1000, 'standard', 100::smallint, 'win', true,
      '[{"id":"bad","kind":"unsupported","targetId":"bad"}]'::jsonb, '{}'::text[], now());
  exception when others then rejected := true;
  end;
  assert rejected, 'Invalid reward must abort the entire result';
  assert (select wins = 0 and best_score = 0 from public.challenge_scores where user_id = test_user and challenge_id = 'test-game');

  select * into saved from public.finish_game_run(first_run, test_user, 'test-game', 100, 1000, 'standard', 100::smallint, 'win', true, grants, array['note'], now());
  assert saved.wins = 1 and saved.losses = 0 and saved.best_score = 100 and saved.latest_score = 100;
  assert cardinality(saved.newly_granted_reward_ids) = 5;
  assert cardinality(saved.unlocked_rewards) = 5;
  assert saved.discovered_secrets = array['note'];
  assert (select count(*) = 1 from public.achievements where user_id = test_user);
  assert (select count(*) = 1 from public.coupon_state where user_id = test_user and unlocked_at is not null);

  select * into saved from public.finish_game_run(first_run, test_user, 'test-game', 100, 1000, 'standard', 100::smallint, 'win', true, grants, array['note'], now());
  assert saved.wins = 1 and cardinality(saved.newly_granted_reward_ids) = 0, 'Finish retry must be idempotent';

  perform * from public.begin_game_run(stale_run, test_user, 'test-game', 'standard', now());
  perform * from public.begin_game_run(second_run, test_user, 'test-game', 'standard', now());
  rejected := false;
  begin
    perform * from public.finish_game_run(stale_run, test_user, 'test-game', 999, 1000, 'standard', 100::smallint, 'win', true, grants, '{}'::text[], now());
  exception when others then rejected := true;
  end;
  assert rejected, 'Superseded device/run cannot replace a newer result';

  select * into saved from public.finish_game_run(second_run, test_user, 'test-game', 50, 2000, 'standard', 40::smallint, 'loss', false, '[]'::jsonb, '{}'::text[], now());
  assert saved.attempts = 3 and saved.wins = 1 and saved.losses = 1;
  assert saved.best_score = 100 and saved.latest_score = 50 and saved.duration_ms = 2000;
  assert saved.progress = 100 and saved.completed_at is not null, 'Replay must preserve completed archive progress';

  perform * from public.record_challenge_result(test_user, 'snake', 500, true, 'test-legacy-coupon', now());
  assert (select best_score = 500 and attempts = 1 from public.challenge_scores where user_id = test_user and challenge_id = 'snake');
end;
$$;

rollback;
