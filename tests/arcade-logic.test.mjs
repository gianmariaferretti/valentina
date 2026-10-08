import assert from "node:assert/strict";
import test from "node:test";
import { ARCADE } from "../src/data/arcade-config.ts";
import { arcadeMemories } from "../src/data/arcade-memories.ts";
import {
  createDefenceState,
  stepDefence,
  collideDefenceBrick,
  paddleY,
} from "../src/features/games/break-defences/arcade-domain.ts";
import {
  actMine,
  createMineState,
  generateMineBoard,
  floodMineCells,
  mineNeighbours,
  solveMineBoard,
  tickMineClock,
} from "../src/features/games/lib/classic-minefield.ts";
import {
  createMemoryState,
  flipMemory,
  tickMemory,
} from "../src/features/games/lib/memory-domain.ts";
import {
  createSnakeState,
  spawnSnakeFood,
  queueSnakeDirection,
  stepSnake,
  snakeStepMs,
} from "../src/features/games/lib/snake-domain.ts";
import {
  createMazeState,
  generateMaze,
  mazeNeighbours,
  solveMaze,
  stepMaze,
} from "../src/features/games/lib/maze-domain.ts";
import { verifyArcadeResult } from "../src/features/games/lib/verify-arcade-result.ts";

function hitBrick(state, brick) {
  state.mode = "playing";
  Object.assign(state.ball, {
    x: brick.x + brick.width / 2,
    y: brick.y + brick.height + 6.1,
    vx: 0,
    vy: -285,
  });
  stepDefence(state, 210, false, true);
}
test("Breakout: exactly 80 bricks, three durability classes, three lives, one level", () => {
  const state = createDefenceState();
  assert.equal(state.bricks.length, 80);
  assert.equal(state.lives, 3);
  assert.deepEqual(new Set(state.bricks.map((b) => b.hp)), new Set([1, 2, 3]));
  assert.equal("boss" in state, false);
  assert.equal("drops" in state, false);
});
test("Breakout: circle/AABB reflects contact and depenetrates without tunnelling", () => {
  const brick = createDefenceState().bricks[0];
  const ball = {
    x: brick.x + 10,
    y: brick.y + brick.height + 4,
    radius: 6,
    vx: 22,
    vy: -400,
  };
  assert.ok(collideDefenceBrick(ball, brick));
  assert.ok(ball.vy > 0);
  assert.ok(ball.y >= brick.y + brick.height + ball.radius);
  assert.equal(collideDefenceBrick(ball, brick), false);
  assert.ok(ARCADE.breakout.maxSpeed * ARCADE.breakout.step < 6);
});
test("Breakout: armored bricks require three real collisions", () => {
  const state = createDefenceState(),
    brick = state.bricks[0];
  for (let expected = 2; expected >= 0; expected--) {
    hitBrick(state, brick);
    assert.equal(brick.hp, expected);
  }
  assert.equal(state.mode, "playing");
  assert.equal(brick.maxHp, 3);
});
test("Breakout: center and edge hits give different, non-trapped paddle trajectories", () => {
  const center = createDefenceState(),
    edge = createDefenceState();
  for (const [state, offset] of [
    [center, 0],
    [edge, 30],
  ]) {
    state.mode = "playing";
    Object.assign(state.ball, {
      x: 210 + offset,
      y: paddleY - 6.2,
      vx: 0,
      vy: 285,
    });
    stepDefence(state, 210, false, true);
    assert.ok(state.ball.vy < 0);
  }
  assert.ok(Math.abs(center.ball.vx) < Math.abs(edge.ball.vx));
  assert.ok(Math.abs(center.ball.vx) >= 22);
  assert.ok(Math.abs(edge.ball.vy) > 85);
});
test("Breakout: missing the paddle costs a life, only the third miss ends the run", () => {
  const state = createDefenceState();
  for (let left = 2; left >= 0; left--) {
    state.mode = "playing";
    state.ball.y = 570;
    state.ball.vy = 300;
    stepDefence(state, 210, false);
    assert.equal(state.lives, left);
    assert.equal(state.mode, left ? "serve" : "lost");
  }
  const reset = createDefenceState();
  assert.equal(reset.lives, 3);
  assert.equal(reset.score, 0);
  assert.equal(reset.bricks.filter((b) => b.hp).length, 80);
});
test("Breakout: victory requires the last remaining destructible brick", () => {
  const state = createDefenceState();
  state.bricks.forEach((b) => {
    b.hp = 0;
  });
  state.bricks[79].hp = 1;
  state.mode = "playing";
  assert.notEqual(state.mode, "victory");
  hitBrick(state, state.bricks[79]);
  assert.equal(state.mode, "victory");
});
test("Breakout: a legitimate paddle-input simulation clears the entire wall and replays on the server", () => {
  const state = createDefenceState(),
    inputs = [];
  while (!["lost", "victory"].includes(state.mode) && inputs.length < 180000) {
    let target = 210;
    if (state.ball.vy > 0) {
      let x =
        state.ball.x + (state.ball.vx * (510 - state.ball.y)) / state.ball.vy;
      x = (((x - 6) % 816) + 816) % 816;
      if (x > 408) x = 816 - x;
      target = x + 6 + Math.sin(state.elapsed * 0.713) * 20;
    }
    target = Math.round(Math.max(34, Math.min(386, target)) * 100) / 100;
    const launch = state.mode === "serve";
    inputs.push(Math.round(target * 100) + (launch ? 100000 : 0));
    stepDefence(state, target, launch, true);
  }
  assert.equal(state.mode, "victory");
  assert.equal(state.bricks.filter((b) => b.hp).length, 0);
  const replay = verifyArcadeResult("break-defences", { seed: 0, inputs }, 0);
  assert.equal(replay.progress, 100);
  assert.equal(replay.score, state.score);
  assert.ok(replay.durationMs > 0);
});

