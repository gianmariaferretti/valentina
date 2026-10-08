export const MINEFIELD_SIZE = 8;

export function minefieldNeighbours(index: number): number[] {
  const x = index % MINEFIELD_SIZE;
  const y = Math.floor(index / MINEFIELD_SIZE);
  const result: number[] = [];
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nextX = x + dx;
      const nextY = y + dy;
      if (
        nextX >= 0 &&
        nextX < MINEFIELD_SIZE &&
        nextY >= 0 &&
        nextY < MINEFIELD_SIZE
      ) {
        result.push(nextY * MINEFIELD_SIZE + nextX);
      }
    }
  }
  return result;
}

export function revealSafeArea(
  start: number,
  mines: ReadonlySet<number>,
  alreadyRevealed: ReadonlySet<number>,
  flags: ReadonlySet<number>,
): Set<number> {
  const revealed = new Set(alreadyRevealed);
  const queue = [start];
  while (queue.length > 0) {
    const index = queue.shift();
    if (
      index === undefined ||
      revealed.has(index) ||
      mines.has(index) ||
      flags.has(index)
    )
      continue;
    revealed.add(index);
    const neighbours = minefieldNeighbours(index);
    if (!neighbours.some((item) => mines.has(item))) queue.push(...neighbours);
  }
  return revealed;
}
