"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import {
  quizAchievementRule,
  quizCouponRewardRule,
  getQuizResult,
} from "@/data/quiz";
import { quizQuestions } from "@/data/quiz-questions";
import { getExperienceReward } from "@/data/rewards";
import { getQuizStateRepository } from "@/features/quiz/repositories/get-quiz-state-repository";
import type {
  QuizCompletion,
  QuizPersistentStats,
} from "@/features/quiz/types";
import { grantExperienceReward } from "@/features/rewards/lib/grant-reward";
import { hasValidAccessSession } from "@/lib/auth/session";

export interface StartQuizResult {
  readonly status: "success" | "error";
  readonly message: string;
  readonly attemptId?: string;
  readonly stats?: QuizPersistentStats;
}

export interface SubmitQuizAnswerInput {
  readonly attemptId: string;
  readonly questionId: string;
  readonly answerId: string;
}

export interface SubmitQuizAnswerResult {
  readonly status: "success" | "error";
  readonly message: string;
  readonly isCorrect?: boolean;
  readonly feedback?: string;
  readonly currentScore?: number;
  readonly answeredCount?: number;
  readonly completed?: boolean;
  readonly completion?: QuizCompletion;
}

function getPersistentStats(
  bestScore: number,
  attempts: number,
  unlockedAchievementIds: readonly string[],
  claimedRewardIds: readonly string[],
): QuizPersistentStats {
  return {
    bestScore,
    attempts,
    achievementUnlocked: quizAchievementRule
      ? unlockedAchievementIds.includes(quizAchievementRule.achievement.id)
      : false,
    rewardClaimed: quizCouponRewardRule
      ? claimedRewardIds.includes(quizCouponRewardRule.rewardId)
      : false,
  };
}

export async function startQuiz(): Promise<StartQuizResult> {
  if (!(await hasValidAccessSession())) {
    return { status: "error", message: "Your private session has expired." };
  }

  const repository = getQuizStateRepository();
  const state = await repository.get();
  const attemptId = randomUUID();

  await repository.save({
    ...state,
    activeAttempt: {
      id: attemptId,
      startedAt: new Date().toISOString(),
      answers: [],
    },
  });

  return {
    status: "success",
    message: "Relationship examination started.",
    attemptId,
    stats: getPersistentStats(
      state.bestScore,
      state.attempts,
      state.unlockedAchievementIds,
      state.claimedRewardIds,
    ),
  };
}

export async function submitQuizAnswer(
  input: SubmitQuizAnswerInput,
): Promise<SubmitQuizAnswerResult> {
  if (!(await hasValidAccessSession())) {
    return { status: "error", message: "Your private session has expired." };
  }

  if (
    !input ||
    typeof input.attemptId !== "string" ||
    typeof input.questionId !== "string" ||
    typeof input.answerId !== "string"
  ) {
    return { status: "error", message: "That answer could not be verified." };
  }

  const repository = getQuizStateRepository();
  const state = await repository.get();
  const attempt = state.activeAttempt;

  if (!attempt || attempt.id !== input.attemptId) {
    return {
      status: "error",
      message: "This quiz attempt has expired. Start a fresh examination.",
    };
  }

  const question = quizQuestions[attempt.answers.length];
  if (!question || question.id !== input.questionId) {
    return {
      status: "error",
      message: "That question arrived out of order. The jury is suspicious.",
    };
  }

  if (!question.options.some((option) => option.id === input.answerId)) {
    return { status: "error", message: "That answer does not exist." };
  }

  const isCorrect = question.correctOptionId === input.answerId;
  const answers = [
    ...attempt.answers,
    {
      questionId: question.id,
      answerId: input.answerId,
      correct: isCorrect,
    },
  ];
  const currentScore = answers.filter((answer) => answer.correct).length;
  const completed = answers.length === quizQuestions.length;

  if (!completed) {
    await repository.save({
      ...state,
      activeAttempt: { ...attempt, answers },
    });

    return {
      status: "success",
      message: "Answer archived.",
      isCorrect,
      feedback: isCorrect
        ? question.feedback.correct
        : question.feedback.incorrect,
      currentScore,
      answeredCount: answers.length,
      completed: false,
    };
  }

  const attempts = state.attempts + 1;
  const bestScore = Math.max(state.bestScore, currentScore);
  let unlockedAchievementIds = state.unlockedAchievementIds;
  let claimedRewardIds = state.claimedRewardIds;
  let achievement: QuizCompletion["achievement"] = null;
  let reward: QuizCompletion["reward"] = null;

  if (quizAchievementRule && currentScore >= quizAchievementRule.threshold) {
    const achievementId = quizAchievementRule.achievement.id;
    const alreadyUnlocked = unlockedAchievementIds.includes(achievementId);
    achievement = {
      ...quizAchievementRule.achievement,
      newlyGranted: !alreadyUnlocked,
    };

    if (!alreadyUnlocked) {
      unlockedAchievementIds = [...unlockedAchievementIds, achievementId];
    }
  }

  if (
    quizCouponRewardRule &&
    currentScore >= quizCouponRewardRule.threshold &&
    !claimedRewardIds.includes(quizCouponRewardRule.rewardId)
  ) {
    const rewardDefinition = getExperienceReward(quizCouponRewardRule.rewardId);

    if (!rewardDefinition) {
      return { status: "error", message: "The quiz reward is unavailable." };
    }

    reward = await grantExperienceReward(rewardDefinition);
    claimedRewardIds = [...claimedRewardIds, quizCouponRewardRule.rewardId];
    revalidatePath("/coupons");

    if (rewardDefinition.kind === "coupon") {
      revalidatePath(`/coupons/${rewardDefinition.targetId}`);
    }
  }

  await repository.save({
    version: 1,
    bestScore,
    attempts,
    unlockedAchievementIds,
    claimedRewardIds,
    activeAttempt: null,
  });

  revalidatePath("/quiz");
  revalidatePath("/achievements");

  return {
    status: "success",
    message: "Examination complete.",
    isCorrect,
    feedback: isCorrect
      ? question.feedback.correct
      : question.feedback.incorrect,
    currentScore,
    answeredCount: answers.length,
    completed: true,
    completion: {
      score: currentScore,
      totalQuestions: quizQuestions.length,
      bestScore,
      attempts,
      result: getQuizResult(currentScore),
      achievement,
      reward,
      rewardClaimed: quizCouponRewardRule
        ? claimedRewardIds.includes(quizCouponRewardRule.rewardId)
        : false,
    },
  };
}
