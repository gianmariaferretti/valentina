import { loadCouponCatalogue } from "@/features/admin/repositories/content";
import { loadCasinoCoupons } from "@/features/casino/repositories/load-casino";
import {
  createWalletItem,
  isVisibleInWallet,
  resolveCoupons,
} from "@/features/coupons/lib/coupon-domain";
import { loadCouponState } from "@/features/coupons/repositories/get-coupon-state-repository";
import { freshCouponCount } from "@/features/home/lib/home-wallet";

/** Number of coupons won or unlocked this week and not used yet. */
export async function CouponsNavBadge() {
  const [state, catalogue, casino] = await Promise.all([
    loadCouponState(),
    loadCouponCatalogue(),
    loadCasinoCoupons(),
  ]);
  const resolved = resolveCoupons([...catalogue, ...casino], state).filter(
    isVisibleInWallet,
  );
  const fresh = freshCouponCount(
    resolved.map(createWalletItem),
    resolved,
    state,
  );
  if (!fresh) return null;
  return (
    <span className="ml-1.5 inline-grid h-4.5 min-w-4.5 place-items-center rounded-full bg-[#d6283e] px-1 align-middle text-[0.6rem] leading-none font-bold text-white ring-2 ring-[var(--paper)]">
      {fresh > 9 ? "9+" : fresh}
      <span className="sr-only"> new coupons</span>
    </span>
  );
}
