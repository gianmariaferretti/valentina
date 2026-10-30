import type {
  VgGameDefinition,
  GameRewardDefinition,
} from "../features/games/types.ts";
import { DEFENCE_MAX_SCORE } from "./defence-arcade.ts";
function badge(
  id: string,
  targetId: string,
  title: string,
  description: string,
): GameRewardDefinition {
  return {
    id,
    targetId,
    title,
    description,
    kind: "achievement",
    trigger: "victory",
  };
}
function coupon(
  id: string,
  targetId: string,
  title: string,
): GameRewardDefinition {
  return {
    id,
    targetId,
    title,
    description: "Unlocked in your wallet. Redemption remains your choice.",
    kind: "coupon",
    trigger: "victory",
  };
}
export const vgGames = [
  {
    gameId: "break-defences",
    slug: "break-defences",
    number: "01",
    title: "Break My Defences",
    shortTitle: "Break Defences",
    dossierLabel: "Precision / 01",
    description: "Clear every brick. Three lives. No mercy.",
    objective: "Destroy all 90 bricks. Lose no lives for perfect clearance.",
    engine: "break-defences",
    difficulty: "standard",
    estimatedMinutes: 6,
    accent: "rust",
    metric: "score",
    instructions: [
      "Clear one wall of 90 bricks with three lives. A perfect run loses none.",
      "One, two or three inset marks indicate brick durability. The ball accelerates with each hit.",
      "Move the narrow paddle; launch again after losing a life. No power-ups or extra lives.",
    ],
    controls: [
      "Mouse or touch drag",
      "Arrow keys / A and D",
      "Space or Enter to launch",
    ],
    maxScore: DEFENCE_MAX_SCORE,
    victory: {
      endings: ["defences-breached", "defences-perfect"],
      minimumProgress: 100,
    },
    allowedEndings: ["defences-breached", "defences-perfect", "file-resealed"],
    rewards: [
      badge(
        "break-defences-achievement",
        "defence-breaker",
        "Defence Breaker",
        "Cleared every brick with three lives.",
      ),
      coupon(
        "break-defences-premium-coupon",
        "evening-your-way",
        "An Evening, Your Way",
      ),
      {
        ...coupon(
          "break-defences-perfect-coupon",
          "no-budget-date",
          "GV-031 · No Budget Date",
        ),
        requiredEnding: "defences-perfect",
      },
      {
        id: "break-defences-key-fragment",
        targetId: "item:oxblood-key-fragment",
        title: "Oxblood Key Fragment",
        description: "A piece of the final archive clearance.",
        kind: "item",
        trigger: "victory",
      },
    ],
  },
  {
    gameId: "relationship-minefield",
    slug: "relationship-minefield",
    number: "02",
    title: "Relationship Minefield",
    shortTitle: "Minefield",
    dossierLabel: "Logic / 02",
    description: "55 mines. One mistake ends everything.",
    objective: "Reveal all 201 safe cells.",
    engine: "relationship-minefield",
    difficulty: "standard",
    estimatedMinutes: 8,
    accent: "green",
    metric: "time",
    instructions: [
      "16 × 16 cells, 55 mines. Your opening and its neighbours are always safe.",
      "Numbers count adjacent mines. Flag suspected mines; open every safe cell to win.",
      "Tap a revealed number to chord when its adjacent flags match. Incorrect flags can detonate a mine.",
      "On phones, pan the magnified board or use Fit board. Long-press to flag, or enable Flag mode.",
    ],
    controls: [
      "Click / tap to reveal",
      "Right-click / long-press to flag",
      "Arrow keys to focus; F to flag; Enter to reveal/chord",
    ],
    maxScore: 201,
    victory: { endings: ["field-cleared"], minimumProgress: 100 },
    allowedEndings: ["field-cleared", "mine-detonated"],
    rewards: [
      badge(
        "minefield-achievement",
        "minefield-navigator",
        "Minefield Navigator",
        "Revealed every safe cell in the 55-mine field.",
      ),
    ],
  },
  {
    gameId: "365-memories",
    slug: "365-memories",
    number: "03",
    title: "365 Memories",
    shortTitle: "365 Memories",
    dossierLabel: "Recall / 03",
    description: "18 pairs. 2 minutes 45 seconds.",
    objective: "Match all 18 pairs before time runs out.",
    engine: "365-memories",
    difficulty: "standard",
    estimatedMinutes: 2,
    accent: "ink",
    metric: "time",
    instructions: [
      "Flip two cards. Matching identities stay face up; mismatches close after a brief delay.",
      "The 2-minute-45-second clock starts with your first flip. It keeps running in another tab—there is no pause or preview.",
      "Match all 18 photographic pairs from our private archive. Photographs never use a public image URL.",
    ],
    controls: ["Click or tap", "Arrow keys to focus; Enter or Space to flip"],
    maxScore: 1800,
    victory: { endings: ["archive-complete"], minimumProgress: 100 },
    allowedEndings: ["archive-complete", "archive-timed-out"],
    rewards: [
      badge(
        "memories-achievement",
        "memory-keeper-365",
        "Keeper of the Archive",
        "Matched 18 pairs within 2 minutes 45 seconds.",
      ),
      coupon(
        "memories-classified-coupon",
        "classified-coupon",
        "GV-033 · The Classified Coupon",
      ),
      {
        id: "memories-master-key",
        targetId: "item:master-archive-key",
        title: "Master Archive Key",
        description: "The final archive key.",
        kind: "item",
        trigger: "victory",
      },
    ],
  },
  {
    gameId: "snake",
    slug: "snake",
    number: "04",
    title: "Snake",
    shortTitle: "Snake",
    dossierLabel: "Survival / 04",
    description: "Grow longer. Move faster. Survive.",
    objective: "Collect 75 foods on a 24 × 24 board. One life.",
    engine: "snake",
    difficulty: "standard",
    estimatedMinutes: 4,
    accent: "oxblood",
    metric: "score",
    instructions: [
      "Collect food to grow. Walls, obstacles and your own body end the run.",
      "Seeded static and moving obstacles guard the shortcuts. More blocks appear every 15 foods; speed increases to a bounded maximum.",
      "You cannot reverse direction. Pause and resume without changing the board.",
    ],
    controls: ["Arrow keys / WASD", "Swipe", "On-screen direction pad"],
    maxScore: 750,
    victory: {
      endings: ["snake-complete"],
      minimumProgress: 100,
      minimumScore: 750,
    },
    allowedEndings: ["snake-complete", "snake-collision"],
    rewards: [
      badge(
        "snake-high-score",
        "snake-75",
        "Exceptional Survival",
        "Collected 75 foods in an accelerating, obstacle-filled Snake run.",
      ),
      coupon(
        "snake-impossible-coupon",
        "coupon-with-no-rules",
        "GV-035 · The Coupon with No Rules",
      ),
    ],
  },
  {
    gameId: "maze",
    slug: "maze",
    number: "05",
    title: "Maze",
    shortTitle: "Maze",
    dossierLabel: "Exploration / 05",
    description: "Find the exit.",
    objective:
      "Recover five numbered keys and reach the exit within five minutes.",
    engine: "maze",
    difficulty: "standard",
    estimatedMinutes: 5,
    accent: "blue",
    metric: "time",
    instructions: [
      "Explore a seeded 45 × 45 labyrinth through a limited field of vision.",
      "Keys I–V open their matching doors. The exit needs all five keys.",
      "Moving hazards are lethal. A safe route always exists through the actual key and door rules.",
      "Five minutes of active play. Pause freezes movement and the clock.",
    ],
    controls: ["Arrow keys / WASD", "Touch direction pad", "P to pause"],
    maxScore: 1800,
    victory: { endings: ["maze-escaped"], minimumProgress: 100 },
    allowedEndings: ["maze-escaped", "maze-lost"],
    rewards: [
      badge(
        "maze-completion",
        "maze-explorer",
        "Wayfinder",
        "Escaped a keyed labyrinth before the clock expired.",
      ),
      coupon(
        "maze-weekend-getaway",
        "weekend-getaway",
        "GV-026 · Weekend Getaway",
      ),
    ],
  },
] as const satisfies readonly VgGameDefinition[];
export type VgGameId = (typeof vgGames)[number]["gameId"];
export function getVgGame(slug: string): VgGameDefinition | undefined {
  return vgGames.find((game) => game.slug === slug);
}
export function isVgGameId(value: string): value is VgGameId {
  return vgGames.some((game) => game.gameId === value);
}
export const retiredGameSlugs = [
  "great-escape",
  "find-gianmaria",
  "survive-relationship",
  "build-year",
  "boyfriend-exam",
  "two-truths",
  "final-verdict",
] as const;
