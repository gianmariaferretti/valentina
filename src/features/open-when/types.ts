export type LetterMood = "playful" | "tender" | "steady";
export type EnvelopeTone = "ivory" | "rose" | "blue" | "kraft" | "burgundy";
export type EnvelopeMark = "air-mail" | "confidential" | "kiss" | "priority";

export interface OpenWhenLetter {
  readonly slug: string;
  readonly title: string;
  readonly preview: string;
  readonly salutation: string;
  readonly paragraphs: readonly string[];
  readonly signoff: string;
  readonly postscript: string | null;
  readonly annotation: string;
  readonly mood: LetterMood;
  readonly envelope: {
    readonly tone: EnvelopeTone;
    readonly mark: EnvelopeMark;
    readonly rotation: number;
  };
  readonly rewardId: string | null;
}

export interface OpenedLetterRecord {
  readonly slug: string;
  readonly openedAt: string;
}

export interface ClaimedRewardRecord {
  readonly rewardId: string;
  readonly claimedAt: string;
}

export interface OpenWhenState {
  readonly version: 1;
  readonly openedLetters: readonly OpenedLetterRecord[];
  readonly claimedRewards: readonly ClaimedRewardRecord[];
}

export const EMPTY_OPEN_WHEN_STATE: OpenWhenState = {
  version: 1,
  openedLetters: [],
  claimedRewards: [],
};
