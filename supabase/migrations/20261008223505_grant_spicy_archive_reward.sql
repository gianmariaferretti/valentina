-- Additive, server-only grant. No historical state or game rules are changed.
create or replace function public.grant_experience_coupon(
  p_user_id uuid, p_reward_id text, p_coupon_id text, p_source text
)
returns table (reward_was_new boolean)
language plpgsql security invoker set search_path = ''
as $$
declare affected integer;
begin
  if p_user_id is null or coalesce(length(p_reward_id), 0) not between 1 and 160
    or coalesce(length(p_coupon_id), 0) not between 1 and 100
    or coalesce(length(p_source), 0) not between 1 and 120 then
    raise exception 'Invalid experience reward.';
  end if;
  insert into public.coupon_state (user_id, coupon_id, unlocked_at)
    values (p_user_id, p_coupon_id, now())
    on conflict (user_id, coupon_id) do update
      set unlocked_at = coalesce(public.coupon_state.unlocked_at, excluded.unlocked_at);
  -- In particular, redeemed_at is never assigned or reset.
  insert into public.discoveries (user_id, discovery_id, discovery_type, source, discovered_at)
    values (p_user_id, p_reward_id, 'reward', p_source, now())
    on conflict (user_id, discovery_id) do nothing;
  get diagnostics affected = row_count;
  insert into public.discoveries (user_id, discovery_id, discovery_type, source, discovered_at)
    values (p_user_id, 'coupon:' || p_coupon_id, 'coupon', p_source, now())
    on conflict (user_id, discovery_id) do nothing;
  return query select affected = 1;
end;
$$;
revoke all on function public.grant_experience_coupon(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.grant_experience_coupon(uuid, text, text, text) to service_role;
