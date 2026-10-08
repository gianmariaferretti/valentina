import { ARCADE } from "../../../data/arcade-config.ts";
import {
  createDefenceState,
  defenceResult,
  stepDefence,
} from "../break-defences/arcade-domain.ts";
import type { GameEvidence, GameRunResult } from "../types.ts";
import {
  actMine,
  createMineState,
  generateMineBoard,
  mineStatus,
} from "./classic-minefield.ts";
import { createMemoryState, flipMemory, tickMemory } from "./memory-domain.ts";
import {
  createSnakeState,
  queueSnakeDirection,
  snakeStatus,
  stepSnake,
} from "./snake-domain.ts";
import { createMazeState, mazeStatus, stepMaze } from "./maze-domain.ts";
/** Verify the actual rules from a bounded input transcript, not a client win/score claim.
 * This proves a valid simulation, NOT human input, real wall-clock time or resistance to automation.
 */
export function verifyArcadeResult(
  gameId: string,
  evidence: GameEvidence | undefined,
  durationMs: number,
): GameRunResult {
  if (
    !evidence ||
    !Number.isInteger(evidence.seed) ||
    evidence.seed < 0 ||
    evidence.seed > 0xffffffff ||
    !Array.isArray(evidence.inputs) ||
    evidence.inputs.length === 0 ||
    evidence.inputs.length > 180_000 ||
    evidence.inputs.some((input) => !Number.isInteger(input))
  )
    throw new Error("Invalid input transcript");
  const { seed, inputs } = evidence;
  const resultEvidence = { evidence, discoveredSecrets: [] };
  if (gameId === "break-defences") {
    const state = createDefenceState();
    for (const input of inputs) {
      if (
        input < 0 ||
        input > 142_000 ||
        state.mode === "lost" ||
        state.mode === "victory"
      )
        throw new Error("Invalid paddle input");
      stepDefence(state, (input % 100000) / 100, input >= 100000, true);
    }
    if (state.mode !== "lost" && state.mode !== "victory")
      throw new Error("Unfinished wall");
    return { ...defenceResult(state), ...resultEvidence };
  }
  if (gameId === "relationship-minefield") {
    if (
      inputs.length > 8192 ||
      inputs[0] < 0 ||
      inputs[0] > 767 ||
      inputs[0] % 3 !== 0
    )
      throw new Error("Invalid minefield opening");
    const state = createMineState();
    state.board = generateMineBoard(seed, inputs[0] / 3);
    state.status = "playing";
    for (const input of inputs) {
      if (
        input < 0 ||
        input > 767 ||
        mineStatus(state) === "won" ||
        mineStatus(state) === "lost"
      )
        throw new Error("Invalid minefield input");
      actMine(state, Math.floor(input / 3), input % 3);
    }
    if (mineStatus(state) !== "won" && mineStatus(state) !== "lost")
      throw new Error("Unfinished minefield");
    const score = state.revealed.size - (state.detonated !== null ? 1 : 0);
    return {
      score,
      progress:
        mineStatus(state) === "won"
          ? 100
          : Math.min(99, Math.floor((score / 201) * 100)),
      ending: mineStatus(state) === "won" ? "field-cleared" : "mine-detonated",
      durationMs: Math.max(1, durationMs),
      ...resultEvidence,
    };
  }
  if (gameId === "365-memories") {
    const times = evidence.times;
    if (
      !Array.isArray(times) ||
      times.length !== inputs.length ||
      inputs.length > 2048 ||
      times[0] !== 0 ||
      times.some(
        (time, i) =>
          !Number.isInteger(time) ||
          time < 0 ||
          time >= ARCADE.memory.limitMs ||
          (i > 0 && time < times[i - 1]),
      )
    )
      throw new Error("Invalid memory clock");
    const state = createMemoryState(seed);
    inputs.forEach((input, i) => {
      if (!flipMemory(state, input, times[i]))
        throw new Error("Invalid card flip");
    });
    if (state.status !== "WON") tickMemory(state, ARCADE.memory.limitMs);
    return {
      score: (state.matched.size / 2) * 100,
      progress:
        state.status === "WON"
          ? 100
          : Math.min(99, Math.floor((state.matched.size / 36) * 100)),
      ending: state.status === "WON" ? "archive-complete" : "archive-timed-out",
      durationMs: state.elapsedMs,
      moves: state.attempts,
      ...resultEvidence,
    };
  }
  if (gameId === "snake") {
    if (inputs.length > 30_000) throw new Error("Snake transcript too long");
    const state = createSnakeState(seed);
    state.status = "playing";
    for (const input of inputs) {
      if (input < 0 || input > 3 || state.status !== "playing")
        throw new Error("Invalid Snake input");
      queueSnakeDirection(state, input);
      stepSnake(state);
    }
    if (snakeStatus(state) !== "won" && snakeStatus(state) !== "lost")
      throw new Error("Unfinished Snake run");
    return {
      score: state.score * 10,
      progress:
        snakeStatus(state) === "won" ? 100 : Math.min(99, state.score * 2),
      ending:
        snakeStatus(state) === "won" ? "snake-complete" : "snake-collision",
      durationMs: state.elapsedMs,
      ...resultEvidence,
    };
  }
  if (gameId === "maze") {
    if (inputs.length > ARCADE.maze.limitMs / ARCADE.maze.stepMs)
      throw new Error("Maze clock exceeded");
    const state = createMazeState(seed);
    state.status = "playing";
    for (const input of inputs) {
      if (input < 0 || input > 4 || state.status !== "playing")
        throw new Error("Invalid Maze input");
      stepMaze(state, input);
    }
    if (mazeStatus(state) !== "won" && mazeStatus(state) !== "lost")
      throw new Error("Unfinished Maze run");
    return {
      score:
        mazeStatus(state) === "won"
          ? 1800
          : Math.round((state.visited.size / state.board.floor.size) * 1000),
      progress:
        mazeStatus(state) === "won"
          ? 100
          : Math.min(
              99,
              Math.floor((state.visited.size / state.board.floor.size) * 100),
            ),
      ending: mazeStatus(state) === "won" ? "maze-escaped" : "maze-lost",
      durationMs: state.ticks * ARCADE.maze.stepMs,
      ...resultEvidence,
    };
  }
  throw new Error("Unregistered game");
}
