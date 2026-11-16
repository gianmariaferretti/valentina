"use server";

import { randomInt } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { casinoConfig, scratchTiers } from "@/data/casino-config";
import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

import {
  blackjackDeal,
  blackjackHit,
  blackjackStand,
  breakPiggy,
  buyPack,
  CasinoRuleError,
  claimPassTier,
  claimFinale,
  claimMission,
  claimWelcome,
  createInitialState,
  declineDouble,
  doubleOrNothing,
  enterCasino,
  finishWelcome,
  payDebt,
  scratchCard,
  spinRoulette,
  spinSlots,
  spinWheel,
  toView,
  type CasinoEvent,
  type CasinoState,
  type CasinoView,
  type Rng,
  type StepResult,
} from "./lib/engine";
import {
  CasinoConflictError,
  getCasinoRepository,
} from "./repositories/casino-repository";

export type CasinoActionResult =
  | { ok: true; view: CasinoView; event: CasinoEvent; debt: number }
  | { ok: false; message: string; view?: CasinoView };

/** Cryptographically secure draws. The client never decides an outcome. */
const secureRng: Rng = (maxExclusive) => randomInt(Math.max(1, maxExclusive));

type Step = (state: CasinoState, rng: Rng, now: Date) => StepResult;

async function run(
  step: Step,
  revalidate: readonly string[] = [],
  /** Refresh the menu badge (something claimable may have changed). */
  badge = false,
): Promise<CasinoActionResult> {
  if (!(await hasValidAccessSession()))
    return { ok: false, message: "Your private session has expired." };
  try {
    const repository = getCasinoRepository();
    for (let attempt = 0; attempt < 3; attempt++) {
      const stored = await repository.load();
      const state = stored?.state ?? createInitialState();
      const now = new Date();
      let result: StepResult;
      try {
        result = step(state, secureRng, now);
      } catch (error) {
        if (error instanceof CasinoRuleError)
          return {
            ok: false,
            message: error.message,
            view: toView(state, now),
          };
        throw error;
      }
      try {
        await repository.commit(
          stored?.version ?? 0,
          result.state,
          result.grants,
          result.ledger,
        );
      } catch (error) {
        if (error instanceof CasinoConflictError) continue;
        throw error;
      }
      const paths = new Set(revalidate);
      if (result.grants.length > 0) paths.add("/coupons");
      for (const path of paths) revalidatePath(path);
      if (badge) revalidatePath("/", "layout");
      return {
        ok: true,
        view: toView(result.state, now),
        event: result.event,
        debt: result.state.debt,
      };
    }
    return {
      ok: false,
      message: "Another tab was playing at the same time. Try again.",
    };
  } catch (error) {
    reportPersistenceFailure("kiss casino", error);
    return {
      ok: false,
      message: "The casino could not save that. Nothing was charged.",
    };
  }
}

const invalid: CasinoActionResult = {
  ok: false,
  message: "The croupier did not understand that request.",
};

const bets: readonly number[] = casinoConfig.slots.bets;
const betSchema = z
  .number()
  .int()
  .refine((bet) => bets.includes(bet));
const scratchSchema = z.enum(scratchTiers);
const packSchema = z.string().regex(/^[a-z0-9-]{1,40}$/);
const missionSchema = z.string().regex(/^[a-z0-9-]{1,40}$/);
const paymentSchema = z.number().int().min(1).max(100_000);

export async function enterKissCasino() {
  return run(enterCasino);
}

export async function spinLoveSlots(bet: unknown) {
  const parsed = betSchema.safeParse(bet);
  if (!parsed.success) return invalid;
  return run((state, rng, now) => spinSlots(state, parsed.data, rng, now));
}

export async function scratchTicket(tier: unknown) {
  const parsed = scratchSchema.safeParse(tier);
  if (!parsed.success) return invalid;
  return run((state, rng, now) => scratchCard(state, parsed.data, rng, now));
}

export async function spinFortuneWheel() {
  return run(spinWheel, [], true);
}

export async function doubleIt() {
  return run(doubleOrNothing);
}

export async function keepWinnings() {
  return run(declineDouble);
}

export async function buyKissPack(packId: unknown) {
  const parsed = packSchema.safeParse(packId);
  if (!parsed.success) return invalid;
  return run(
    (state, rng, now) => buyPack(state, parsed.data, rng, now),
    ["/coupons/casino/debt"],
    true,
  );
}

export async function breakPiggyBank() {
  return run(breakPiggy, ["/coupons/casino/debt"]);
}

export async function collectWelcomeBonus() {
  return run(claimWelcome, [], true);
}

export async function collectMission(missionId: unknown) {
  const parsed = missionSchema.safeParse(missionId);
  if (!parsed.success) return invalid;
  return run((state, rng, now) => claimMission(state, parsed.data, rng, now));
}

export async function recordKissPayment(kisses: unknown) {
  const parsed = paymentSchema.safeParse(kisses);
  if (!parsed.success)
    return { ok: false, message: "Enter a whole number of kisses." } as const;
  return run(
    (state, _rng, now) => payDebt(state, parsed.data, now),
    ["/coupons/casino/debt"],
  );
}

export async function claimHouseAlwaysLoses() {
  return run(
    (state, _rng, now) => claimFinale(state, now),
    ["/coupons/casino/debt", "/coupons/casino/behind-the-curtain"],
  );
}

const rouletteSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("color"), value: z.enum(["red", "black"]) }),
  z.object({ kind: z.literal("parity"), value: z.enum(["even", "odd"]) }),
  z.object({
    kind: z.literal("number"),
    value: z.number().int().min(0).max(36),
  }),
]);
const tableBets: readonly number[] = casinoConfig.roulette.bets;
const tableBetSchema = z
  .number()
  .int()
  .refine((bet) => tableBets.includes(bet));

export async function spinKissRoulette(bet: unknown, placed: unknown) {
  const parsedBet = tableBetSchema.safeParse(bet);
  const parsedPlaced = rouletteSchema.safeParse(placed);
  if (!parsedBet.success || !parsedPlaced.success) return invalid;
  return run((state, rng, now) =>
    spinRoulette(state, parsedBet.data, parsedPlaced.data, rng, now),
  );
}

export async function dealBlackjack(bet: unknown) {
  const parsed = tableBetSchema.safeParse(bet);
  if (!parsed.success) return invalid;
  return run((state, rng, now) => blackjackDeal(state, parsed.data, rng, now));
}

export async function hitBlackjack() {
  return run(blackjackHit);
}

export async function standBlackjack() {
  return run(blackjackStand);
}

export async function collectKissPass() {
  return run(claimPassTier);
}

export async function completeWelcome() {
  return run((state) => finishWelcome(state));
}
