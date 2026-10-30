/** Fixed rules. There are deliberately no difficulty variants or assistance modes. */
export const ARCADE = {
  breakout: {
    width: 420,
    height: 560,
    columns: 10,
    rows: 9,
    lives: 3,
    paddleWidth: 58,
    startSpeed: 285,
    maxSpeed: 440,
    speedPerHit: 1.3,
    step: 1 / 120,
  },
  mines: { columns: 16, rows: 16, count: 55, generationBudget: 16 },
  memory: { columns: 6, pairs: 18, limitMs: 165_000, mismatchMs: 650 },
  snake: {
    size: 24,
    target: 75,
    initialStepMs: 155,
    minimumStepMs: 65,
    speedPerFoodMs: 2,
  },
  maze: {
    size: 45,
    keys: 5,
    viewSize: 15,
    radius: 4,
    stepMs: 160,
    limitMs: 300_000,
  },
} as const;
