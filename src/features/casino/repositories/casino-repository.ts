import "server-only";

import type { Json } from "@/lib/supabase/database.types";
import { PersistenceError } from "@/lib/persistence/persistence-error";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";

import type { CasinoWinRecord } from "../lib/casino-coupons";
import {
  normalizeState,
  type CasinoState,
  type CouponGrant,
  type LedgerEntry,
  type LedgerKind,
} from "../lib/engine";

export interface StoredCasino {
  readonly state: CasinoState;
  readonly version: number;
}

export interface LedgerRow {
  readonly id: string;
  readonly season: number;
  readonly kind: LedgerKind;
  readonly realKisses: number;
  readonly chips: number;
  readonly label: string;
  readonly at: string;
}

export class CasinoConflictError extends Error {}

export interface CasinoRepository {
  load(): Promise<StoredCasino | null>;
  commit(
    expectedVersion: number,
    state: CasinoState,
    grants: readonly CouponGrant[],
    ledger: readonly LedgerEntry[],
  ): Promise<number>;
  listWins(): Promise<CasinoWinRecord[]>;
  listLedger(): Promise<LedgerRow[]>;
  /**
   * Redeems a casino coupon and starts a fresh season in one transaction.
   * Returns the saved redemption time.
   */
  redeemWithReset(
    couponId: string,
    redeemedAt: string,
    expectedVersion: number,
    freshState: CasinoState,
    resetDebt: boolean,
  ): Promise<string>;
}

class SupabaseCasinoRepository implements CasinoRepository {
  async load(): Promise<StoredCasino | null> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("casino_state")
      .select("version, state")
      .eq("user_id", userId)
      .maybeSingle();
    assertSupabaseResult("Unable to load the Kiss Casino.", error);
    return data
      ? { state: normalizeState(data.state), version: data.version }
      : null;
  }

  async commit(
    expectedVersion: number,
    state: CasinoState,
    grants: readonly CouponGrant[],
    ledger: readonly LedgerEntry[],
  ): Promise<number> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc("commit_casino_state", {
      p_user_id: userId,
      p_expected_version: expectedVersion,
      p_balance: state.balance,
      p_debt: state.debt,
      p_state: state as unknown as Json,
      p_wins: grants as unknown as Json,
      p_ledger: ledger as unknown as Json,
    });
    if (error?.message.includes("casino_version_conflict"))
      throw new CasinoConflictError(error.message);
    assertSupabaseResult("Unable to save the Kiss Casino.", error);
    if (typeof data !== "number")
      throw new PersistenceError("Kiss Casino state was not saved.");
    return data;
  }

  async listWins(): Promise<CasinoWinRecord[]> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("casino_wins")
      .select("coupon_id, code, prize_id, won_at")
      .eq("user_id", userId)
      .order("won_at", { ascending: true });
    assertSupabaseResult("Unable to load Kiss Casino wins.", error);
    return (data ?? []).map((row) => ({
      couponId: row.coupon_id,
      code: row.code,
      prizeId: row.prize_id,
      wonAt: row.won_at,
    }));
  }

  async listLedger(): Promise<LedgerRow[]> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("casino_ledger")
      .select("id, kind, real_kisses, chips, label, created_at, season")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);
    assertSupabaseResult("Unable to load the kiss ledger.", error);
    return (data ?? []).map((row) => ({
      id: String(row.id),
      season: row.season,
      kind: row.kind as LedgerKind,
      realKisses: row.real_kisses,
      chips: row.chips,
      label: row.label,
      at: row.created_at,
    }));
  }

  async redeemWithReset(
    couponId: string,
    redeemedAt: string,
    expectedVersion: number,
    freshState: CasinoState,
    resetDebt: boolean,
  ): Promise<string> {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc(
      "redeem_casino_coupon_with_reset",
      {
        p_user_id: userId,
        p_coupon_id: couponId,
        p_redeemed_at: redeemedAt,
        p_expected_version: expectedVersion,
        p_balance: freshState.balance,
        p_state: freshState as unknown as Json,
        p_reset_debt: resetDebt,
      },
    );
    if (error?.message.includes("casino_version_conflict"))
      throw new CasinoConflictError(error.message);
    assertSupabaseResult("Unable to redeem the casino coupon.", error);
    const saved = data?.[0]?.redeemed_at;
    if (!saved)
      throw new PersistenceError("Casino coupon redemption was not saved.");
    return saved;
  }
}

/**
 * Development-only fallback when Supabase is not configured: state lives in
 * server memory (kept across hot reloads) and disappears on restart.
 */
interface MemoryStore {
  stored: StoredCasino | null;
  wins: CasinoWinRecord[];
  ledger: LedgerRow[];
}

const memoryKey = Symbol.for("vg.kiss-casino.memory");

function memory(): MemoryStore {
  const holder = globalThis as unknown as Record<symbol, MemoryStore>;
  holder[memoryKey] ??= { stored: null, wins: [], ledger: [] };
  return holder[memoryKey];
}

class MemoryCasinoRepository implements CasinoRepository {
  async load() {
    const stored = memory().stored;
    return stored ? structuredClone(stored) : null;
  }

  async commit(
    expectedVersion: number,
    state: CasinoState,
    grants: readonly CouponGrant[],
    ledger: readonly LedgerEntry[],
  ) {
    const store = memory();
    const currentVersion = store.stored?.version ?? 0;
    if (currentVersion !== expectedVersion)
      throw new CasinoConflictError("casino_version_conflict");
    const currentDebt = store.stored?.state.debt ?? 0;
    const delta = ledger.reduce((sum, entry) => sum + entry.realKisses, 0);
    if (state.debt !== currentDebt + delta || state.balance < 0)
      throw new PersistenceError("Casino debt does not match its ledger.");
    for (const entry of ledger)
      store.ledger.unshift({
        id: `${Date.now()}-${store.ledger.length}`,
        season: state.season,
        kind: entry.kind,
        realKisses: entry.realKisses,
        chips: entry.chips,
        label: entry.label,
        at: entry.at,
      });
    for (const grant of grants)
      store.wins.push({
        couponId: grant.couponId,
        code: grant.code,
        prizeId: grant.prizeId,
        wonAt: grant.wonAt,
      });
    store.stored = {
      state: structuredClone(state),
      version: currentVersion + 1,
    };
    return currentVersion + 1;
  }

  async listWins() {
    return [...memory().wins];
  }

  async listLedger() {
    return [...memory().ledger];
  }

  async redeemWithReset(): Promise<string> {
    // Coupon redemptions always live in Supabase.
    throw new PersistenceError(
      "Redeeming needs Supabase; the in-memory casino cannot redeem coupons.",
    );
  }
}

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL &&
    (process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY) &&
    process.env.SUPABASE_PRIMARY_USER_ID,
  );
}

export function getCasinoRepository(): CasinoRepository {
  if (isSupabaseConfigured()) return new SupabaseCasinoRepository();
  if (process.env.NODE_ENV !== "production")
    return new MemoryCasinoRepository();
  throw new PersistenceError(
    "The Kiss Casino needs Supabase. Configure the server-only Supabase variables.",
  );
}

/** True when wins live only in development memory (not in coupon_state). */
export function isCasinoMemoryFallback(): boolean {
  return !isSupabaseConfigured() && process.env.NODE_ENV !== "production";
}
