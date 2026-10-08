export const gameDifficulties = ["story", "standard", "daring"] as const;

export type GameDifficulty = (typeof gameDifficulties)[number];
export type GameRewardKind =
  "achievement" | "coupon" | "discovery" | "secret" | "item";
export type GameRewardTrigger = "completion" | "victory" | "secret";
export type GameEngineKind =
  | "great-escape"
  | "find-gianmaria"
  | "survive-relationship"
  | "break-defences"
  | "build-year"
  | "relationship-minefield"
  | "365-memories";

export interface GameRewardDefinition {
  readonly id: string;
  readonly kind: GameRewardKind;
  readonly targetId: string;
  readonly title: string;
  readonly description: string;
  readonly trigger: GameRewardTrigger;
  readonly secretId?: string;
}

export interface GameVictoryRule {
  readonly endings: readonly string[];
  readonly minimumProgress: number;
  readonly minimumScore?: number;
}

export interface VgGameDefinition {
  readonly gameId: string;
  readonly slug: string;
  readonly number: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly dossierLabel: string;
  readonly description: string;
  readonly objective: string;
  readonly engine: GameEngineKind;
  readonly difficulty: GameDifficulty;
  readonly estimatedMinutes: number;
  readonly accent:
    "oxblood" | "rust" | "blue" | "gold" | "green" | "rose" | "ink";
  readonly instructions: readonly string[];
  readonly controls: readonly string[];
  readonly maxScore: number;
  readonly victory: GameVictoryRule;
  readonly allowedEndings: readonly string[];
  readonly rewards: readonly GameRewardDefinition[];
}

export interface GameProgress {
  readonly gameId: string;
  readonly bestScore: number;
  readonly latestScore: number;
  readonly attempts: number;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly durationMs: number;
  readonly difficulty: GameDifficulty;
  readonly progress: number;
  readonly ending: string | null;
  readonly wins: number;
  readonly losses: number;
  readonly unlockedRewards: readonly string[];
  readonly discoveredSecrets: readonly string[];
}

export interface GameProgressState {
  readonly version: 2;
  readonly games: readonly GameProgress[];
}

export interface GameRunResult {
  readonly score: number;
  readonly progress: number;
  readonly ending: string;
  readonly discoveredSecrets?: readonly string[];
}

export interface GameRewardReceipt {
  readonly id: string;
  readonly kind: GameRewardKind;
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly newlyGranted: boolean;
}

export interface GameEngineProps {
  readonly difficulty: GameDifficulty;
  readonly paused: boolean;
  readonly reduceMotion: boolean;
  readonly soundEnabled: boolean;
  readonly onFinish: (result: GameRunResult) => void;
  readonly onRestart: () => void;
  readonly onScoreChange: (score: number) => void;
  readonly onProgressChange: (progress: number) => void;
}

export const EMPTY_GAME_PROGRESS_STATE: GameProgressState = {
  version: 2,
  games: [],
};
