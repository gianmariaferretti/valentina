"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { getCoupon } from "@/data/coupons";
import { getVgGame } from "@/data/games";
import { getChallengeStateRepository } from "@/features/challenges/repositories/get-challenge-state-repository";
import { evaluateGameResult } from "@/features/games/lib/game-domain";
import { replayRelationshipStory } from "@/features/games/visual-novel/story-domain";
import type {
  GameDifficulty,
  GameProgress,
  GameRewardDefinition,
  GameRewardReceipt,
} from "@/features/games/types";
import { gameDifficulties } from "@/features/games/types";
import { hasValidAccessSession } from "@/lib/auth/session";
import {
  persistenceFailureMessage,
  reportPersistenceFailure,
} from "@/lib/persistence/persistence-error";

export interface BeginGameRunResponse {
  readonly status: "success" | "error";
  readonly message: string;
  readonly progress?: GameProgress;
  readonly runId?: string;
}

export interface FinishGameRunInput {
  readonly runId: string;
  readonly gameId: string;
  readonly score: number;
  readonly durationMs: number;
  readonly difficulty: GameDifficulty;
  readonly progress: number;
  readonly ending: string;
  readonly discoveredSecrets: readonly string[];
  readonly storyChoices?: readonly string[];
}

export interface FinishGameRunResponse {
  readonly status: "success" | "error";
  readonly message: string;
  readonly won: boolean;
  readonly progress?: GameProgress;
  readonly rewards: readonly GameRewardReceipt[];
}

export async function beginVgGameRun(
  gameId: string,
  difficulty: GameDifficulty,
): Promise<BeginGameRunResponse> {
  if (!(await hasValidAccessSession())) {
    return { status: "error", message: "Your private session has expired." };
  }

  const game = getVgGame(gameId);
  if (!game || !gameDifficulties.includes(difficulty)) {
    return { status: "error", message: "This game file could not be opened." };
  }

  try {
    const runId = randomUUID();
    const progress = await getChallengeStateRepository().beginRun({
      runId,
      gameId,
      difficulty,
      startedAt: new Date().toISOString(),
    });
    revalidatePath("/challenges");
    revalidatePath(`/challenges/${game.slug}`);
    return {
      status: "success",
      message: "Attempt registered. Plausible deniability has ended.",
      progress,
      runId,
    };
  } catch (error) {
    reportPersistenceFailure("begin game run", error);
    return {
      status: "error",
      message: persistenceFailureMessage("This attempt"),
    };
  }
}

export async function finishVgGameRun(
  input: FinishGameRunInput,
): Promise<FinishGameRunResponse> {
  if (!(await hasValidAccessSession())) {
    return {
      status: "error",
      message: "Your private session has expired.",
      won: false,
      rewards: [],
    };
  }

  if (
    !input ||
    typeof input.runId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      input.runId,
    ) ||
    typeof input.gameId !== "string" ||
    !Array.isArray(input.discoveredSecrets) ||
    input.discoveredSecrets.length > 50 ||
    input.discoveredSecrets.some((value) => typeof value !== "string")
  ) {
    return {
      status: "error",
      message: "The archive rejected an invalid game result.",
      won: false,
      rewards: [],
    };
  }

  const game = getVgGame(input.gameId);
  if (game?.engine === "survive-relationship") {
    try {
      const verified = replayRelationshipStory(input.storyChoices ?? []);
      input = {
        ...input,
        score: verified.score,
        progress: verified.progress,
        ending: verified.ending,
        discoveredSecrets: verified.discoveredSecrets,
      };
    } catch {
      return {
        status: "error",
        message:
          "This story transcript could not be verified. Complete a legitimate day before filing the report.",
        won: false,
        rewards: [],
      };
    }
  }
  const score = input.score;
  const durationMs = input.durationMs;
  const progress = input.progress;

  if (
    !game ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > game.maxScore ||
    !Number.isInteger(durationMs) ||
    durationMs < 0 ||
    durationMs > 21_600_000 ||
    !Number.isInteger(progress) ||
    progress < 0 ||
    progress > 100 ||
    !gameDifficulties.includes(input.difficulty) ||
    !game.allowedEndings.includes(input.ending)
  ) {
    return {
      status: "error",
      message: "The archive rejected an invalid game result.",
      won: false,
      rewards: [],
    };
  }

  // The active-run lock in finishRun prevents a second device from merging a superseded day.
  let archivedSecrets: readonly string[] = [];
  try {
    if (game.engine === "survive-relationship")
      archivedSecrets =
        (await getChallengeStateRepository().get()).games.find(
          (record) => record.gameId === game.gameId,
        )?.discoveredSecrets ?? [];
  } catch (error) {
    reportPersistenceFailure("load ending archive", error);
    return {
      status: "error",
      message: persistenceFailureMessage("This ending"),
      won: false,
      rewards: [],
    };
  }
  const { won, discoveredSecrets, rewards } = evaluateGameResult(
    game,
    input,
    archivedSecrets,
  );

  for (const reward of rewards) {
    if (reward.kind === "coupon" && !getCoupon(reward.targetId)) {
      return {
        status: "error",
        message: "A configured game coupon does not exist.",
        won,
        rewards: [],
      };
    }
  }

  try {
    const saved = await getChallengeStateRepository().finishRun({
      runId: input.runId,
      gameId: game.gameId,
      score,
      durationMs,
      difficulty: input.difficulty,
      progress,
      ending: input.ending,
      won,
      rewards,
      discoveredSecrets,
      finishedAt: new Date().toISOString(),
    });
    const newRewardIds = new Set(saved.newlyGrantedRewardIds);
    const receipts = rewards.map((reward) =>
      createRewardReceipt(reward, newRewardIds.has(reward.id)),
    );

    revalidatePath("/challenges");
    revalidatePath(`/challenges/${game.slug}`);
    revalidatePath("/achievements");
    revalidatePath("/coupons");
    revalidatePath("/secret");
    for (const reward of rewards) {
      if (reward.kind === "coupon") {
        revalidatePath(`/coupons/${reward.targetId}`);
      }
    }

    return {
      status: "success",
      message: won
        ? "Victory archived. The reward department has been notified."
        : "Attempt archived. The evidence will remain between us.",
      won,
      progress: saved.progress,
      rewards: receipts,
    };
  } catch (error) {
    reportPersistenceFailure("finish game run", error);
    return {
      status: "error",
      message: persistenceFailureMessage("This game result"),
      won,
      rewards: [],
    };
  }
}

function createRewardReceipt(
  reward: GameRewardDefinition,
  newlyGranted: boolean,
): GameRewardReceipt {
  return {
    id: reward.id,
    kind: reward.kind,
    title: reward.title,
    description: reward.description,
    newlyGranted,
    href:
      reward.kind === "coupon"
        ? `/coupons/${reward.targetId}`
        : reward.kind === "achievement"
          ? "/achievements"
          : reward.kind === "secret" || reward.kind === "item"
            ? "/secret"
            : "/challenges",
  };
}
