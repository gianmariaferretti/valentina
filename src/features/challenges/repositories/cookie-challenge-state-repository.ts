import "server-only";

import { cookies } from "next/headers";

import type { ChallengeStateRepository } from "@/features/challenges/repositories/challenge-state-repository";
import {
  EMPTY_CHALLENGE_PROGRESS_STATE,
  type ChallengeProgress,
  type ChallengeProgressState,
} from "@/features/challenges/types";
import { decodeSignedState, encodeSignedState } from "@/lib/auth/signed-state";

const CHALLENGE_STATE_COOKIE = "vg_challenge_state";
const COOKIE_DURATION_SECONDS = 60 * 60 * 24 * 365;

function isChallengeProgress(value: unknown): value is ChallengeProgress {
  if (!value || typeof value !== "object") return false;

  const progress = value as Record<string, unknown>;
  return (
    typeof progress.challengeId === "string" &&
    typeof progress.bestScore === "number" &&
    Number.isFinite(progress.bestScore) &&
    typeof progress.attempts === "number" &&
    Number.isInteger(progress.attempts) &&
    (progress.completedAt === null ||
      (typeof progress.completedAt === "string" &&
        !Number.isNaN(Date.parse(progress.completedAt))))
  );
}

function parseState(value: string | undefined): ChallengeProgressState {
  const parsed = decodeSignedState(value);
  if (!parsed || typeof parsed !== "object") {
    return EMPTY_CHALLENGE_PROGRESS_STATE;
  }

  const record = parsed as Record<string, unknown>;
  const challenges = Array.isArray(record.challenges)
    ? record.challenges.filter(isChallengeProgress)
    : [];

  return { version: 1, challenges };
}

export class CookieChallengeStateRepository implements ChallengeStateRepository {
  async get(): Promise<ChallengeProgressState> {
    const cookieStore = await cookies();
    return parseState(cookieStore.get(CHALLENGE_STATE_COOKIE)?.value);
  }

  async save(state: ChallengeProgressState): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(CHALLENGE_STATE_COOKIE, encodeSignedState(state), {
      httpOnly: true,
      maxAge: COOKIE_DURATION_SECONDS,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  }
}
