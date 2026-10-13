import { ARCADE } from "../../../data/arcade-config.ts";
import { seededRandom, shuffled } from "./arcade-random.ts";
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
  ticks: number;
  staticObstacles: Set<number>;
  obstacleCandidates: number[];
  movingObstacles: { pair: readonly [number, number]; position: number }[];
}
/** A reserved closed corridor proves reachability at every length up to 75 foods.
 * Hazards occupy only its shortcuts. No generated board can force a collision.
 * Food uses this connected corridor, never an isolated pocket behind obstacles.
 */
export function snakeSafeCycle(): number[] {
  const cycle: number[] = [];
  for (let x = 1; x <= C.size - 2; x++) cycle.push(C.size + x);
  for (let y = 2; y <= C.size - 2; y++) cycle.push(y * C.size + C.size - 2);
  for (let x = C.size - 3; x >= 3; x -= 2) {
    const up = ((C.size - 3 - x) / 2) % 2 === 0;
    const edge = up ? C.size - 2 : 2;
    cycle.push(edge * C.size + x);
    if (up) for (let y = C.size - 3; y >= 2; y--) cycle.push(y * C.size + x);
    else for (let y = 3; y <= C.size - 2; y++) cycle.push(y * C.size + x);
    if (x > 3) cycle.push((up ? 2 : C.size - 2) * C.size + x - 1);
  }
  // Last lane ends at row 22 on an even-sized board.
  cycle.push((C.size - 2) * C.size + 2);
  for (let y = C.size - 2; y >= 2; y--) cycle.push(y * C.size + 1);
  return cycle;
}
export function snakeObstacles(state: SnakeState): Set<number> {
  return new Set([
    ...state.staticObstacles,
    ...state.movingObstacles.map((o) => o.position),
  ]);
}
export function snakeStatus(state: SnakeState): SnakeState["status"] {
  return state.status;
}
export function spawnSnakeFood(
  body: readonly number[],
  random: () => number,
): number {
  const available = snakeSafeCycle().filter((i) => !body.includes(i));
  return available.length
    ? available[Math.floor(random() * available.length)]
    : -1;
}
export function snakeStepMs(score: number): number {
  return Math.max(C.minimumStepMs, C.initialStepMs - score * C.speedPerFoodMs);
}
export function createSnakeState(seed: number): SnakeState {
  const random = seededRandom(seed),
    cycle = snakeSafeCycle(),
    body = [cycle[2], cycle[1], cycle[0]],
    reserved = new Set(cycle),
    obstacleCandidates = shuffled(
      Array.from({ length: C.size ** 2 }, (_, i) => i).filter(
        (i) => !reserved.has(i),
      ),
      random,
    ),
    pairs: [number, number][] = [];
  for (const cell of obstacleCandidates) {
    const other = cell + C.size;
    if (
      other >= C.size ** 2 ||
      reserved.has(other) ||
      pairs.flat().includes(cell) ||
      pairs.flat().includes(other)
    )
      continue;
    pairs.push([cell, other]);
    if (pairs.length === 4) break;
  }
  const candidates = obstacleCandidates.filter(
    (i) => !pairs.flat().includes(i),
  );
  return {
    body,
    direction: 1,
    queued: 1,
    food: spawnSnakeFood(body, random),
    score: 0,
    status: "ready",
    elapsedMs: 0,
    random,
    ticks: 0,
    staticObstacles: new Set(candidates.slice(0, 32)),
    obstacleCandidates: candidates,
    movingObstacles: pairs.map((pair) => ({ pair, position: pair[0] })),
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
  state.ticks++;
  const head = state.body[0];
  const nearHead = (cell: number) =>
    Math.abs((cell % C.size) - (head % C.size)) +
      Math.abs(Math.floor(cell / C.size) - Math.floor(head / C.size)) <=
    2;
  // New blocks cannot appear underneath/next to a player or on food. Candidates
  // skipped while occupied are reconsidered after the player safely moves away.
  for (const cell of state.obstacleCandidates.slice(
    0,
    32 + Math.floor(state.score / 15) * 12,
  ))
    if (!state.body.includes(cell) && cell !== state.food && !nearHead(cell))
      state.staticObstacles.add(cell);
  for (const [index, obstacle] of state.movingObstacles.entries()) {
    const nextPosition =
      obstacle.pair[Math.floor((state.ticks + index * 3) / 6) % 2];
    if (
      !state.body.includes(nextPosition) &&
      !nearHead(nextPosition) &&
      nextPosition !== state.food
    )
      obstacle.position = nextPosition;
  }
  state.elapsedMs += snakeStepMs(state.score);
  state.direction = state.queued;
  const [dx, dy] = gridDirections[state.direction],
    x = (state.body[0] % C.size) + dx,
    y = Math.floor(state.body[0] / C.size) + dy,
    next = y * C.size + x;
  const eating = next === state.food,
    occupied = eating ? state.body : state.body.slice(0, -1);
  if (
    x < 0 ||
    y < 0 ||
    x >= C.size ||
    y >= C.size ||
    occupied.includes(next) ||
    snakeObstacles(state).has(next)
  ) {
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
