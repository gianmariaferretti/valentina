import "server-only";

import { cache } from "react";

import { casinoWinToCoupon } from "@/features/casino/lib/casino-coupons";
import { toView, type CasinoView } from "@/features/casino/lib/engine";
import {
  getCasinoRepository,
  type LedgerRow,
} from "@/features/casino/repositories/casino-repository";
import { resolveCoupons } from "@/features/coupons/lib/coupon-domain";
import { SupabaseCouponStateRepository } from "@/features/coupons/repositories/supabase-coupon-state-repository";
import type { ResolvedCoupon } from "@/features/coupons/types";
import { SupabaseOpenWhenStateRepository } from "@/features/open-when/repositories/supabase-open-when-state-repository";
import { getSupabaseServerContext } from "@/lib/supabase/server";

import type { MergedLetter } from "../lib/merge-content";
import { loadAllLetters, loadCouponCatalogue } from "./content";

export interface AdminCoupon extends ResolvedCoupon {
  readonly deliveredAt: string | null;
  readonly source: "catalogue" | "casino";
  /** Created in the panel (not in the code). */
  readonly custom: boolean;
  /** Edited in the panel. */
  readonly edited: boolean;
}

async function loadDeliveries(): Promise<Map<string, string>> {
  const { client, userId } = getSupabaseServerContext();
  const { data, error } = await client
    .from("coupon_deliveries")
    .select("coupon_id, delivered_at")
    .eq("user_id", userId);
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.coupon_id, row.delivered_at]));
}

async function loadOverrideKeys(): Promise<Set<string>> {
  const { client } = getSupabaseServerContext();
  const { data, error } = await client
    .from("content_overrides")
    .select("key")
    .eq("kind", "coupon");
  if (error) throw error;
  return new Set((data ?? []).map((row) => row.key));
}

export const loadAdminCoupons = cache(async (): Promise<AdminCoupon[]> => {
  const { coupons: codeCoupons } = await import("@/data/coupons");
  const codeIds = new Set(codeCoupons.map((coupon) => coupon.id));
  const [catalogue, wins, state, deliveries, edited] = await Promise.all([
    loadCouponCatalogue(),
    getCasinoRepository()
      .listWins()
      .catch(() => []),
    new SupabaseCouponStateRepository().get(),
    loadDeliveries(),
    loadOverrideKeys(),
  ]);
  const casino = wins.flatMap((win) => {
    const coupon = casinoWinToCoupon(win);
    return coupon ? [coupon] : [];
  });
  return resolveCoupons([...catalogue, ...casino], state).map((coupon) => {
    const groupKey = coupon.series ? coupon.id.replace(/-\d+$/, "") : coupon.id;
    return {
      ...coupon,
      source: coupon.source === "casino" ? "casino" : "catalogue",
      deliveredAt: deliveries.get(coupon.id) ?? null,
      custom:
        coupon.source !== "casino" &&
        !codeIds.has(coupon.id) &&
        edited.has(groupKey),
      edited: edited.has(coupon.id) || edited.has(groupKey),
    };
  });
});

export async function loadCasinoAdmin(): Promise<{
  view: CasinoView | null;
  debt: number;
  stats: Record<string, number>;
  ledger: LedgerRow[];
  version: number;
  lastActivityAt: string | null;
}> {
  const repository = getCasinoRepository();
  const [stored, ledger] = await Promise.all([
    repository.load(),
    repository.listLedger().catch(() => []),
  ]);
  if (!stored)
    return {
      view: null,
      debt: 0,
      stats: {},
      ledger,
      version: 0,
      lastActivityAt: null,
    };
  return {
    view: toView(stored.state, new Date()),
    debt: stored.state.debt,
    stats: stored.state.stats as unknown as Record<string, number>,
    ledger,
    version: stored.version,
    lastActivityAt: stored.state.lastActivityAt,
  };
}

export interface AdminLetter extends MergedLetter {
  readonly openedAt: string | null;
}

export async function loadAdminLetters(): Promise<AdminLetter[]> {
  const [letters, state] = await Promise.all([
    loadAllLetters(),
    new SupabaseOpenWhenStateRepository().get(),
  ]);
  const opened = new Map(
    state.openedLetters.map((letter) => [letter.slug, letter.openedAt]),
  );
  return letters.map((letter) => ({
    ...letter,
    openedAt: opened.get(letter.slug) ?? null,
  }));
}

export interface ActivityItem {
  readonly at: string;
  readonly icon: string;
  readonly text: string;
  readonly href?: string;
}

/** What Valentina did lately, newest first. */
export async function loadActivity(limit = 40): Promise<ActivityItem[]> {
  const [coupons, letters, casino, logins] = await Promise.all([
    loadAdminCoupons(),
    loadAdminLetters(),
    loadCasinoAdmin().catch(() => null),
    loadAuthEvents(30).catch(() => []),
  ]);
  const items: ActivityItem[] = [];
  for (const coupon of coupons)
    if (coupon.redeemedAt)
      items.push({
        at: coupon.redeemedAt,
        icon: "🎟️",
        text: `Ha usato: ${coupon.title}`,
        href: "/admin/buoni?stato=da-consegnare",
      });
  for (const letter of letters)
    if (letter.openedAt)
      items.push({
        at: letter.openedAt,
        icon: "💌",
        text: `Ha aperto la lettera: ${letter.title}`,
        href: "/admin/lettere",
      });
  for (const coupon of coupons)
    if (coupon.source === "casino")
      items.push({
        at: coupon.createdAt,
        icon: "🎰",
        text: `Ha vinto al casinò: ${coupon.title}`,
        href: "/admin/casino",
      });
  for (const row of casino?.ledger ?? [])
    if (row.kind === "purchase" || row.kind === "piggy")
      items.push({
        at: row.at,
        icon: "💋",
        text: `Ha comprato 💋: ${row.label} (+${row.realKisses} baci veri)`,
        href: "/admin/casino",
      });
  if (casino?.lastActivityAt)
    items.push({
      at: casino.lastActivityAt,
      icon: "🎲",
      text: "Ha giocato al casinò",
      href: "/admin/casino",
    });
  for (const event of logins)
    if (event.scope === "visitor" && event.kind === "login")
      items.push({
        at: event.created_at,
        icon: "🔑",
        text: `È entrata nel sito (${event.detail ?? "dispositivo"})`,
        href: "/admin/sicurezza",
      });
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

export interface AuthEventRow {
  id: number;
  scope: string;
  kind: string;
  detail: string | null;
  created_at: string;
}

export async function loadAuthEvents(limit = 60): Promise<AuthEventRow[]> {
  const { client } = getSupabaseServerContext();
  const { data, error } = await client
    .from("auth_events")
    .select("id, scope, kind, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function loadContractRewardRequest(): Promise<string | null> {
  const { client, userId } = getSupabaseServerContext();
  const { data } = await client
    .from("relationship_contracts")
    .select("reward_requested_at")
    .eq("user_id", userId)
    .not("reward_requested_at", "is", null)
    .maybeSingle();
  return data?.reward_requested_at ?? null;
}
