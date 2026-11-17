"use server";

import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

import { syncSiteKisses, takeKissAnnouncements } from "./repositories/kisses";

export interface KissAnnouncement {
  readonly amount: number;
  readonly label: string;
}

/**
 * Pays whatever the site owes (server-side, once per event) and returns the
 * credits not shown yet, for the toast. No input: nothing to validate.
 */
export async function collectKisses(): Promise<KissAnnouncement[]> {
  if (!(await hasValidAccessSession())) return [];
  try {
    await syncSiteKisses();
  } catch (error) {
    reportPersistenceFailure("sync site kisses", error);
  }
  try {
    return (await takeKissAnnouncements()).map(({ amount, label }) => ({
      amount,
      label,
    }));
  } catch (error) {
    reportPersistenceFailure("announce site kisses", error);
    return [];
  }
}
