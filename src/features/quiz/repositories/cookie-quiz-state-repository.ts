import "server-only";

import { cookies } from "next/headers";

import type { QuizStateRepository } from "@/features/quiz/repositories/quiz-state-repository";
import {
  EMPTY_QUIZ_STATE,
  type ActiveQuizAttempt,
  type QuizAnswerRecord,
  type QuizState,
} from "@/features/quiz/types";
import { decodeSignedState, encodeSignedState } from "@/lib/auth/signed-state";

const QUIZ_STATE_COOKIE = "vg_quiz_state";
const COOKIE_DURATION_SECONDS = 60 * 60 * 24 * 365;

function isDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isQuizAnswer(value: unknown): value is QuizAnswerRecord {
  if (!value || typeof value !== "object") return false;

  const answer = value as Record<string, unknown>;
  return (
    typeof answer.questionId === "string" &&
    typeof answer.answerId === "string" &&
    typeof answer.correct === "boolean"
  );
}

function parseActiveAttempt(value: unknown): ActiveQuizAttempt | null {
  if (!value || typeof value !== "object") return null;

  const attempt = value as Record<string, unknown>;
  if (typeof attempt.id !== "string" || !isDate(attempt.startedAt)) return null;

  const answers = Array.isArray(attempt.answers)
    ? attempt.answers.filter(isQuizAnswer).slice(0, 10)
    : [];

  return { id: attempt.id, startedAt: attempt.startedAt, answers };
}

function stringList(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter((item): item is string => typeof item === "string"),
    ),
  ];
}

function safeInteger(value: unknown, maximum: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return 0;
  }

  return Math.min(value, maximum);
}

function parseState(value: string | undefined): QuizState {
  const parsed = decodeSignedState(value);
  if (!parsed || typeof parsed !== "object") return EMPTY_QUIZ_STATE;

  const state = parsed as Record<string, unknown>;
  return {
    version: 1,
    bestScore: safeInteger(state.bestScore, 10),
    attempts: safeInteger(state.attempts, Number.MAX_SAFE_INTEGER),
    unlockedAchievementIds: stringList(state.unlockedAchievementIds),
    claimedRewardIds: stringList(state.claimedRewardIds),
    activeAttempt: parseActiveAttempt(state.activeAttempt),
  };
}

export class CookieQuizStateRepository implements QuizStateRepository {
  async get(): Promise<QuizState> {
    const cookieStore = await cookies();
    return parseState(cookieStore.get(QUIZ_STATE_COOKIE)?.value);
  }

  async save(state: QuizState): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(QUIZ_STATE_COOKIE, encodeSignedState(state), {
      httpOnly: true,
      maxAge: COOKIE_DURATION_SECONDS,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  }
}
