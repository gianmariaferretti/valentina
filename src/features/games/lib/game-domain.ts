import type {
  GameProgressState,
  GameRunResult,
  VgGameDefinition,
} from "@/features/games/types";

/** Only configured outcomes and secrets can trigger a reward. */
export function evaluateGameResult(
  game: VgGameDefinition,
  result: GameRunResult,
) {
  const won =
    game.victory.endings.includes(result.ending) &&
    result.progress >= game.victory.minimumProgress &&
    result.score >= (game.victory.minimumScore ?? 0);
  const permittedSecrets = new Set(
    game.rewards.flatMap((reward) =>
      reward.trigger === "secret" && reward.secretId ? [reward.secretId] : [],
    ),
  );
  const discoveredSecrets = [...new Set(result.discoveredSecrets ?? [])].filter(
    (id) => permittedSecrets.has(id),
  );
  const rewards = game.rewards.filter((reward) => {
    if (reward.trigger === "completion") return true;
    if (reward.trigger === "victory") return won;
    return Boolean(
      reward.secretId && discoveredSecrets.includes(reward.secretId),
    );
  });
  return { won, discoveredSecrets, rewards };
}

/** Inventory is derived from durable grants, never client-side game state. */
export function getRecoveredGameRewards(
  games: readonly VgGameDefinition[],
  state: GameProgressState,
) {
  const records = new Map(state.games.map((record) => [record.gameId, record]));
  return games.flatMap((game) =>
    game.rewards.filter((reward) =>
      records.get(game.gameId)?.unlockedRewards.includes(reward.id),
    ),
  );
}
