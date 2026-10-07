import type { ProgressRepository } from "@/lib/persistence/progress-repository";
import { EMPTY_PROGRESS, type ExperienceProgress } from "@/types/progress";

const STORAGE_KEY = "vg:year-one:progress";

export class LocalProgressRepository implements ProgressRepository {
  async get(): Promise<ExperienceProgress> {
    if (typeof window === "undefined") return EMPTY_PROGRESS;

    const storedValue = window.localStorage.getItem(STORAGE_KEY);
    if (!storedValue) return EMPTY_PROGRESS;

    try {
      return JSON.parse(storedValue) as ExperienceProgress;
    } catch {
      return EMPTY_PROGRESS;
    }
  }

  async save(progress: ExperienceProgress): Promise<void> {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }

  async clear(): Promise<void> {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
