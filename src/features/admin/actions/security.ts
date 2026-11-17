"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { clearAdminSession } from "@/lib/auth/admin-session";
import { revokeAllSessions } from "@/lib/auth/revocation";

import { done, withAdmin, type AdminResult } from "./guard";

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
