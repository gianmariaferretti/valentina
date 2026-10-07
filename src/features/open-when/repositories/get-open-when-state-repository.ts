import "server-only";

import type { OpenWhenStateRepository } from "@/features/open-when/repositories/open-when-state-repository";
import { SupabaseOpenWhenStateRepository } from "@/features/open-when/repositories/supabase-open-when-state-repository";
import { EMPTY_OPEN_WHEN_STATE } from "@/features/open-when/types";
import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

export function getOpenWhenStateRepository(): OpenWhenStateRepository {
  return new SupabaseOpenWhenStateRepository();
}

export async function loadOpenWhenState() {
  if (!(await hasValidAccessSession())) return EMPTY_OPEN_WHEN_STATE;

  try {
    return await getOpenWhenStateRepository().get();
  } catch (error) {
    reportPersistenceFailure("load open when state", error);
    return EMPTY_OPEN_WHEN_STATE;
  }
}
