"use server";

import { z } from "zod";

import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";
import { getSupabaseServerContext } from "@/lib/supabase/server";

import { recordMissYou } from "../notify";

export interface MissYouResult {
  readonly ok: boolean;
  /** Taps carried by the email that just left (0 = bundled into the next one). */
  readonly emailed: number;
}

/** Valentina's "Miss you" heart. */
export async function sendMissYou(): Promise<MissYouResult> {
  if (!(await hasValidAccessSession())) return { ok: false, emailed: 0 };
  try {
    const result = await recordMissYou();
    return { ok: true, emailed: result.status === "sent" ? result.emailed : 0 };
  } catch (error) {
    reportPersistenceFailure("miss you", error);
    return { ok: false, emailed: 0 };
  }
}

/** The big heart has been seen: don't show it again. */
export async function markHeartSeen(id: unknown): Promise<void> {
  if (!(await hasValidAccessSession())) return;
  const parsed = z.string().uuid().safeParse(id);
  if (!parsed.success) return;
  try {
    const { client } = getSupabaseServerContext();
    await client
      .from("hearts")
      .update({ seen_at: new Date().toISOString() })
      .eq("id", parsed.data)
      .is("seen_at", null);
  } catch (error) {
    reportPersistenceFailure("mark heart seen", error);
  }
}