function mineFixture(first = 17) {
  const mines = new Set([18, ...Array.from({ length: 54 }, (_, i) => 202 + i)]);
  return {
    mines,
    first,
    verified: false,
    counts: Array.from(
      { length: 256 },
      (_, i) => mineNeighbours(i).filter((n) => mines.has(n)).length,
    ),
  };
}
test("Mines: neighbours never wrap rows or exceed the 16×16 board", () => {
  assert.deepEqual(mineNeighbours(0), [1, 16, 17]);
  assert.deepEqual(mineNeighbours(255), [238, 239, 254]);
  assert.equal(mineNeighbours(136).length, 8);
});
test("Mines: deterministic placement has exactly 55 mines and excludes the whole opening", () => {
  for (const first of [0, 15, 255, 136]) {
    const board = generateMineBoard(31, first);
    assert.equal(board.mines.size, 55);
    for (const cell of [first, ...mineNeighbours(first)])
      assert.equal(board.mines.has(cell), false);
    for (let i = 0; i < 256; i++)
      assert.equal(
        board.counts[i],
        mineNeighbours(i).filter((n) => board.mines.has(n)).length,
      );
    assert.deepEqual(board, generateMineBoard(31, first));
  }
});
test("Mines: bounded generator honestly distinguishes logically verified boards from safe-opening fallbacks", () => {
  let verified = 0,
    fallback = 0;
  for (let seed = 0; seed < 20; seed++) {
    const board = generateMineBoard(seed, 136);
    if (board.verified) {
      verified++;
      assert.ok(solveMineBoard(board));
    } else fallback++;
  }
  assert.ok(verified > 0);
  assert.ok(fallback > 0);
  assert.equal(ARCADE.mines.generationBudget, 16);
});
test("Mines: zero flood respects flags and never reveals mines", () => {
  const board = mineFixture(),
    revealed = new Set();
  floodMineCells(board, revealed, new Set([1]), 0);
  assert.ok(revealed.size > 9);
  assert.equal(revealed.has(1), false);
  assert.equal(revealed.has(18), false);
});
test("Mines: flags toggle only on covered cells and cannot trigger victory", () => {
  const state = createMineState();
  state.board = mineFixture();
  state.status = "playing";
  actMine(state, 18, 1);
  assert.ok(state.flags.has(18));
  assert.equal(state.status, "playing");
  actMine(state, 18, 1);
  assert.equal(state.flags.size, 0);
  actMine(state, 17, 0);
  actMine(state, 17, 1);
  assert.equal(state.flags.size, 0);
});
test("Mines: correctly flagged chording opens neighbours; incorrect flags detonate immediately", () => {
  const safe = createMineState();
  safe.board = mineFixture();
  safe.status = "playing";
  actMine(safe, 17, 0);
  actMine(safe, 18, 1);
  actMine(safe, 17, 2);
  assert.ok(safe.revealed.has(16));
  assert.notEqual(safe.status, "lost");
  const wrong = createMineState();
  wrong.board = mineFixture();
  wrong.status = "playing";
  actMine(wrong, 17, 0);
  actMine(wrong, 16, 1);
  actMine(wrong, 17, 2);
  assert.equal(wrong.status, "lost");
  assert.equal(wrong.detonated, 18);
});
test("Mines: clock starts after first reveal and freezes at the terminal outcome", () => {
  const state = createMineState();
  tickMineClock(state, 100, 2000);
  assert.equal(state.elapsedMs, 0);
  state.status = "playing";
  tickMineClock(state, 100, 1600);
  assert.equal(state.elapsedMs, 1500);
  state.status = "won";
  tickMineClock(state, 100, 9000);
  assert.equal(state.elapsedMs, 1500);
});
test("Mines: all safe reveals win, and a generated-board input transcript verifies both outcomes", () => {
  const seed = 42,
    first = 136,
    board = generateMineBoard(seed, first),
    state = createMineState(),
    inputs = [first * 3];
  state.board = board;
  state.status = "playing";
  actMine(state, first, 0);
  for (let i = 0; i < 256 && state.status === "playing"; i++)
    if (!board.mines.has(i) && !state.revealed.has(i)) {
      inputs.push(i * 3);
      actMine(state, i, 0);
    }
  assert.equal(state.status, "won");
  assert.equal(state.revealed.size, 201);
  assert.equal(
    verifyArcadeResult("relationship-minefield", { seed, inputs }, 82000)
      .progress,
    100,
  );
  const loss = verifyArcadeResult(
    "relationship-minefield",
    { seed, inputs: [first * 3, [...board.mines][0] * 3] },
    1000,
  );
  assert.equal(loss.ending, "mine-detonated");
  assert.ok(loss.progress < 100);
});

