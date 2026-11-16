import "server-only";

import { cache } from "react";

import type { Coupon } from "@/features/coupons/types";
import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

import {
  casinoWinToCoupon,
  CASINO_COUPON_PATTERN,
} from "../lib/casino-coupons";
import {
  createInitialState,
  hasPendingRewards,
  type CasinoState,
} from "../lib/engine";
import { getCasinoRepository, type LedgerRow } from "./casino-repository";

export interface CasinoSnapshot {
  readonly state: CasinoState;
  readonly failed: boolean;
}

export const loadCasinoSnapshot = cache(
  async function loadCasinoSnapshot(): Promise<CasinoSnapshot> {
    if (!(await hasValidAccessSession()))
      return { state: createInitialState(), failed: true };
    try {
      const stored = await getCasinoRepository().load();
      return { state: stored?.state ?? createInitialState(), failed: false };
    } catch (error) {
      reportPersistenceFailure("load kiss casino", error);
      return { state: createInitialState(), failed: true };
    }
  },
);

/** Casino wins as wallet coupons. Fails closed to an empty list. */
export const loadCasinoCoupons = cache(
  async function loadCasinoCoupons(): Promise<readonly Coupon[]> {
    if (!(await hasValidAccessSession())) return [];
    try {
      const wins = await getCasinoRepository().listWins();
      return wins.flatMap((win) => {
        const coupon = casinoWinToCoupon(win);
        return coupon ? [coupon] : [];
      });
    } catch (error) {
      reportPersistenceFailure("load kiss casino coupons", error);
      return [];
    }
  },
);

export async function findCasinoCoupon(
  id: string,
): Promise<Coupon | undefined> {
  if (!CASINO_COUPON_PATTERN.test(id)) return undefined;
  return (await loadCasinoCoupons()).find((coupon) => coupon.id === id);
}

export async function loadCasinoLedger(): Promise<{
  rows: LedgerRow[];
  failed: boolean;
}> {
  if (!(await hasValidAccessSession())) return { rows: [], failed: true };
  try {
    return { rows: await getCasinoRepository().listLedger(), failed: false };
  } catch (error) {
    reportPersistenceFailure("load kiss ledger", error);
    return { rows: [], failed: true };
  }
}

export async function loadCasinoBadge(): Promise<boolean> {
  const snapshot = await loadCasinoSnapshot();
  if (snapshot.failed) return false;
  return hasPendingRewards(snapshot.state, new Date());
}
