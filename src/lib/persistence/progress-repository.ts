import type { ExperienceProgress } from "@/types/progress";

/**
 * Storage boundary for interactive progress. A future Supabase repository can
 * implement this contract without changing feature components.
 */
export interface ProgressRepository {
  get(): Promise<ExperienceProgress>;
  save(progress: ExperienceProgress): Promise<void>;
  clear(): Promise<void>;
}
