"use server";

import { revalidatePath } from "next/cache";

import { getOpenWhenLetter, openWhenLetters } from "@/data/open-when";
import { getExperienceReward } from "@/data/rewards";
import { getOpenWhenStateRepository } from "@/features/open-when/repositories/get-open-when-state-repository";
import { createRewardPresentation } from "@/features/rewards/lib/reward-domain";
import type { GrantedExperienceReward } from "@/features/rewards/types";
import { hasValidAccessSession } from "@/lib/auth/session";
import {
  persistenceFailureMessage,
  reportPersistenceFailure,
} from "@/lib/persistence/persistence-error";

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

  try {
    const repository = getOpenWhenStateRepository();
    const state = await repository.get();
    const validOpenedCount = state.openedLetters.filter((openedLetter) =>
      openWhenLetters.some((item) => item.slug === openedLetter.slug),
    ).length;
    const rewardDefinition = letter.rewardId
      ? getExperienceReward(letter.rewardId)
      : undefined;

    if (letter.rewardId && !rewardDefinition) {
      return { status: "error", message: "The hidden reward is unavailable." };
    }

    const saved = await repository.open({
      slug,
      openedAt: new Date().toISOString(),
      rewardId: rewardDefinition?.id ?? null,
      rewardCouponId:
        rewardDefinition?.kind === "coupon" ? rewardDefinition.targetId : null,
    });
    const reward: GrantedExperienceReward | undefined = rewardDefinition
      ? createRewardPresentation(rewardDefinition, saved.rewardWasNew)
      : undefined;

    if (rewardDefinition?.kind === "coupon") {
      revalidatePath("/coupons");
      revalidatePath(`/coupons/${rewardDefinition.targetId}`);
    }

    revalidatePath("/open-when");
    revalidatePath(`/open-when/${slug}`);

    return {
      status: "success",
      message: saved.letterWasNew ? "Envelope opened." : "Letter reopened.",
      openedAt: saved.openedAt,
      openedCount: validOpenedCount + (saved.letterWasNew ? 1 : 0),
      reward,
    };
  } catch (error) {
    reportPersistenceFailure("open letter", error);
    return {
      status: "error",
      message: persistenceFailureMessage("This letter"),
    };
  }
}
