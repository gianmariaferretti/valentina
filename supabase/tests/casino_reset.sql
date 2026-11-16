-- Kiss Casino season reset. Everything is rolled back.
begin;

do $$
declare
  u uuid := '00000000-0000-4000-8000-00000000c0de';
  v integer;
  r record;
  failed boolean;
begin
  -- Season 1: a purchase (debt 25) and one casino win.
  v := public.commit_casino_state(u, 0, 110, 25, '{"v":1,"season":1}'::jsonb,
    '[{"couponId":"casino-c001","code":"GV-C001","prizeId":"massage-30","setting":"together","wonAt":"2026-11-16T15:00:00Z"}]'::jsonb,
    '[{"kind":"purchase","realKisses":25,"chips":120,"label":"Smooch Bundle","at":"2026-11-16T15:00:00Z"}]'::jsonb);
  assert v = 1, 'first commit is version 1';
  assert (select season from public.casino_ledger where user_id = u) = 1, 'ledger tagged season 1';

  -- Redeem the casino coupon: coupon redeemed and casino reset, atomically.
  select * into r from public.redeem_casino_coupon_with_reset(
    u, 'casino-c001', '2026-11-16T16:00:00Z', 1, 50, '{"v":1,"onboarded":false}'::jsonb, true);
  assert r.version = 2 and r.season = 2, 'new version and season';
  assert (select redeemed_at from public.coupon_state where user_id = u and coupon_id = 'casino-c001') is not null, 'coupon redeemed';
  assert (select balance from public.casino_state where user_id = u) = 50, 'balance reset';
  assert (select debt from public.casino_state where user_id = u) = 0, 'debt reset';
  assert (select (state ->> 'season')::int from public.casino_state where user_id = u) = 2, 'state season';
  assert (select count(*) from public.casino_ledger where user_id = u and season = 1) = 1, 'season 1 ledger archived, not deleted';

  -- Each coupon works once: a second redemption is refused and changes nothing.
  failed := false;
  begin
    perform public.redeem_casino_coupon_with_reset(
      u, 'casino-c001', '2026-11-16T17:00:00Z', 2, 50, '{"v":1}'::jsonb, true);
  exception when others then failed := true;
  end;
  assert failed, 'second redemption refused';
  assert (select season from public.casino_state where user_id = u) = 2, 'no extra reset';

  -- Only casino wins can trigger a reset.
  failed := false;
  begin
    perform public.redeem_casino_coupon_with_reset(
      u, 'casino-c999', '2026-11-16T17:00:00Z', 2, 50, '{"v":1}'::jsonb, true);
  exception when others then failed := true;
  end;
  assert failed, 'unknown casino coupon refused';

  -- New season ledger rows are tagged season 2.
  v := public.commit_casino_state(u, 2, 60, 5, '{"v":1}'::jsonb, '[]'::jsonb,
    '[{"kind":"purchase","realKisses":5,"chips":10,"label":"Peck Pack","at":"2026-11-16T18:00:00Z"}]'::jsonb);
  assert (select count(*) from public.casino_ledger where user_id = u and season = 2) = 1, 'season 2 ledger';
end $$;

rollback;
