/**
 * "Log out of every device": each scope stores an instant, and every session
 * issued (logged in) before it is rejected. Read by the proxy and the server,
 * cached briefly in memory so a page view costs no extra query most of the
 * time. Without Supabase (local development) nothing is ever revoked.
 */

import { createClient } from "@supabase/supabase-js";

export type SessionScope = "visitor" | "admin";

const CACHE_MS = 30_000;
const cache = new Map<SessionScope, { value: number; at: number }>();

function client() {
  const url = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

/** Unix seconds; sessions issued before this are revoked. 0 = none. */
export async function getRevokedBefore(scope: SessionScope): Promise<number> {
  const hit = cache.get(scope);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;
  const supabase = client();
  if (!supabase) return 0;
  try {
    const { data, error } = await supabase
      .from("auth_revocations")
      .select("revoked_before")
      .eq("scope", scope)
      .maybeSingle();
    if (error) throw error;
    const value = data?.revoked_before
      ? Math.floor(new Date(data.revoked_before as string).getTime() / 1000)
      : 0;
    cache.set(scope, { value, at: Date.now() });
    return value;
  } catch {
    // If the lookup fails, keep the last known value (signatures and
    // expiry are still checked).
    return hit?.value ?? 0;
  }
}

export async function revokeAllSessions(scope: SessionScope): Promise<void> {
  const supabase = client();
  if (!supabase) throw new Error("Supabase is not configured.");
  // Whole seconds, rounded up: every token issued up to now is covered.
  const now = new Date((Math.floor(Date.now() / 1000) + 1) * 1000);
  const { error } = await supabase.rpc("revoke_all_sessions", {
    p_scope: scope,
    p_revoked_before: now.toISOString(),
  });
  if (error) throw error;
  cache.set(scope, { value: Math.floor(now.getTime() / 1000), at: Date.now() });
}

/** Tests only. */
export function clearRevocationCache() {
  cache.clear();
}
