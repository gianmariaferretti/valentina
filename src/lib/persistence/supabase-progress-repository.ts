import "server-only";

import type { ProgressRepository } from "@/lib/persistence/progress-repository";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";
import type { SiteProgressState } from "@/types/progress";

export class SupabaseProgressRepository implements ProgressRepository {
  async get(): Promise<SiteProgressState> {
    const { client, userId } = getSupabaseServerContext();
    const [progressResult, achievementsResult, discoveriesResult] =
      await Promise.all([
        client
          .from("site_progress")
          .select("memories_discovered, last_visited_at")
          .eq("user_id", userId)
          .maybeSingle(),
        client
          .from("achievements")
          .select("achievement_id", { count: "exact", head: true })
          .eq("user_id", userId),
        client
          .from("discoveries")
          .select("discovery_id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

    assertSupabaseResult("Unable to load site progress.", progressResult.error);
    assertSupabaseResult(
      "Unable to count achievements.",
      achievementsResult.error,
    );
    assertSupabaseResult(
      "Unable to count discoveries.",
      discoveriesResult.error,
    );

    return {
      memoriesDiscovered: progressResult.data?.memories_discovered ?? 0,
      achievementCount: achievementsResult.count ?? 0,
      discoveryCount: discoveriesResult.count ?? 0,
      lastVisitedAt: progressResult.data?.last_visited_at ?? null,
    };
  }

  async setMemoriesDiscovered(count: number): Promise<void> {
    const { client, userId } = getSupabaseServerContext();
    const visitedAt = new Date().toISOString();
    const { error } = await client.from("site_progress").upsert(
      {
        user_id: userId,
        memories_discovered: Math.max(0, Math.floor(count)),
        last_visited_at: visitedAt,
      },
      { onConflict: "user_id" },
    );
    assertSupabaseResult("Unable to save site progress.", error);
  }
}
