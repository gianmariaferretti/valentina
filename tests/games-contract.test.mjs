import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { vgGames, retiredGameSlugs } from "../src/data/games.ts";
import { coupons } from "../src/data/coupons.ts";
import { masterArchiveFile } from "../src/data/game-secrets.ts";
import {
  evaluateGameResult,
  getRecoveredGameRewards,
} from "../src/features/games/lib/game-domain.ts";
test("Exactly five registered games, fixed rules, correct order and valid coupon references", () => {
  assert.deepEqual(
    vgGames.map((game) => game.gameId),
    [
      "break-defences",
      "relationship-minefield",
      "365-memories",
      "snake",
      "maze",
    ],
  );
  assert.equal(
    new Set(vgGames.flatMap((game) => game.rewards.map((reward) => reward.id)))
      .size,
    vgGames.flatMap((game) => game.rewards).length,
  );
  for (const game of vgGames) {
    assert.equal(game.difficulty, "standard");
    assert.equal(retiredGameSlugs.includes(game.slug), false);
    game.victory.endings.forEach((ending) =>
      assert.ok(game.allowedEndings.includes(ending)),
    );
    game.rewards
      .filter((r) => r.kind === "coupon")
      .forEach((reward) =>
        assert.ok(coupons.some((c) => c.id === reward.targetId)),
      );
  }
});
test("Arcade CSS references only existing V&G design tokens", () => {
  const globals = readFileSync(
    new URL("../src/app/globals.css", import.meta.url),
    "utf8",
  );
  const defined = new Set(
    [...globals.matchAll(/(--[\w-]+)\s*:/g)].map((match) => match[1]),
  );
  for (const file of [
    "components/games.module.css",
    "engines/classic-arcade.module.css",
  ]) {
    const css = readFileSync(
      new URL("../src/features/games/" + file, import.meta.url),
      "utf8",
    );
    for (const match of css.matchAll(/var\((--[\w-]+)/g))
      assert.ok(
        defined.has(match[1]),
        `Undefined design token ${match[1]} in ${file}`,
      );
  }
});
test("Reward evaluation requires configured progress, score and ending; grants unlock, never redeem", () => {
  for (const game of vgGames) {
    const result = {
      score: game.maxScore,
      progress: 100,
      ending: game.victory.endings[0],
    };
    assert.ok(evaluateGameResult(game, result).won);
    assert.equal(
      evaluateGameResult(game, { ...result, ending: "invented" }).won,
      false,
    );
    assert.equal(
      evaluateGameResult(game, { ...result, progress: 99 }).won,
      false,
    );
    assert.equal(
      evaluateGameResult(game, { ...result, discoveredSecrets: ["invented"] })
        .discoveredSecrets.length,
      0,
    );
  }
});
test("Retired game records cannot influence active inventory and all remaining master keys are obtainable", () => {
  assert.deepEqual(
    getRecoveredGameRewards(vgGames, {
      version: 2,
      games: [
        { gameId: "great-escape", unlockedRewards: ["memories-master-key"] },
      ],
    }),
    [],
  );
  const records = vgGames.map((game) => ({
    gameId: game.gameId,
    unlockedRewards: game.rewards.map((r) => r.id),
  }));
  const items = new Set(
    getRecoveredGameRewards(vgGames, { version: 2, games: records })
      .filter((r) => r.kind === "item")
      .map((r) => r.targetId),
  );
  assert.ok(masterArchiveFile.requiredItemIds.every((id) => items.has(id)));
  assert.equal(masterArchiveFile.requiredItemIds.length, 2);
});
