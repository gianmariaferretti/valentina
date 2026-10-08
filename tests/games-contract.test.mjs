import assert from "node:assert/strict";
import test from "node:test";

import { vgGames } from "../src/data/games.ts";
import { coupons } from "../src/data/coupons.ts";
import { gameMediaPlaceholders } from "../src/data/game-media.ts";
import { getMediaAsset } from "../src/data/media.ts";
import { masterArchiveFile } from "../src/data/game-secrets.ts";
import {
  evaluateGameResult,
  getRecoveredGameRewards,
} from "../src/features/games/lib/game-domain.ts";
import {
  minefieldNeighbours,
  revealSafeArea,
} from "../src/features/games/lib/minefield-domain.ts";

test("seven unique games preserve valid outcomes and coupon references", () => {
  assert.equal(vgGames.length, 7);
  assert.equal(new Set(vgGames.map((game) => game.gameId)).size, 7);
  const rewardIds = vgGames.flatMap((game) =>
    game.rewards.map((reward) => reward.id),
  );
  assert.equal(new Set(rewardIds).size, rewardIds.length);
  for (const game of vgGames) {
    for (const ending of game.victory.endings)
      assert.ok(game.allowedEndings.includes(ending));
    assert.ok((game.victory.minimumScore ?? 0) <= game.maxScore);
    for (const reward of game.rewards) {
      if (reward.kind === "coupon")
        assert.ok(coupons.some((coupon) => coupon.id === reward.targetId));
    }
  }
});

test("winning requires the configured score, progress and ending", () => {
  for (const game of vgGames) {
    const valid = {
      ending: game.victory.endings[0],
      progress: 100,
      score: game.maxScore,
    };
    assert.equal(evaluateGameResult(game, valid).won, true);
    assert.equal(
      evaluateGameResult(game, { ...valid, ending: "invented" }).won,
      false,
    );
    assert.equal(
      evaluateGameResult(game, { ...valid, progress: 0 }).won,
      false,
    );
    if (game.victory.minimumScore) {
      assert.equal(
        evaluateGameResult(game, {
          ...valid,
          score: game.victory.minimumScore - 1,
        }).won,
        false,
      );
    }
  }
});

test("secret grants are whitelisted and deduplicated independently of victory", () => {
  const game = vgGames.find((game) => game.gameId === "find-gianmaria");
  const result = evaluateGameResult(game, {
    score: 0,
    progress: 0,
    ending: "subject-escaped",
    discoveredSecrets: [
      "operation-redacted-note",
      "operation-redacted-note",
      "invented",
    ],
  });
  assert.equal(result.won, false);
  assert.deepEqual(result.discoveredSecrets, ["operation-redacted-note"]);
  assert.deepEqual(
    result.rewards.map((reward) => reward.kind),
    ["secret"],
  );
});

test("cross-game clearance only accepts each game's own persisted grants", () => {
  assert.deepEqual(
    getRecoveredGameRewards(vgGames, { version: 2, games: [] }),
    [],
  );
  const forged = {
    gameId: "great-escape",
    unlockedRewards: ["memories-master-key"],
  };
  assert.deepEqual(
    getRecoveredGameRewards(vgGames, { version: 2, games: [forged] }),
    [],
  );
  const records = vgGames.map((game) => ({
    gameId: game.gameId,
    unlockedRewards: game.rewards.map((reward) => reward.id),
  }));
  const items = new Set(
    getRecoveredGameRewards(vgGames, { version: 2, games: records })
      .filter((reward) => reward.kind === "item")
      .map((reward) => reward.targetId),
  );
  assert.ok(masterArchiveFile.requiredItemIds.every((id) => items.has(id)));
});

test("game photo slots resolve through the central media registry", () => {
  for (const slot of gameMediaPlaceholders)
    assert.equal(getMediaAsset(slot.assetId).id, slot.assetId);
});

test("minefield neighbours do not wrap rows, and flood reveal respects flags", () => {
  assert.deepEqual(minefieldNeighbours(0), [1, 8, 9]);
  assert.deepEqual(minefieldNeighbours(63), [54, 55, 62]);
  assert.equal(minefieldNeighbours(27).length, 8);
  const revealed = revealSafeArea(0, new Set([63]), new Set(), new Set([1]));
  assert.equal(revealed.has(1), false);
  assert.equal(revealed.has(63), false);
  assert.equal(revealed.size, 62);
  assert.equal(revealSafeArea(1, new Set([63]), revealed, new Set()).size, 63);
});
