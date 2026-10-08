import { ARCADE } from "../../../data/arcade-config.ts";
import { paddleY, type DefenceState } from "./arcade-domain.ts";
export function drawDefence(
  context: CanvasRenderingContext2D,
  state: DefenceState,
  reduced: boolean,
) {
  const C = ARCADE.breakout;
  context.fillStyle = "#f8f4ed";
  context.fillRect(0, 0, C.width, C.height);
  context.strokeStyle = "#e5ddd1";
  context.lineWidth = 1;
  for (let y = 22; y < C.height; y += 27) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(C.width, y);
    context.stroke();
  }
  for (const brick of state.bricks) {
    if (!brick.hp) continue;
    context.fillStyle =
      !reduced && state.elapsed - brick.hitAt < 0.08
        ? "#bd7e6b"
        : brick.maxHp === 3
          ? "#502b32"
          : brick.maxHp === 2
            ? "#8d4a42"
            : "#ae7656";
    context.beginPath();
    context.roundRect(brick.x, brick.y, brick.width, brick.height, 3);
    context.fill();
    context.fillStyle = "#f8f4ed";
    for (let mark = 0; mark < brick.hp; mark++)
      context.fillRect(
        brick.x + brick.width / 2 - brick.hp * 3 + mark * 6,
        brick.y + 8,
        3,
        3,
      );
  }
  context.fillStyle = "#252322";
  context.beginPath();
  context.roundRect(
    state.paddleX - C.paddleWidth / 2,
    paddleY,
    C.paddleWidth,
    10,
    5,
  );
  context.fill();
  context.fillStyle = "#743441";
  context.beginPath();
  context.arc(state.ball.x, state.ball.y, state.ball.radius, 0, Math.PI * 2);
  context.fill();
  if (!reduced)
    for (const particle of state.particles) {
      context.globalAlpha = particle.life / 0.3;
      context.fillRect(particle.x, particle.y, 2, 2);
    }
  context.globalAlpha = 1;
}
