import "server-only";

import type { SiteProgressState } from "@/types/progress";

export interface ProgressRepository {
  get(): Promise<SiteProgressState>;
  setMemoriesDiscovered(count: number): Promise<void>;
}
