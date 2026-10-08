import { ARCADE } from "../../../data/arcade-config.ts";
import { seededRandom, shuffled } from "./arcade-random.ts";
const C = ARCADE.mines;
export const MINE_CELLS = C.columns * C.rows;
export interface MineBoard {
  readonly mines: ReadonlySet<number>;
  readonly counts: readonly number[];
  readonly verified: boolean;
  readonly first: number;
}
export interface MineState {
  board: MineBoard | null;
  revealed: Set<number>;
  flags: Set<number>;
  status: "ready" | "playing" | "won" | "lost";
  elapsedMs: number;
  detonated: number | null;
}
export function mineStatus(state: MineState): MineState["status"] {
  return state.status;
}
export function mineNeighbours(index: number): number[] {
  const x = index % C.columns,
    y = Math.floor(index / C.columns),
    result: number[] = [];
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      if (
        (!dx && !dy) ||
        x + dx < 0 ||
        x + dx >= C.columns ||
        y + dy < 0 ||
        y + dy >= C.rows
      )
        continue;
      result.push((y + dy) * C.columns + x + dx);
    }
  return result;
}
export function createMineState(): MineState {
  return {
    board: null,
    revealed: new Set(),
    flags: new Set(),
    status: "ready",
    elapsedMs: 0,
    detonated: null,
  };
}
export function tickMineClock(
  state: MineState,
  startedAt: number,
  now: number,
) {
  if (state.status === "playing")
    state.elapsedMs = Math.max(0, Math.floor(now - startedAt));
}
export function floodMineCells(
  board: MineBoard,
  revealed: Set<number>,
  flags: ReadonlySet<number>,
  index: number,
) {
  const queue = [index];
  while (queue.length) {
    const cell = queue.pop()!;
    if (revealed.has(cell) || flags.has(cell) || board.mines.has(cell))
      continue;
    revealed.add(cell);
    if (board.counts[cell] === 0) queue.push(...mineNeighbours(cell));
  }
}
/** Revealed numbers only: direct deductions plus subset differences; never peeks at unknown mines. */
export function solveMineBoard(board: MineBoard): boolean {
  const revealed = new Set<number>(),
    flags = new Set<number>();
  floodMineCells(board, revealed, flags, board.first);
  for (let round = 0; round < MINE_CELLS; round++) {
    if (revealed.size === MINE_CELLS - C.count) return true;
    const before = revealed.size + flags.size;
    const constraints: { cells: number[]; count: number }[] = [];
    for (const cell of revealed) {
      const neighbours = mineNeighbours(cell),
        unknown = neighbours.filter((n) => !revealed.has(n) && !flags.has(n));
      if (unknown.length)
        constraints.push({
          cells: unknown,
          count:
            board.counts[cell] - neighbours.filter((n) => flags.has(n)).length,
        });
    }
    function apply(cells: number[], count: number) {
      if (count === 0)
        for (const cell of cells) floodMineCells(board, revealed, flags, cell);
      else if (count === cells.length)
        for (const cell of cells) flags.add(cell);
    }
    for (const constraint of constraints)
      apply(constraint.cells, constraint.count);
    if (before !== revealed.size + flags.size) continue;
    for (const a of constraints)
      for (const b of constraints) {
        if (
          a.cells.length >= b.cells.length ||
          !a.cells.every((cell) => b.cells.includes(cell))
        )
          continue;
        apply(
          b.cells.filter((cell) => !a.cells.includes(cell)),
          b.count - a.count,
        );
      }
    if (before === revealed.size + flags.size) return false;
  }
  return false;
}
export function generateMineBoard(seed: number, first: number): MineBoard {
  if (!Number.isInteger(first) || first < 0 || first >= MINE_CELLS)
    throw new Error("Invalid first reveal");
  const excluded = new Set([first, ...mineNeighbours(first)]),
    random = seededRandom(seed);
  const candidates = Array.from({ length: MINE_CELLS }, (_, i) => i).filter(
    (i) => !excluded.has(i),
  );
  let fallback: MineBoard | null = null;
  for (let attempt = 0; attempt < C.generationBudget; attempt++) {
    const mines = new Set(shuffled(candidates, random).slice(0, C.count));
    const board: MineBoard = {
      mines,
      counts: Array.from(
        { length: MINE_CELLS },
        (_, i) => mineNeighbours(i).filter((n) => mines.has(n)).length,
      ),
      first,
      verified: false,
    };
    fallback ??= board;
    if (solveMineBoard(board)) return { ...board, verified: true };
  }
  return fallback!; // Safe opening, but explicitly labelled as possibly requiring guesses.
}
/** action: 0 reveal, 1 flag, 2 chord. Flagging never counts as revealing. */
export function actMine(state: MineState, index: number, action: number) {
  if (
    !state.board ||
    state.status === "won" ||
    state.status === "lost" ||
    index < 0 ||
    index >= MINE_CELLS
  )
    return;
  if (action === 1) {
    if (!state.revealed.has(index)) {
      if (state.flags.has(index)) state.flags.delete(index);
      else if (state.flags.size < C.count) state.flags.add(index);
    }
    return;
  }
  const reveal = (cell: number) => {
    if (
      state.flags.has(cell) ||
      state.revealed.has(cell) ||
      state.status === "lost"
    )
      return;
    if (state.board!.mines.has(cell)) {
      state.status = "lost";
      state.detonated = cell;
      state.revealed.add(cell);
    } else floodMineCells(state.board!, state.revealed, state.flags, cell);
  };
  if (action === 2 || state.revealed.has(index)) {
    if (!state.revealed.has(index) || !state.board.counts[index]) return;
    const neighbours = mineNeighbours(index);
    if (
      neighbours.filter((n) => state.flags.has(n)).length ===
      state.board.counts[index]
    )
      neighbours.forEach(reveal);
  } else reveal(index);
  if (state.detonated === null && state.revealed.size === MINE_CELLS - C.count)
    state.status = "won";
}
