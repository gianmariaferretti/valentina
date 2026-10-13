-- Isolated/local database only. Every test write rolls back.
begin;
set local role service_role;
do $$
declare
  u uuid := gen_random_uuid();
  r uuid;
  rejected boolean;
  saved record;
  game text;
  target text;
  outcome text;
  points integer;
begin
  -- Normal clearance cannot grant the perfect coupon. Failure is atomic.
  r := gen_random_uuid();
  perform * from public.begin_arcade_run(r,u,'break-defences','standard',now());
  rejected := false;
  begin
    perform * from public.finish_arcade_run(r,u,'break-defences',18000,60000,'standard',100::smallint,'defences-breached',true,
      '[{"id":"perfect","kind":"coupon","targetId":"no-budget-date"}]', '{}',now(),null);
  exception when others then rejected := true;
  end;
  assert rejected;
  assert not exists(select 1 from public.coupon_state where user_id=u);
  assert (select wins=0 from public.challenge_scores where user_id=u and challenge_id='break-defences');
  select * into saved from public.finish_arcade_run(r,u,'break-defences',18000,60000,'standard',100::smallint,'defences-breached',true,
    '[{"id":"evening","kind":"coupon","targetId":"evening-your-way"}]','{}',now(),null);
  assert saved.wins=1;
  assert not exists(select 1 from public.coupon_state where user_id=u and coupon_id='no-budget-date');
  update public.coupon_state set redeemed_at='2026-01-01T12:00:00Z' where user_id=u and coupon_id='evening-your-way';
  r := gen_random_uuid();
  perform * from public.begin_arcade_run(r,u,'break-defences','standard',now());
  select * into saved from public.finish_arcade_run(r,u,'break-defences',18000,55000,'standard',100::smallint,'defences-perfect',true,
    '[{"id":"perfect","kind":"coupon","targetId":"no-budget-date"},{"id":"evening","kind":"coupon","targetId":"evening-your-way"}]','{}',now(),null);
  assert exists(select 1 from public.coupon_state where user_id=u and coupon_id='no-budget-date' and redeemed_at is null);
  assert (select redeemed_at='2026-01-01T12:00:00Z'::timestamptz from public.coupon_state where user_id=u and coupon_id='evening-your-way');
  select * into saved from public.finish_arcade_run(r,u,'break-defences',19000,1,'standard',100::smallint,'defences-perfect',true,
    '[{"id":"perfect","kind":"coupon","targetId":"no-budget-date"}]','{}',now(),null);
  assert cardinality(saved.newly_granted_reward_ids)=0 and saved.best_time_ms=55000;

  for game,target,outcome,points in select * from (values
    ('snake','coupon-with-no-rules','snake-complete',750),
    ('maze','weekend-getaway','maze-escaped',1800),
    ('365-memories','classified-coupon','archive-complete',1800)) as mappings(game,target,outcome,points)
  loop
    r:=gen_random_uuid();
    perform * from public.begin_arcade_run(r,u,game,'standard',now());
    perform * from public.finish_arcade_run(r,u,game,points,40000,'standard',100::smallint,outcome,true,
      jsonb_build_array(jsonb_build_object('id',game||'-coupon','kind','coupon','targetId',target)),'{}',now(),null);
    assert exists(select 1 from public.coupon_state where user_id=u and coupon_id=target and unlocked_at is not null and redeemed_at is null);
  end loop;
  r:=gen_random_uuid();
  perform * from public.begin_arcade_run(r,u,'relationship-minefield','standard',now());
  rejected:=false;
  begin
    perform * from public.finish_arcade_run(r,u,'relationship-minefield',201,60000,'standard',100::smallint,'field-cleared',true,
      '[{"id":"retired","kind":"coupon","targetId":"one-question-honest-answer"}]','{}',now(),null);
  exception when others then rejected:=true;
  end;
  assert rejected;
  perform * from public.finish_arcade_run(r,u,'relationship-minefield',201,60000,'standard',100::smallint,'field-cleared',true,
    '[{"id":"navigator","kind":"achievement","targetId":"minefield-navigator"}]','{}',now(),null);
  assert exists(select 1 from public.achievements where user_id=u and achievement_id='minefield-navigator');
  assert not exists(select 1 from public.coupon_state where user_id=u and coupon_id='one-question-honest-answer');
  -- Legacy grant RPC cannot resurrect GV-034 either.
  rejected:=false;
  begin
    perform * from public.record_challenge_result(u,'legacy-test',500,true,'one-question-honest-answer',now());
  exception when others then rejected:=true;
  end;
  assert rejected;
end;
$$;
rollback;
