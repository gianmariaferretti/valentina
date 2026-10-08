export const gameDifficulties = ["story", "standard", "daring"] as const;

export type GameDifficulty = (typeof gameDifficulties)[number];
export type GameRewardKind =
  "achievement" | "coupon" | "discovery" | "secret" | "item";
export type GameRewardTrigger =
  "completion" | "victory" | "secret" | "collection";
export type GameEngineKind =
  | "break-defences"
  | "relationship-minefield"
  | "365-memories"
  | "snake"
  | "maze";

export interface GameRewardDefinition {
  readonly id: string;
  readonly kind: GameRewardKind;
  readonly targetId: string;
  readonly title: string;
  readonly description: string;
  readonly trigger: GameRewardTrigger;
  readonly secretId?: string;
  readonly requiredSecrets?: readonly string[];
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
  readonly metric?: "score" | "time";
  readonly victory: GameVictoryRule;
  readonly allowedEndings: readonly string[];
  readonly permittedSecrets?: readonly string[];
  readonly rewards: readonly GameRewardDefinition[];
}

export interface GameProgress {
  readonly lastResult?: string | null;
  readonly lastPlayedAt?: string | null;
  readonly bestTimeMs?: number | null;
  readonly fewestMoves?: number | null;
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
  readonly durationMs?: number;
  readonly moves?: number;
  readonly evidence?: GameEvidence;
  readonly score: number;
  readonly progress: number;
  readonly ending: string;
  readonly discoveredSecrets?: readonly string[];
}

/** Deterministic input transcript. Rewards never accept a client's victory boolean. */
export interface GameEvidence {
  readonly seed: number;
  readonly inputs: readonly number[];
  readonly times?: readonly number[];
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
  readonly seed: number;
  readonly bestScore?: number;
  readonly difficulty: GameDifficulty;
  readonly paused: boolean;
  readonly reduceMotion: boolean;
  readonly soundEnabled: boolean;
  readonly archivedSecrets: readonly string[];
  readonly onFinish: (result: GameRunResult) => void;
  readonly onRestart: () => void;
  readonly onScoreChange: (score: number) => void;
  readonly onProgressChange: (progress: number) => void;
}

export const EMPTY_GAME_PROGRESS_STATE: GameProgressState = {
  version: 2,
  games: [],
};
