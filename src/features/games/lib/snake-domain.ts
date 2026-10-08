import { ARCADE } from "../../../data/arcade-config.ts";
import { seededRandom } from "./arcade-random.ts";
const C = ARCADE.snake;
export const gridDirections = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;
export interface SnakeState {
  body: number[];
  direction: number;
  queued: number;
  food: number;
  score: number;
  status: "ready" | "playing" | "won" | "lost";
  elapsedMs: number;
  random: () => number;
}
export function snakeStatus(state: SnakeState): SnakeState["status"] {
  return state.status;
}
export function spawnSnakeFood(
  body: readonly number[],
  random: () => number,
): number {
  const available = Array.from({ length: C.size ** 2 }, (_, i) => i).filter(
    (i) => !body.includes(i),
  );
  return available.length
    ? available[Math.floor(random() * available.length)]
    : -1;
}
export function snakeStepMs(score: number): number {
  return Math.max(C.minimumStepMs, C.initialStepMs - score * C.speedPerFoodMs);
}
export function createSnakeState(seed: number): SnakeState {
  const random = seededRandom(seed),
    body = [9 * C.size + 7, 9 * C.size + 6, 9 * C.size + 5];
  return {
    body,
    direction: 1,
    queued: 1,
    food: spawnSnakeFood(body, random),
    score: 0,
    status: "ready",
    elapsedMs: 0,
    random,
  };
}
export function queueSnakeDirection(state: SnakeState, direction: number) {
  if (
    direction >= 0 &&
    direction < 4 &&
    (state.direction + 2) % 4 !== direction
  )
    state.queued = direction;
}
export function stepSnake(state: SnakeState) {
  if (state.status !== "playing") return;
  state.elapsedMs += snakeStepMs(state.score);
  state.direction = state.queued;
  const [dx, dy] = gridDirections[state.direction],
    x = (state.body[0] % C.size) + dx,
    y = Math.floor(state.body[0] / C.size) + dy,
    next = y * C.size + x;
  const eating = next === state.food,
    occupied = eating ? state.body : state.body.slice(0, -1);
  if (x < 0 || y < 0 || x >= C.size || y >= C.size || occupied.includes(next)) {
    state.status = "lost";
    return;
  }
  state.body.unshift(next);
  if (eating) {
    state.score++;
    state.food = spawnSnakeFood(state.body, state.random);
    if (state.score >= C.target) state.status = "won";
  } else state.body.pop();
}
