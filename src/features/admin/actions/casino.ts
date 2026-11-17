"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { casinoConfig } from "@/data/casino-config";
import {
  CasinoRuleError,
  createInitialState,
  payDebt,
  resetCasino,
  type CasinoState,
} from "@/features/casino/lib/engine";
import {
  CasinoConflictError,
  getCasinoRepository,
} from "@/features/casino/repositories/casino-repository";
import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseServerContext } from "@/lib/supabase/server";

import { curtainMessageSchema } from "../lib/content-schemas";
import { deleteOverride, upsertOverride } from "../repositories/content";
import { done, failed, withAdmin, type AdminResult } from "./guard";

function refresh() {
  revalidatePath("/", "layout");
}

/** Loads, changes and saves the casino, retrying if Valentina is playing. */
async function update(
  change: (state: CasinoState) => {
    state: CasinoState;
    ledger?: Parameters<ReturnType<typeof getCasinoRepository>["commit"]>[3];
  },
): Promise<CasinoState> {
  const repository = getCasinoRepository();
  for (let attempt = 0; attempt < 3; attempt++) {
    const stored = await repository.load();
    const current = stored?.state ?? createInitialState();
    const next = change(structuredClone(current));
    try {
      await repository.commit(
        stored?.version ?? 0,
        next.state,
        [],
        next.ledger ?? [],
      );
      return next.state;
    } catch (error) {
      if (error instanceof CasinoConflictError) continue;
      throw error;
    }
  }
  throw new Error("The casino kept changing while saving.");
}

const deltaSchema = z.number().int().min(-100_000).max(100_000);

export async function adjustKisses(delta: number): Promise<AdminResult> {
  return withAdmin("adjust kisses", async () => {
    const amount = deltaSchema.parse(delta);
    if (amount === 0) return failed("Scrivi quanti 💋 aggiungere o togliere.");
    const state = await update((current) => {
      current.balance = Math.max(0, current.balance + amount);
      return { state: current };
    });
    refresh();
    return done(
      `${amount > 0 ? `+${amount}` : amount} 💋 · saldo ${state.balance}`,
    );
  });
}

export async function markKissesPaid(kisses: number): Promise<AdminResult> {
  return withAdmin("mark kisses paid", async () => {
    const amount = z.number().int().min(1).max(100_000).parse(kisses);
    try {
      const state = await update((current) => {
        const step = payDebt(current, amount, new Date());
        return { state: step.state, ledger: step.ledger };
      });
      refresh();
      return done(
        `Segnati ${amount} baci pagati · ancora dovuti: ${state.debt}`,
      );
    } catch (error) {
      if (error instanceof CasinoRuleError)
        return failed("Non ti deve baci in questo momento.");
      throw error;
    }
  });
}

export async function setCurtainUnlocked(
  unlocked: boolean,
): Promise<AdminResult> {
  return withAdmin("curtain", async () => {
    await update((current) => {
      current.curtain.unlocked = unlocked;
      return { state: current };
    });
    refresh();
    return done(
      unlocked
        ? "Behind the Curtain sbloccato 🎭"
        : "Behind the Curtain bloccato",
    );
  });
}

export async function resetCasinoFromAdmin(): Promise<AdminResult> {
  return withAdmin("reset casino", async () => {
    const repository = getCasinoRepository();
    for (let attempt = 0; attempt < 3; attempt++) {
      const stored = await repository.load();
      if (!stored) return done("Il casinò è già nuovo di zecca");
      const fresh = resetCasino(stored.state);
      const { client, userId } = getSupabaseServerContext();
      const { error } = await client.rpc("admin_reset_casino", {
        p_user_id: userId,
        p_expected_version: stored.version,
        p_balance: fresh.balance,
        p_state: fresh as unknown as Json,
        p_reset_debt: casinoConfig.reset.resetDebtOnReset,
      });
      if (error?.message.includes("casino_version_conflict")) continue;
      if (error) throw error;
      refresh();
      return done(`Casinò resettato: inizia la stagione ${fresh.season} 🎰`);
    }
    return failed("Lei sta giocando proprio ora: riprova tra un attimo.");
  });
}

export async function saveCurtainMessage(form: FormData): Promise<AdminResult> {
  return withAdmin("curtain message", async () => {
    const parsed = curtainMessageSchema.safeParse({
      paragraphs: String(form.get("paragraphs") ?? "")
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
      signoff: String(form.get("signoff") ?? ""),
    });
    if (!parsed.success)
      return failed("Scrivi almeno un paragrafo e la firma.");
    await upsertOverride("setting", "curtain-message", parsed.data);
    return done("Messaggio salvato ✍️");
  });
}

export async function restoreCurtainMessage(): Promise<AdminResult> {
  return withAdmin("restore curtain message", async () => {
    await deleteOverride("setting", "curtain-message");
    return done("Tornato al messaggio del codice");
  });
}

/** "Annulla" for adjustKisses. */
export async function undoAdjustKisses(delta: number): Promise<AdminResult> {
  return adjustKisses(-deltaSchema.parse(delta));
}
