import "server-only";

import { hasValidAccessSession } from "@/lib/auth/session";
import type { ProgressRepository } from "@/lib/persistence/progress-repository";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";
import { SupabaseProgressRepository } from "@/lib/persistence/supabase-progress-repository";
import { EMPTY_SITE_PROGRESS } from "@/types/progress";

export function getProgressRepository(): ProgressRepository {
  return new SupabaseProgressRepository();
}

export async function loadSiteProgress() {
  if (!(await hasValidAccessSession())) return EMPTY_SITE_PROGRESS;

  try {
    return await getProgressRepository().get();
  } catch (error) {
    reportPersistenceFailure("load site progress", error);
    return EMPTY_SITE_PROGRESS;
  }
}