test("Memory: 36 unique instances contain exactly two of each of 18 distinct identities", () => {
  for (let seed = 0; seed < 100; seed++) {
    const state = createMemoryState(seed);
    assert.equal(state.deck.length, 36);
    assert.equal(new Set(state.deck.map((c) => c.instanceId)).size, 36);
    for (const memory of arcadeMemories)
      assert.equal(
        state.deck.filter((c) => c.memoryId === memory.id).length,
        2,
      );
  }
  assert.notDeepEqual(createMemoryState(1).deck, createMemoryState(2).deck);
  assert.deepEqual(createMemoryState(1).deck, createMemoryState(1).deck);
});
test("Memory: timer begins on first flip, same-instance/double inputs are rejected", () => {
  const state = createMemoryState(1);
  tickMemory(state, 100000);
  assert.equal(state.elapsedMs, 0);
  assert.ok(flipMemory(state, 0, 100000));
  assert.equal(state.startedAt, 100000);
  assert.equal(flipMemory(state, 0, 100001), false);
  assert.equal(state.open.length, 1);
  assert.equal(state.attempts, 0);
});
test("Memory: mismatches lock third-card input and close after exactly the configured delay", () => {
  const state = createMemoryState(5),
    other = state.deck.findIndex((c) => c.memoryId !== state.deck[0].memoryId);
  flipMemory(state, 0, 0);
  flipMemory(state, other, 100);
  assert.equal(state.status, "RESOLVING_PAIR");
  assert.equal(flipMemory(state, 2, 110), false);
  tickMemory(state, 749);
  assert.equal(state.open.length, 2);
  tickMemory(state, 750);
  assert.equal(state.open.length, 0);
  assert.equal(state.status, "PLAYING");
  assert.equal(state.attempts, 1);
});
test("Memory: hidden-tab elapsed time causes immediate timeout, no late flip or extended clock", () => {
  const state = createMemoryState(1);
  flipMemory(state, 0, 1000);
  tickMemory(state, 76000);
  assert.equal(state.status, "LOST");
  assert.equal(state.elapsedMs, 75000);
  assert.equal(flipMemory(state, 1, 76001), false);
});
test("Memory: final pair wins before its animation, deadline is strict, result clock remains frozen", () => {
  const state = createMemoryState(2),
    inputs = [],
    times = [];
  let now = 0;
  for (const memory of arcadeMemories) {
    const pair = state.deck
      .map((c, i) => (c.memoryId === memory.id ? i : -1))
      .filter((i) => i >= 0);
    for (const index of pair) {
      inputs.push(index);
      times.push(now);
      assert.ok(flipMemory(state, index, now));
      now += 500;
    }
  }
  assert.equal(state.status, "WON");
  assert.equal(state.attempts, 18);
  const elapsed = state.elapsedMs;
  tickMemory(state, 90000);
  assert.equal(state.elapsedMs, elapsed);
  const replay = verifyArcadeResult(
    "365-memories",
    { seed: 2, inputs, times },
    0,
  );
  assert.equal(replay.progress, 100);
  assert.equal(replay.moves, 18);
  const reset = createMemoryState(2);
  assert.equal(reset.status, "READY");
  assert.equal(reset.attempts, 0);
  assert.equal(reset.matched.size, 0);
});
test("Memory: the final pair wins at 74,999ms but not at the 75,000ms deadline", () => {
  for (const finalTime of [74999, 75000]) {
    const state = createMemoryState(31);
    for (const [i, memory] of arcadeMemories.entries()) {
      const pair = state.deck
        .map((card, index) => (card.memoryId === memory.id ? index : -1))
        .filter((index) => index >= 0);
      assert.ok(flipMemory(state, pair[0], i * 100));
      const accepted = flipMemory(
        state,
        pair[1],
        i === 17 ? finalTime : i * 100 + 50,
      );
      assert.equal(accepted, i !== 17 || finalTime < ARCADE.memory.limitMs);
    }
    assert.equal(
      state.status,
      finalTime < ARCADE.memory.limitMs ? "WON" : "LOST",
    );
  }
});
test("Memory: invalid indices, post-deadline and premature mismatch transcript flips are rejected", () => {
  assert.throws(() =>
    verifyArcadeResult(
      "365-memories",
      { seed: 1, inputs: [0, 0], times: [0, 1] },
      1,
    ),
  );
  assert.throws(() =>
    verifyArcadeResult(
      "365-memories",
      { seed: 1, inputs: [0, 1], times: [0, 75000] },
      75000,
    ),
  );
  assert.throws(() =>
    verifyArcadeResult(
      "365-memories",
      { seed: 1, inputs: [36], times: [0] },
      1,
    ),
  );
  assert.equal(
    verifyArcadeResult(
      "365-memories",
      { seed: 1, inputs: [0], times: [0] },
      75000,
    ).ending,
    "archive-timed-out",
  );
});

