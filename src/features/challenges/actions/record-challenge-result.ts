"use server";

import { revalidatePath } from "next/cache";

import { getArcadeChallenge } from "@/data/challenges";
import { getChallengeStateRepository } from "@/features/challenges/repositories/get-challenge-state-repository";
import type { ChallengeProgress } from "@/features/challenges/types";
import { hasValidAccessSession } from "@/lib/auth/session";
import {
  persistenceFailureMessage,
  reportPersistenceFailure,
} from "@/lib/persistence/persistence-error";

export interface RecordChallengeResult {
  readonly status: "success" | "error";
  readonly message: string;
  readonly progress?: ChallengeProgress;
  readonly couponUnlocked?: boolean;
}

export async function recordChallengeResult(
  challengeId: string,
  submittedScore: number,
): Promise<RecordChallengeResult> {
  if (!(await hasValidAccessSession())) {
    return { status: "error", message: "Your private session has expired." };
  }

  const challenge = getArcadeChallenge(challengeId);
  const score = Math.floor(submittedScore);

  if (
    !challenge ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 100_000 ||
    score % challenge.scoreStep !== 0
  ) {
    return { status: "error", message: "That score could not be verified." };
  }

  const completed = score >= challenge.requiredScore;

  try {
    const saved = await getChallengeStateRepository().recordResult({
      challengeId,
      score,
      completed,
      rewardCouponId: challenge.rewardCouponId,
      recordedAt: new Date().toISOString(),
    });

    if (completed) {
      revalidatePath("/coupons");
      revalidatePath(`/coupons/${challenge.rewardCouponId}`);
    }

    revalidatePath(`/challenges/${challengeId}`);
    revalidatePath("/challenges");

    return {
      status: "success",
      message: completed
        ? "Impossible. You actually did it."
        : "Attempt archived. The coupon remains locked.",
      progress: saved.progress,
      couponUnlocked: saved.couponUnlocked,
    };
  } catch (error) {
    reportPersistenceFailure("record challenge result", error);
    return {
      status: "error",
      message: persistenceFailureMessage("This score"),
    };
  }
}
