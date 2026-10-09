import "server-only";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";
import { PersistenceError } from "@/lib/persistence/persistence-error";

/** Atomic coupon/discovery grant shared by non-game experiences; never redeems. */
export async function grantExperienceCoupon(input: {
  readonly rewardId: string;
  readonly couponId: string;
  readonly source: string;
}): Promise<boolean> {
  const { client, userId } = getSupabaseServerContext();
  const { data, error } = await client.rpc("grant_experience_coupon", {
    p_user_id: userId,
    p_reward_id: input.rewardId,
    p_coupon_id: input.couponId,
    p_source: input.source,
  });
  assertSupabaseResult("Unable to save experience reward.", error);
  if (!data?.[0])
    throw new PersistenceError("Experience reward was not saved.");
  return data[0].reward_was_new;
}
