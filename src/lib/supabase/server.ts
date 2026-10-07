import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database.types";

import { PersistenceError } from "../persistence/persistence-error";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface SupabaseServerContext {
  readonly client: SupabaseClient<Database>;
  readonly userId: string;
}

export function getSupabaseServerContext(): SupabaseServerContext {
  const url = process.env.SUPABASE_URL;
  const secretKey =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  const userId = process.env.SUPABASE_PRIMARY_USER_ID;

  if (!url || !secretKey || !userId || !UUID_PATTERN.test(userId)) {
    throw new PersistenceError(
      "Supabase is not configured. Set SUPABASE_URL, a server secret key, and SUPABASE_PRIMARY_USER_ID.",
    );
  }

  return {
    client: createClient<Database>(url, secretKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    }),
    userId,
  };
}

export function assertSupabaseResult(
  operation: string,
  error: { message: string } | null,
): void {
  if (error) throw new PersistenceError(operation, error);
}
