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
import { createRewardPresentation } from "@/features/rewards/lib/reward-domain";
import { hasValidAccessSession } from "@/lib/auth/session";
import {
  persistenceFailureMessage,
  reportPersistenceFailure,
} from "@/lib/persistence/persistence-error";

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

  try {
    const repository = getQuizStateRepository();
    const state = await repository.get();
    const attemptId = randomUUID();
    await repository.startAttempt({
      id: attemptId,
      startedAt: new Date().toISOString(),
      answers: [],
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
  } catch (error) {
    reportPersistenceFailure("start quiz", error);
    return {
      status: "error",
      message: persistenceFailureMessage("This quiz attempt"),
    };
  }
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

  try {
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
      await repository.saveAnswer({ ...attempt, answers });

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
    const achievementEarned = Boolean(
      quizAchievementRule && currentScore >= quizAchievementRule.threshold,
    );
    const rewardEarned = Boolean(
      quizCouponRewardRule &&
      currentScore >= quizCouponRewardRule.threshold &&
      !state.claimedRewardIds.includes(quizCouponRewardRule.rewardId),
    );
    const rewardDefinition =
      rewardEarned && quizCouponRewardRule
        ? getExperienceReward(quizCouponRewardRule.rewardId)
        : undefined;

    if (rewardEarned && !rewardDefinition) {
      return { status: "error", message: "The quiz reward is unavailable." };
    }

    const saved = await repository.completeAttempt({
      attempt: { ...attempt, answers },
      score: currentScore,
      completedAt: new Date().toISOString(),
      achievementId:
        achievementEarned && quizAchievementRule
          ? quizAchievementRule.achievement.id
          : null,
      rewardId: rewardDefinition?.id ?? null,
      rewardCouponId:
        rewardDefinition?.kind === "coupon" ? rewardDefinition.targetId : null,
    });
    const achievement: QuizCompletion["achievement"] =
      achievementEarned && quizAchievementRule
        ? {
            ...quizAchievementRule.achievement,
            newlyGranted: saved.achievementWasNew,
          }
        : null;
    const reward: QuizCompletion["reward"] =
      saved.rewardWasNew && rewardDefinition
        ? createRewardPresentation(rewardDefinition, true)
        : null;

    if (rewardDefinition?.kind === "coupon") {
      revalidatePath("/coupons");
      revalidatePath(`/coupons/${rewardDefinition.targetId}`);
    }

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
          ? state.claimedRewardIds.includes(quizCouponRewardRule.rewardId) ||
            saved.rewardWasNew
          : false,
      },
    };
  } catch (error) {
    reportPersistenceFailure("submit quiz answer", error);
    return {
      status: "error",
      message: persistenceFailureMessage("This answer"),
    };
  }
}
