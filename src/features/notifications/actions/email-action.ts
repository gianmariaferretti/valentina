"use server";

import { z } from "zod";

import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";
import { getSupabaseServerContext } from "@/lib/supabase/server";

import { sendHeart } from "../notify";
import { consumeActionToken } from "../repositories/action-tokens";

export interface EmailActionResult {
  readonly ok: boolean;
  readonly message: string;
}

/**
 * Runs the action of a signed email link, once. Works without the admin
 * session, but only for the action the link was signed for.
 */
export async function confirmEmailAction(
  token: unknown,
): Promise<EmailActionResult> {
  const parsed = z.string().max(200).safeParse(token);
  if (!parsed.success) return { ok: false, message: "Link non valido." };
  try {
    const action = await consumeActionToken(parsed.data);
    if (!action)
      return { ok: false, message: "Link già usato, scaduto o non valido." };
    if (action.action === "deliver") {
      const couponId = z
        .string()
        .regex(/^[a-z0-9-]{1,100}$/)
        .parse(action.payload.couponId);
      const { client, userId } = getSupabaseServerContext();
      const { error } = await client
        .from("coupon_deliveries")
        .upsert(
          { user_id: userId, coupon_id: couponId },
          { onConflict: "user_id,coupon_id" },
        );
      if (error) throw error;
      // No revalidatePath: it would re-render this page as "already used"
      // before the confirmation shows. Admin pages are dynamic anyway.
      return {
        ok: true,
        message: `Segnato come consegnato: ${action.payload.title} ✅`,
      };
    }
    await sendHeart(null, "email");
    return {
      ok: true,
      message: "Cuore inviato ❤️ Lo vedrà appena apre il sito.",
    };
  } catch (error) {
    reportPersistenceFailure("email action", error);
    return {
      ok: false,
      message: "Non sono riuscito a completare l'azione. Riprova.",
    };
  }
}
