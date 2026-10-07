export interface SiteProgressState {
  readonly memoriesDiscovered: number;
  readonly achievementCount: number;
  readonly discoveryCount: number;
  readonly lastVisitedAt: string | null;
}

export const EMPTY_SITE_PROGRESS: SiteProgressState = {
  memoriesDiscovered: 0,
  achievementCount: 0,
  discoveryCount: 0,
  lastVisitedAt: null,
};
