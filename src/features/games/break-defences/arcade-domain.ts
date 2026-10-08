import { ARCADE } from "../../../data/arcade-config.ts";
import type { GameRunResult } from "../types.ts";
const C = ARCADE.breakout;
export const paddleY = C.height - 44;
export interface DefenceBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}
export interface DefenceBrick {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  hitAt: number;
}
export interface DefenceParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}
export interface DefenceState {
  mode: "serve" | "playing" | "victory" | "lost";
  elapsed: number;
  score: number;
  lives: number;
  hits: number;
  paddleX: number;
  ball: DefenceBall;
  bricks: DefenceBrick[];
  particles: DefenceParticle[];
  impact: boolean;
}
export function createDefenceBricks(): DefenceBrick[] {
  return Array.from({ length: C.columns * C.rows }, (_, id) => {
    const row = Math.floor(id / C.columns),
      column = id % C.columns;
    const hp = row < 2 ? 3 : row < 5 ? 2 : 1;
    return {
      id,
      x: 12 + column * 40,
      y: 42 + row * 27,
      width: 36,
      height: 20,
      hp,
      maxHp: hp,
      hitAt: -10,
    };
  });
}
export function createDefenceState(): DefenceState {
  return {
    mode: "serve",
    elapsed: 0,
    score: 0,
    lives: C.lives,
    hits: 0,
    paddleX: C.width / 2,
    ball: {
      x: C.width / 2,
      y: paddleY - 10,
      vx: 95,
      vy: -Math.sqrt(C.startSpeed ** 2 - 95 ** 2),
      radius: 6,
    },
    bricks: createDefenceBricks(),
    particles: [],
    impact: false,
  };
}
export function setDefencePaddle(state: DefenceState, x: number) {
  state.paddleX = Math.max(
    C.paddleWidth / 2,
    Math.min(C.width - C.paddleWidth / 2, x),
  );
}
export function launchDefenceBall(state: DefenceState) {
  if (state.mode === "serve") state.mode = "playing";
}
export function defenceProgress(state: DefenceState) {
  return state.mode === "victory"
    ? 100
    : Math.min(
        99,
        Math.floor((state.bricks.filter((b) => b.hp === 0).length / 80) * 100),
      );
}
export function defenceResult(state: DefenceState): GameRunResult {
  return {
    score: state.score,
    progress: defenceProgress(state),
    ending: state.mode === "victory" ? "defences-breached" : "file-resealed",
    durationMs: Math.round(state.elapsed * 1000),
  };
}
/** Minimum vertical and horizontal velocity prevents permanent axis-aligned traps. */
function speedBall(state: DefenceState) {
  const ball = state.ball,
    speed = Math.min(C.maxSpeed, C.startSpeed + state.hits * C.speedPerHit);
  const norm = Math.hypot(ball.vx, ball.vy);
  ball.vx = (ball.vx / norm) * speed;
  ball.vy = (ball.vy / norm) * speed;
  if (Math.abs(ball.vy) < speed * 0.3) {
    ball.vy = Math.sign(ball.vy || -1) * speed * 0.3;
    ball.vx = Math.sign(ball.vx || 1) * Math.sqrt(speed ** 2 - ball.vy ** 2);
  }
  if (Math.abs(ball.vx) < 22) {
    ball.vx = Math.sign(ball.vx || 1) * 22;
    ball.vy = Math.sign(ball.vy || -1) * Math.sqrt(speed ** 2 - 22 ** 2);
  }
}
/** Circle/AABB contact with depenetration. Max displacement is 3.67px vs 20px bricks. */
export function collideDefenceBrick(
  ball: DefenceBall,
  brick: DefenceBrick,
): boolean {
  const x = Math.max(brick.x, Math.min(ball.x, brick.x + brick.width));
  const y = Math.max(brick.y, Math.min(ball.y, brick.y + brick.height));
  let dx = ball.x - x,
    dy = ball.y - y;
  const distance = Math.hypot(dx, dy);
  if (distance >= ball.radius) return false;
  if (distance === 0) {
    const edges = [
      ball.x - brick.x,
      brick.x + brick.width - ball.x,
      ball.y - brick.y,
      brick.y + brick.height - ball.y,
    ];
    const edge = edges.indexOf(Math.min(...edges));
    dx = edge === 0 ? -1 : edge === 1 ? 1 : 0;
    dy = edge === 2 ? -1 : edge === 3 ? 1 : 0;
    if (dx)
      ball.x =
        dx < 0 ? brick.x - ball.radius : brick.x + brick.width + ball.radius;
    if (dy)
      ball.y =
        dy < 0 ? brick.y - ball.radius : brick.y + brick.height + ball.radius;
  } else {
    dx /= distance;
    dy /= distance;
    ball.x += dx * (ball.radius - distance + 0.01);
    ball.y += dy * (ball.radius - distance + 0.01);
  }
  const dot = ball.vx * dx + ball.vy * dy;
  if (dot < 0) {
    ball.vx -= 2 * dot * dx;
    ball.vy -= 2 * dot * dy;
  }
  return true;
}
export function stepDefence(
  state: DefenceState,
  targetX: number,
  launch: boolean,
  reduced = false,
) {
  state.impact = false;
  if (state.mode === "victory" || state.mode === "lost") return;
  setDefencePaddle(state, targetX);
  if (state.mode === "serve") {
    state.ball.x = state.paddleX;
    state.ball.y = paddleY - 10;
    if (launch) launchDefenceBall(state);
    else return;
  }
  state.elapsed += C.step;
  const ball = state.ball,
    previousY = ball.y;
  ball.x += ball.vx * C.step;
  ball.y += ball.vy * C.step;
  if (ball.x < ball.radius) {
    ball.x = ball.radius;
    ball.vx = Math.abs(ball.vx);
  }
  if (ball.x > C.width - ball.radius) {
    ball.x = C.width - ball.radius;
    ball.vx = -Math.abs(ball.vx);
  }
  if (ball.y < ball.radius) {
    ball.y = ball.radius;
    ball.vy = Math.abs(ball.vy);
  }
  if (
    ball.vy > 0 &&
    previousY + ball.radius <= paddleY &&
    ball.y + ball.radius >= paddleY &&
    Math.abs(ball.x - state.paddleX) <= C.paddleWidth / 2 + ball.radius
  ) {
    const offset = Math.max(
      -1,
      Math.min(1, (ball.x - state.paddleX) / (C.paddleWidth / 2)),
    );
    const speed = Math.min(
      C.maxSpeed,
      C.startSpeed + state.hits * C.speedPerHit,
    );
    ball.vx = Math.sin(offset * 1.05) * speed;
    ball.vy = -Math.cos(offset * 1.05) * speed;
    ball.y = paddleY - ball.radius - 0.01;
    speedBall(state);
    state.impact = true;
  }
  for (const brick of state.bricks) {
    if (!brick.hp || !collideDefenceBrick(ball, brick)) continue;
    brick.hp--;
    brick.hitAt = state.elapsed;
    state.hits++;
    state.score += brick.hp === 0 ? 100 * brick.maxHp : 20;
    speedBall(state);
    state.impact = true;
    if (!reduced && brick.hp === 0)
      for (let i = 0; i < 4 && state.particles.length < 24; i++)
        state.particles.push({
          x: ball.x,
          y: ball.y,
          vx: Math.cos(i * 1.57) * 40,
          vy: Math.sin(i * 1.57) * 40,
          life: 0.3,
        });
    break;
  }
  if (state.bricks.every((brick) => brick.hp === 0)) {
    state.mode = "victory";
    return;
  }
  if (ball.y - ball.radius > C.height) {
    state.lives--;
    state.mode = state.lives ? "serve" : "lost";
    const speed = Math.min(
      C.maxSpeed,
      C.startSpeed + state.hits * C.speedPerHit,
    );
    ball.vx = 95;
    ball.vy = -Math.sqrt(speed ** 2 - 95 ** 2);
  }
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life -= C.step;
    p.x += p.vx * C.step;
    p.y += p.vy * C.step;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
}
