"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { clearAdminSession } from "@/lib/auth/admin-session";
import { PasskeysNotReady, revokePasskey } from "@/lib/auth/passkey-server";
import { revokeAllSessions } from "@/lib/auth/revocation";

import { done, failed, withAdmin, type AdminResult } from "./guard";

/** "Esci da tutti i dispositivi" — for Valentina's site or for this panel. */
export async function logoutEverywhere(scope: string): Promise<AdminResult> {
  const parsed = z.enum(["visitor", "admin"]).parse(scope);
  const result = await withAdmin("logout everywhere", async () => {
    await revokeAllSessions(parsed);
    return done(
      parsed === "visitor"
        ? "Fatto: Valentina deve reinserire il codice su ogni dispositivo"
        : "Fatto: sei uscito da tutti i dispositivi",
    );
  });
  if (result.ok && parsed === "admin") {
    await clearAdminSession();
    redirect("/admin");
  }
  return result;
}

/** "Revoca": that device can no longer unlock with Face ID. */
export async function revokePasskeyFromAdmin(id: string): Promise<AdminResult> {
  const parsed = z
    .string()
    .regex(/^[A-Za-z0-9_-]{16,1400}$/)
    .safeParse(id);
  if (!parsed.success) return failed("Passkey non trovata.");
  return withAdmin("revoke passkey", async () => {
    try {
      await revokePasskey(parsed.data);
    } catch (error) {
      if (error instanceof PasskeysNotReady)
        return failed(
          "Le passkey non sono ancora attive: applica la migration.",
        );
      throw error;
    }
    return done("Passkey revocata: quel dispositivo dovrà usare il codice");
  });
}
