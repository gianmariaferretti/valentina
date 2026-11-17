import type { GameProgress } from "../../games/types.ts";
import type {
  CouponWalletItem,
  CouponWalletState,
  ResolvedCoupon,
} from "../../coupons/types.ts";

export interface UnlockProgress {
  readonly coupon: CouponWalletItem;
  /** 0–99: the best run so far in the game that unlocks it. */
  readonly percent: number;
}

/**
 * The sealed coupons closest to opening: those won in a game, ranked by the
 * best progress reached in that game. Never 100% (that would be unlocked).
 */
export function closestToUnlock(
  items: readonly CouponWalletItem[],
  coupons: readonly ResolvedCoupon[],
  games: readonly GameProgress[],
  limit = 3,
): UnlockProgress[] {
  const challengeOf = new Map(coupons.map((c) => [c.id, c.challengeId]));
  return items
    .filter((item) => item.status === "locked")
    .map((item, index) => {
      const gameId = challengeOf.get(item.id);
      const best = gameId
        ? Math.max(
            0,
            ...games
              .filter((game) => game.gameId === gameId)
              .map((game) => game.progress),
          )
        : 0;
      const percent = Math.min(99, Math.max(0, Math.round(best)));
      return { coupon: item, percent, index, game: Boolean(gameId) };
    })
    .sort(
      (a, b) =>
        b.percent - a.percent ||
        Number(b.game) - Number(a.game) ||
        a.index - b.index,
    )
    .slice(0, limit)
    .map(({ coupon, percent }) => ({ coupon, percent }));
}

/**
 * Coupons unlocked or won most recently, newest first. Only coupons with a
 * known date: casino wins (won at) and catalogue unlocks (unlocked at).
 */
export function recentlyUnlocked(
  items: readonly CouponWalletItem[],
  coupons: readonly ResolvedCoupon[],
  state: CouponWalletState,
  limit = 8,
): { coupon: CouponWalletItem; at: string }[] {
  const byId = new Map(coupons.map((c) => [c.id, c]));
  return items
    .filter((item) => item.status === "available" || item.status === "redeemed")
    .flatMap((item) => {
      const source = byId.get(item.id);
      const at =
        item.source === "casino"
          ? source?.createdAt
          : state.unlockedAt?.[item.id];
      return at && !Number.isNaN(Date.parse(at)) ? [{ coupon: item, at }] : [];
    })
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit);
}

/** Whole days from today (local calendar) to an ISO instant; null if past. */
export function daysUntil(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const day = (d: Date) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86_400_000;
  const days = Math.round(day(target) - day(now));
  return days >= 0 ? days : null;
}

/** Coupons won or unlocked in the last `days` days and not used yet. */
export function freshCouponCount(
  items: readonly CouponWalletItem[],
  coupons: readonly ResolvedCoupon[],
  state: CouponWalletState,
  days = 7,
  now = Date.now(),
): number {
  const since = now - days * 86_400_000;
  return recentlyUnlocked(items, coupons, state, Infinity).filter(
    ({ coupon, at }) =>
      coupon.status === "available" && Date.parse(at) >= since,
  ).length;
}