test("Snake: moves one cell, grows on food, never spawns food inside its body", () => {
  const state = createSnakeState(1);
  state.status = "playing";
  const next = state.body[0] + 1;
  state.food = next;
  stepSnake(state);
  assert.equal(state.body[0], next);
  assert.equal(state.body.length, 4);
  assert.equal(state.score, 1);
  assert.equal(state.body.includes(state.food), false);
  assert.equal(
    spawnSnakeFood(
      Array.from({ length: 323 }, (_, i) => i),
      () => 0.99,
    ),
    323,
  );
});
test("Snake: rapid queued inputs cannot produce a 180° reversal", () => {
  const state = createSnakeState(1);
  state.status = "playing";
  queueSnakeDirection(state, 0);
  queueSnakeDirection(state, 3);
  assert.equal(state.queued, 0);
  stepSnake(state);
  assert.equal(state.direction, 0);
  queueSnakeDirection(state, 2);
  assert.equal(state.queued, 0);
});
test("Snake: walls and the body are lethal, entering the vacating tail is allowed", () => {
  const wall = createSnakeState(1);
  wall.status = "playing";
  wall.body = [17];
  stepSnake(wall);
  assert.equal(wall.status, "lost");
  const body = createSnakeState(1);
  body.status = "playing";
  body.direction = 2;
  body.queued = 3;
  body.body = [20, 21, 39, 38, 37, 19, 1, 2];
  body.food = 300;
  stepSnake(body);
  assert.equal(body.status, "lost");
  const tail = createSnakeState(1);
  tail.status = "playing";
  tail.direction = 2;
  tail.queued = 3;
  tail.body = [20, 21, 39, 38, 37, 19];
  tail.food = 300;
  stepSnake(tail);
  assert.equal(tail.status, "playing");
});
test("Snake: increasing speed remains fixed-step and bounded", () => {
  assert.equal(snakeStepMs(0), 155);
  assert.ok(snakeStepMs(30) < snakeStepMs(10));
  assert.equal(snakeStepMs(50), 65);
});
test("Snake: a legitimate cycle reaches 50 and the entire input sequence verifies", () => {
  const cycle = [];
  for (let x = 0; x < 18; x++) cycle.push(x);
  for (let y = 1; y < 18; y++) {
    if (y % 2) for (let x = 17; x >= 1; x--) cycle.push(y * 18 + x);
    else for (let x = 1; x < 18; x++) cycle.push(y * 18 + x);
  }
  for (let y = 17; y >= 1; y--) cycle.push(y * 18);
  cycle.reverse();
  const state = createSnakeState(17),
    inputs = [];
  state.status = "playing";
  while (state.status === "playing" && inputs.length < 30000) {
    const next = cycle[(cycle.indexOf(state.body[0]) + 1) % cycle.length],
      delta = next - state.body[0],
      direction = delta === 1 ? 1 : delta === -1 ? 3 : delta === 18 ? 2 : 0;
    inputs.push(direction);
    queueSnakeDirection(state, direction);
    stepSnake(state);
  }
  assert.equal(state.status, "won");
  assert.equal(state.score, 50);
  assert.equal(verifyArcadeResult("snake", { seed: 17, inputs }, 0).score, 500);
  const loss = verifyArcadeResult(
    "snake",
    { seed: 17, inputs: Array(11).fill(1) },
    0,
  );
  assert.equal(loss.ending, "snake-collision");
});

