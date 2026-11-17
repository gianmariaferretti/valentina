import "server-only";

import { createInitialState } from "../lib/engine";
import { CasinoConflictError, getCasinoRepository } from "./casino-repository";

/**
 * Adds 💋 to the casino balance from outside the casino (bucket list ticks,
 * and later the rest of the site). Retries if Valentina is playing.
 */
export async function creditKisses(amount: number): Promise<number> {
  if (!Number.isInteger(amount) || amount < 1 || amount > 100_000)
    throw new Error("Invalid kiss credit.");
  const repository = getCasinoRepository();
  for (let attempt = 0; attempt < 3; attempt++) {
    const stored = await repository.load();
    const state = structuredClone(stored?.state ?? createInitialState());
    state.balance += amount;
    try {
      await repository.commit(stored?.version ?? 0, state, [], []);
      return state.balance;
    } catch (error) {
      if (error instanceof CasinoConflictError) continue;
      throw error;
    }
  }
  throw new Error("The casino kept changing while crediting kisses.");
}
