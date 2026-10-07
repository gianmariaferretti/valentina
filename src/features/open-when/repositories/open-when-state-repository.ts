import "server-only";

import type { OpenWhenState } from "@/features/open-when/types";

/** Replace this adapter with a Supabase implementation without changing pages. */
export interface OpenWhenStateRepository {
  get(): Promise<OpenWhenState>;
  save(state: OpenWhenState): Promise<void>;
}
