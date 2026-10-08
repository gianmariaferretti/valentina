import { ARCADE } from "../../../data/arcade-config.ts";
import { arcadeMemories } from "../../../data/arcade-memories.ts";
import { seededRandom, shuffled } from "./arcade-random.ts";
const C = ARCADE.memory;
export interface MemoryCard {
  readonly memoryId: string;
  readonly instanceId: string;
  readonly variant: number;
}
export interface MemoryState {
  readonly deck: readonly MemoryCard[];
  status: "READY" | "PLAYING" | "RESOLVING_PAIR" | "WON" | "LOST";
  open: number[];
  matched: Set<number>;
  attempts: number;
  startedAt: number | null;
  elapsedMs: number;
  resolveAt: number | null;
}
export function createMemoryState(seed: number): MemoryState {
  const deck = shuffled(
    arcadeMemories.flatMap((memory) =>
      [0, 1].map((variant) => ({
        memoryId: memory.id,
        instanceId: `${memory.id}-${variant}`,
        variant,
      })),
    ),
    seededRandom(seed),
  );
  return {
    deck,
    status: "READY",
    open: [],
    matched: new Set(),
    attempts: 0,
    startedAt: null,
    elapsedMs: 0,
    resolveAt: null,
  };
}
/** Absolute monotonic time, including hidden-tab time. Outcomes freeze immediately. */
export function tickMemory(state: MemoryState, now: number) {
  if (
    state.startedAt === null ||
    state.status === "WON" ||
    state.status === "LOST"
  )
    return;
  state.elapsedMs = Math.max(0, now - state.startedAt);
  if (state.elapsedMs >= C.limitMs) {
    state.elapsedMs = C.limitMs;
    state.status = "LOST";
    return;
  }
  if (state.status === "RESOLVING_PAIR" && now >= state.resolveAt!) {
    state.open = [];
    state.resolveAt = null;
    state.status = "PLAYING";
  }
}
export function flipMemory(
  state: MemoryState,
  index: number,
  now: number,
): boolean {
  tickMemory(state, now);
  if (
    state.status === "WON" ||
    state.status === "LOST" ||
    state.status === "RESOLVING_PAIR" ||
    index < 0 ||
    index >= state.deck.length ||
    state.matched.has(index) ||
    state.open.includes(index)
  )
    return false;
  if (state.status === "READY") {
    state.startedAt = now;
    state.status = "PLAYING";
  }
  state.open.push(index);
  if (state.open.length === 2) {
    state.attempts++;
    if (state.deck[state.open[0]].memoryId === state.deck[index].memoryId) {
      state.open.forEach((i) => state.matched.add(i));
      state.open = [];
      if (state.matched.size === C.pairs * 2) state.status = "WON";
    } else {
      state.status = "RESOLVING_PAIR";
      state.resolveAt = now + C.mismatchMs;
    }
  }
  return true;
}
