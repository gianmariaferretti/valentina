import "server-only";

import { readAdminSession } from "@/lib/auth/admin-session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

export interface AdminResult {
  readonly ok: boolean;
  readonly message: string;
}

export const failed = (message: string): AdminResult => ({
  ok: false,
  message,
});
export const done = (message: string): AdminResult => ({ ok: true, message });

/**
 * Every panel action: admin session first (Data Access Layer), then the work.
 * Errors become an honest message instead of a crash.
 */
export async function withAdmin(
  label: string,
  work: () => Promise<AdminResult>,
): Promise<AdminResult> {
  if (!(await readAdminSession()))
    return failed("Sessione scaduta: rientra nel pannello.");
  try {
    return await work();
  } catch (error) {
    reportPersistenceFailure(`admin: ${label}`, error);
    return failed("Non sono riuscito a salvare. Riprova tra poco.");
  }
}
