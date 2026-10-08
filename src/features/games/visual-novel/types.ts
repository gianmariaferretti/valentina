export type RelationshipMetric =
  | "relationshipHealth"
  | "valentinaPatience"
  | "boyfriendPoints"
  | "trust"
  | "chaos"
  | "gianmariaEgo";
export type Approach =
  | "care"
  | "quiet"
  | "practical"
  | "yield"
  | "chaotic"
  | "ego"
  | "neglect"
  | "investigate";
export interface StoryState {
  readonly metrics: Record<RelationshipMetric, number>;
  readonly flags: readonly string[];
  readonly approaches: Record<Approach, number>;
  readonly choices: readonly string[];
  readonly cursor: number;
}
export interface StoryCondition {
  readonly flag?: string;
  readonly metric?: RelationshipMetric;
  readonly minimum?: number;
  readonly maximum?: number;
}
export interface StoryChoice {
  readonly id: string;
  readonly text: string;
  readonly approach: Approach;
  readonly consequence: string;
  readonly flags?: readonly string[];
  readonly requires?: readonly StoryCondition[];
}
export interface StoryDecision {
  readonly id: string;
  readonly chapter: number;
  readonly speaker: "Valentina" | "Gianmaria" | "The narrator";
  readonly narration: string;
  readonly dialogue: string;
  readonly choices: readonly StoryChoice[];
  readonly requires?: readonly StoryCondition[];
  readonly alternate?: {
    readonly when: readonly StoryCondition[];
    readonly narration: string;
    readonly dialogue: string;
  };
}
