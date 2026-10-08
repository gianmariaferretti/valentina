import "server-only";

import type {
  OpenLetterStateInput,
  OpenWhenStateRepository,
  SavedLetterState,
} from "@/features/open-when/repositories/open-when-state-repository";
import type { OpenWhenState } from "@/features/open-when/types";
import { PersistenceError } from "@/lib/persistence/persistence-error";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";

export class SupabaseOpenWhenStateRepository implements OpenWhenStateRepository {
  async get(): Promise<OpenWhenState> {
    const { client, userId } = getSupabaseServerContext();
    const [lettersResult, rewardsResult] = await Promise.all([
      client
        .from("letter_state")
        .select("letter_slug, opened_at")
        .eq("user_id", userId),
      client
        .from("discoveries")
        .select("discovery_id, discovered_at")
        .eq("user_id", userId)
        .eq("discovery_type", "reward"),
    ]);

    assertSupabaseResult("Unable to load opened letters.", lettersResult.error);
    assertSupabaseResult("Unable to load letter rewards.", rewardsResult.error);

    return {
      version: 1,
      openedLetters: (lettersResult.data ?? []).map((row) => ({
        slug: row.letter_slug,
        openedAt: row.opened_at,
      })),
      claimedRewards: (rewardsResult.data ?? []).map((row) => ({
        rewardId: row.discovery_id,
        claimedAt: row.discovered_at,
      })),
    };
  }

  async open(input: OpenLetterStateInput): Promise<SavedLetterState> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc("open_letter_state", {
      p_user_id: userId,
      p_letter_slug: input.slug,
      p_opened_at: input.openedAt,
      p_reward_id: input.rewardId ?? undefined,
      p_reward_coupon_id: input.rewardCouponId ?? undefined,
    });

    assertSupabaseResult("Unable to save opened letter.", error);
    const saved = data?.[0];
    if (!saved) throw new PersistenceError("Opened letter was not saved.");

    return {
      openedAt: saved.opened_at,
      letterWasNew: saved.letter_was_new,
      rewardWasNew: saved.reward_was_new,
    };
  }
}
