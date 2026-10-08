import { ARCADE } from "../../../data/arcade-config.ts";
import { gridDirections } from "./snake-domain.ts";
import { seededRandom, shuffled } from "./arcade-random.ts";
const C = ARCADE.maze;
export interface MazeBoard {
  readonly seed: number;
  readonly floor: ReadonlySet<number>;
  readonly start: number;
  readonly exit: number;
  readonly keys: readonly number[];
  readonly doors: readonly number[];
  readonly hazards: readonly (readonly [number, number])[];
}
export interface MazeState {
  readonly board: MazeBoard;
  position: number;
  keys: number;
  ticks: number;
  status: "ready" | "playing" | "won" | "lost";
  visited: Set<number>;
}
export function mazeStatus(state: MazeState): MazeState["status"] {
  return state.status;
}
export function mazeNeighbours(
  cell: number,
  floor: ReadonlySet<number>,
): number[] {
  const x = cell % C.size,
    y = Math.floor(cell / C.size);
  return gridDirections
    .map(([dx, dy]) => (y + dy) * C.size + x + dx)
    .filter(
      (n) =>
        floor.has(n) &&
        Math.abs((n % C.size) - x) + Math.abs(Math.floor(n / C.size) - y) === 1,
    );
}
function pathsFrom(
  start: number,
  floor: ReadonlySet<number>,
  blocked: ReadonlySet<number> = new Set(),
) {
  const parents = new Map<number, number>([[start, -1]]),
    queue = [start];
  for (let index = 0; index < queue.length; index++)
    for (const next of mazeNeighbours(queue[index], floor))
      if (!parents.has(next) && !blocked.has(next)) {
        parents.set(next, queue[index]);
        queue.push(next);
      }
  return { parents, queue };
}
function unwind(parents: ReadonlyMap<number, number>, end: number) {
  const path = [end];
  while (parents.get(path.at(-1)!) !== -1)
    path.push(parents.get(path.at(-1)!)!);
  return path.reverse();
}
/** Key-mask BFS; all possible hazard positions are blocked, so its solution is safe at ANY phase. */
export function solveMaze(board: MazeBoard): number[] | null {
  const blocked = new Set(board.hazards.flat()),
    start = board.start * 8;
  const parents = new Map<number, number>([[start, -1]]),
    queue = [start];
  for (let index = 0; index < queue.length; index++) {
    const code = queue[index],
      position = Math.floor(code / 8),
      mask = code % 8;
    if (position === board.exit && mask === 7)
      return unwind(parents, code).map((value) => Math.floor(value / 8));
    for (const next of mazeNeighbours(position, board.floor)) {
      if (blocked.has(next)) continue;
      const door = board.doors.indexOf(next);
      if (door >= 0 && !(mask & (1 << door))) continue;
      const key = board.keys.indexOf(next),
        nextMask = key >= 0 ? mask | (1 << key) : mask,
        nextCode = next * 8 + nextMask;
      if (!parents.has(nextCode)) {
        parents.set(nextCode, code);
        queue.push(nextCode);
      }
    }
  }
  return null;
}
/** Reuses the original in-house depth-first carving strategy; no external maze assets/code. */
export function generateMaze(seed: number): MazeBoard {
  const random = seededRandom(seed),
    start = C.size + 1,
    floor = new Set([start]),
    stack = [start];
  while (stack.length) {
    const current = stack.at(-1)!,
      x = current % C.size,
      y = Math.floor(current / C.size);
    const next = shuffled(gridDirections, random).find(
      ([dx, dy]) =>
        x + dx * 2 > 0 &&
        x + dx * 2 < C.size - 1 &&
        y + dy * 2 > 0 &&
        y + dy * 2 < C.size - 1 &&
        !floor.has((y + dy * 2) * C.size + x + dx * 2),
    );
    if (!next) {
      stack.pop();
      continue;
    }
    const [dx, dy] = next;
    floor.add((y + dy) * C.size + x + dx);
    const destination = (y + dy * 2) * C.size + x + dx * 2;
    floor.add(destination);
    stack.push(destination);
  }
  const { parents, queue } = pathsFrom(start, floor),
    exit = queue.at(-1)!,
    mainPath = unwind(parents, exit);
  const doors = [0.25, 0.5, 0.75].map(
    (fraction) => mainPath[Math.floor(mainPath.length * fraction)],
  );
  const keys = doors.map((_, index) => {
    const entry =
      index === 0 ? start : mainPath[mainPath.indexOf(doors[index - 1]) + 1];
    const sector = pathsFrom(entry, floor, new Set(doors)).queue;
    return sector
      .filter(
        (cell) => cell !== start && cell !== exit && !doors.includes(cell),
      )
      .at(-1)!;
  });
  const initial: MazeBoard = {
    seed,
    floor,
    start,
    exit,
    keys,
    doors,
    hazards: [],
  };
  const solution = solveMaze(initial);
  if (!solution || mainPath.length < 80)
    throw new Error("Maze failed key/door validation");
  const reserved = new Set(solution),
    hazards: [number, number][] = [];
  for (const cell of shuffled([...floor], random)) {
    if (reserved.has(cell) || hazards.flat().includes(cell)) continue;
    const other = mazeNeighbours(cell, floor).find(
      (n) => !reserved.has(n) && !hazards.flat().includes(n),
    );
    if (other !== undefined) hazards.push([cell, other]);
    if (hazards.length === 3) break;
  }
  const board = { ...initial, hazards };
  if (!solveMaze(board))
    throw new Error("Hazards blocked the playable solution");
  return board;
}
export function createMazeState(seed: number): MazeState {
  const board = generateMaze(seed);
  return {
    board,
    position: board.start,
    keys: 0,
    ticks: 0,
    status: "ready",
    visited: new Set([board.start]),
  };
}
export function mazeHazardPositions(state: MazeState): number[] {
  return state.board.hazards.map(
    (pair, index) => pair[Math.floor((state.ticks + index * 2) / 4) % 2],
  );
}
/** command 0 waits; 1..4 = up/right/down/left. Locked gates require the matching numbered key. */
export function stepMaze(state: MazeState, command: number) {
  if (state.status !== "playing") return;
  state.ticks++;
  if (state.ticks * C.stepMs >= C.limitMs) {
    state.status = "lost";
    return;
  }
  if (command >= 1 && command <= 4) {
    const [dx, dy] = gridDirections[command - 1],
      next = state.position + dy * C.size + dx;
    const door = state.board.doors.indexOf(next);
    if (
      mazeNeighbours(state.position, state.board.floor).includes(next) &&
      (door < 0 || state.keys & (1 << door))
    )
      state.position = next;
  }
  if (mazeHazardPositions(state).includes(state.position)) {
    state.status = "lost";
    return;
  }
  const key = state.board.keys.indexOf(state.position);
  if (key >= 0) state.keys |= 1 << key;
  state.visited.add(state.position);
  if (state.position === state.board.exit && state.keys === 7)
    state.status = "won";
}
