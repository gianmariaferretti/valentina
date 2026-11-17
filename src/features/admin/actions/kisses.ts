"use server";

import { kissAmountsSchema } from "@/features/kisses/lib/rewards";
import { KISS_SETTING_KEY } from "@/features/kisses/repositories/kisses";

import { deleteOverride, upsertOverride } from "../repositories/content";
import { done, failed, withAdmin, type AdminResult } from "./guard";

/** How many 💋 each event on the site pays (0 switches it off). */
export async function saveKissAmounts(form: FormData): Promise<AdminResult> {
  return withAdmin("kiss amounts", async () => {
    const parsed = kissAmountsSchema.safeParse(Object.fromEntries(form));
    if (!parsed.success)
      return failed("Ogni importo deve essere un numero intero da 0 a 1000.");
    await upsertOverride("setting", KISS_SETTING_KEY, parsed.data);
    return done("Importi dei 💋 salvati");
  });
}

/** Back to the amounts in src/data/kiss-rewards.ts. */
export async function restoreKissAmounts(): Promise<AdminResult> {
  return withAdmin("restore kiss amounts", async () => {
    await deleteOverride("setting", KISS_SETTING_KEY);
    return done("Importi originali ripristinati");
  });
}
