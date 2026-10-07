"use server";

import { revalidatePath } from "next/cache";

import { getOpenWhenLetter, openWhenLetters } from "@/data/open-when";
import { getExperienceReward } from "@/data/rewards";
import {
  isLetterOpened,
  isRewardClaimed,
} from "@/features/open-when/lib/open-when-domain";
import { getOpenWhenStateRepository } from "@/features/open-when/repositories/get-open-when-state-repository";
import { grantExperienceReward } from "@/features/rewards/lib/grant-reward";
import type { GrantedExperienceReward } from "@/features/rewards/types";
import { hasValidAccessSession } from "@/lib/auth/session";

export interface OpenLetterResult {
  readonly status: "success" | "error";
  readonly message: string;
  readonly openedAt?: string;
  readonly openedCount?: number;
  readonly reward?: GrantedExperienceReward;
}

export async function openLetter(slug: string): Promise<OpenLetterResult> {
  if (!(await hasValidAccessSession())) {
    return { status: "error", message: "Your private session has expired." };
  }

  const letter = getOpenWhenLetter(slug);
  if (!letter) {
    return { status: "error", message: "That envelope does not exist." };
  }

  const repository = getOpenWhenStateRepository();
  const state = await repository.get();
  const alreadyOpened = isLetterOpened(slug, state);
  const validOpenedLetters = state.openedLetters.filter((openedLetter) =>
    openWhenLetters.some((item) => item.slug === openedLetter.slug),
  );
  const openedAt =
    state.openedLetters.find((item) => item.slug === slug)?.openedAt ??
    new Date().toISOString();
  let reward: GrantedExperienceReward | undefined;
  let claimedRewards = state.claimedRewards;

  if (letter.rewardId) {
    const definition = getExperienceReward(letter.rewardId);
    if (!definition) {
      return { status: "error", message: "The hidden reward is unavailable." };
    }

    reward = await grantExperienceReward(definition);

    if (!isRewardClaimed(definition.id, state)) {
      claimedRewards = [
        ...claimedRewards,
        { rewardId: definition.id, claimedAt: new Date().toISOString() },
      ];
    }

    if (definition.kind === "coupon") {
      revalidatePath("/coupons");
      revalidatePath(`/coupons/${definition.targetId}`);
    }
  }

  const openedLetters = alreadyOpened
    ? validOpenedLetters
    : [...validOpenedLetters, { slug, openedAt }];

  await repository.save({
    version: 1,
    openedLetters,
    claimedRewards,
  });

  revalidatePath("/open-when");
  revalidatePath(`/open-when/${slug}`);

  return {
    status: "success",
    message: alreadyOpened ? "Letter reopened." : "Envelope opened.",
    openedAt,
    openedCount: openedLetters.length,
    reward,
  };
}