function mazeCommand(from, to) {
  const delta = to - from;
  return delta === -33 ? 1 : delta === 1 ? 2 : delta === 33 ? 3 : 4;
}
test("Maze: 100 seeds produce connected 33×33 boards and safe actual-rule solutions", () => {
  for (let seed = 0; seed < 100; seed++) {
    const board = generateMaze(seed),
      visited = new Set([board.start]),
      queue = [board.start];
    for (let i = 0; i < queue.length; i++)
      for (const n of mazeNeighbours(queue[i], board.floor))
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
    assert.equal(board.floor.size, 511);
    assert.equal(visited.size, board.floor.size);
    assert.equal(new Set(board.keys).size, 3);
    assert.equal(new Set(board.doors).size, 3);
    const route = solveMaze(board);
    assert.ok(route);
    assert.ok(route.length > 80);
    assert.ok(route.length * ARCADE.maze.stepMs < ARCADE.maze.limitMs);
    const state = createMazeState(seed);
    state.status = "playing";
    for (let i = 1; i < route.length; i++) {
      stepMaze(state, mazeCommand(state.position, route[i]));
      assert.notEqual(state.status, "lost");
    }
    assert.equal(state.status, "won");
    assert.equal(state.keys, 7);
  }
  assert.deepEqual(generateMaze(31), generateMaze(31));
  assert.notDeepEqual(generateMaze(31).floor, generateMaze(32).floor);
});
test("Maze: locked doors block movement without their matching key", () => {
  const state = createMazeState(31),
    door = state.board.doors[0],
    approach = mazeNeighbours(door, state.board.floor)[0];
  state.status = "playing";
  state.position = approach;
  stepMaze(state, mazeCommand(approach, door));
  assert.equal(state.position, approach);
  state.keys = 1;
  stepMaze(state, mazeCommand(approach, door));
  assert.equal(state.position, door);
});
test("Maze: walls block, hazards collide, and the active-play timer has a strict deadline", () => {
  const wall = createMazeState(31);
  wall.status = "playing";
  stepMaze(wall, 1);
  assert.equal(wall.position, wall.board.start);
  const hazard = createMazeState(31);
  hazard.status = "playing";
  hazard.position = hazard.board.hazards[0][0];
  stepMaze(hazard, 0);
  assert.equal(hazard.status, "lost");
  const timeout = createMazeState(31);
  timeout.status = "playing";
  for (let i = 0; i < 3000; i++) stepMaze(timeout, 0);
  assert.equal(timeout.status, "lost");
});
test("Maze: complete key/door path and timeout transcripts verify, exit without all keys does not win", () => {
  const state = createMazeState(44),
    route = solveMaze(state.board),
    inputs = [];
  state.status = "playing";
  for (let i = 1; i < route.length; i++) {
    const command = mazeCommand(state.position, route[i]);
    inputs.push(command);
    stepMaze(state, command);
  }
  assert.equal(
    verifyArcadeResult("maze", { seed: 44, inputs }, 0).progress,
    100,
  );
  assert.equal(
    verifyArcadeResult("maze", { seed: 44, inputs: Array(3000).fill(0) }, 0)
      .ending,
    "maze-lost",
  );
  const missing = createMazeState(44);
  missing.status = "playing";
  missing.position = missing.board.exit;
  stepMaze(missing, 0);
  assert.equal(missing.status, "playing");
});
test("Server replay rejects unregistered, missing, oversized, invalid and unfinished evidence", () => {
  assert.throws(() => verifyArcadeResult("snake", undefined, 0));
  assert.throws(() =>
    verifyArcadeResult("snake", { seed: 0, inputs: Array(180001).fill(1) }, 0),
  );
  assert.throws(() => verifyArcadeResult("snake", { seed: 0, inputs: [5] }, 0));
  assert.throws(() => verifyArcadeResult("maze", { seed: 0, inputs: [0] }, 0));
  assert.throws(() =>
    verifyArcadeResult("great-escape", { seed: 0, inputs: [0] }, 0),
  );
});
