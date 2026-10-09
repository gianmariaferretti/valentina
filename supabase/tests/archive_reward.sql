-- Run after migrations in a local/preview database. Always rolls back.
begin;
do $$
declare
  u uuid := 'bbbbbbbb-aaaa-4000-8000-000000000032';
  first_new boolean;
  again_new boolean;
  saved_redemption timestamptz;
begin
  delete from public.discoveries where user_id = u;
  delete from public.coupon_state where user_id = u;
  select reward_was_new into first_new from public.grant_experience_coupon(u, 'spicy-archive-completed', 'you-found-me', 'secret:spicy-archive');
  if not first_new then raise exception 'First grant must be new'; end if;
  if (select redeemed_at from public.coupon_state where user_id = u and coupon_id = 'you-found-me') is not null then raise exception 'Grant must not redeem'; end if;
  update public.coupon_state set redeemed_at = '2026-01-01T00:00:00Z' where user_id = u and coupon_id = 'you-found-me';
  select reward_was_new into again_new from public.grant_experience_coupon(u, 'spicy-archive-completed', 'you-found-me', 'secret:spicy-archive');
  if again_new then raise exception 'Retry must be idempotent'; end if;
  select redeemed_at into saved_redemption from public.coupon_state where user_id = u and coupon_id = 'you-found-me';
  if saved_redemption <> '2026-01-01T00:00:00Z'::timestamptz then raise exception 'Redemption must be preserved'; end if;
  if (select count(*) from public.discoveries where user_id = u) <> 2 then raise exception 'Expected exactly reward and coupon discoveries'; end if;
  if has_function_privilege('anon', 'public.grant_experience_coupon(uuid,text,text,text)', 'execute')
    or has_function_privilege('authenticated', 'public.grant_experience_coupon(uuid,text,text,text)', 'execute') then raise exception 'Browser roles must be denied'; end if;
end;
$$;
rollback;
