"use server";

import { revalidatePath } from "next/cache";

import { getArcadeChallenge } from "@/data/challenges";
import { getChallengeProgress } from "@/features/challenges/lib/challenge-domain";
import { getChallengeStateRepository } from "@/features/challenges/repositories/get-challenge-state-repository";
import type { ChallengeProgress } from "@/features/challenges/types";
import { getCouponStateRepository } from "@/features/coupons/repositories/get-coupon-state-repository";
import { hasValidAccessSession } from "@/lib/auth/session";

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

  const challengeRepository = getChallengeStateRepository();
  const currentState = await challengeRepository.get();
  const currentProgress = getChallengeProgress(challengeId, currentState);
  const completed = score >= challenge.requiredScore;
  const completedAt =
    currentProgress.completedAt ??
    (completed ? new Date().toISOString() : null);
  const nextProgress: ChallengeProgress = {
    challengeId,
    attempts: currentProgress.attempts + 1,
    bestScore: Math.max(currentProgress.bestScore, score),
    completedAt,
  };

  await challengeRepository.save({
    version: 1,
    challenges: [
      ...currentState.challenges.filter(
        (progress) => progress.challengeId !== challengeId,
      ),
      nextProgress,
    ],
  });

  let couponUnlocked = false;
  if (completed) {
    const couponRepository = getCouponStateRepository();
    const couponState = await couponRepository.get();
    couponUnlocked = !couponState.unlockedCouponIds.includes(
      challenge.rewardCouponId,
    );

    if (couponUnlocked) {
      await couponRepository.save({
        ...couponState,
        unlockedCouponIds: [
          ...couponState.unlockedCouponIds,
          challenge.rewardCouponId,
        ],
      });
    }

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
    progress: nextProgress,
    couponUnlocked,
  };
}
