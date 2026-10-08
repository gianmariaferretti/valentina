import { coupons } from "@/data/coupons";
import {
  getCouponWalletStats,
  resolveCoupons,
} from "@/features/coupons/lib/coupon-domain";
import { loadCouponState } from "@/features/coupons/repositories/get-coupon-state-repository";
import { loadSiteProgress } from "@/lib/persistence/get-progress-repository";

function formatCount(value: number): string {
  return String(Math.max(0, value)).padStart(2, "0");
}

export async function ProgressIndicator() {
  const [siteProgress, couponState] = await Promise.all([
    loadSiteProgress(),
    loadCouponState(),
  ]);
  const couponStats = getCouponWalletStats(
    resolveCoupons(coupons, couponState),
  );
  const progressItems = [
    {
      label: "Memories discovered",
      shortLabel: "Memories",
      value: formatCount(siteProgress.memoriesDiscovered),
    },
    {
      label: "Coupons discovered",
      shortLabel: "Coupons",
      value: formatCount(couponStats.discovered),
    },
    {
      label: "Achievements",
      shortLabel: "Awards",
      value: formatCount(siteProgress.achievementCount),
    },
  ];

  return (
    <aside
      aria-label="Year One progress"
      className="border-t border-[var(--line)]"
    >
      <div className="mx-auto flex min-h-11 max-w-[92rem] items-stretch px-5 sm:px-8">
        <p className="flex shrink-0 items-center pr-3 text-[0.54rem] font-bold tracking-[0.14em] uppercase sm:pr-5">
          <span className="mr-2 size-1.5 rounded-full bg-[var(--rust)]" />
          Year One
        </p>
        <dl className="ml-auto grid min-w-0 grid-cols-3">
          {progressItems.map((item) => (
            <div
              className="flex min-w-0 items-center gap-1.5 border-l border-[var(--line)] px-2 sm:gap-2 sm:px-4"
              key={item.label}
            >
              <dd className="font-mono text-[0.66rem] font-semibold text-[var(--rust)] sm:text-xs">
                {item.value}
              </dd>
              <dt className="truncate text-[0.46rem] font-semibold tracking-[0.08em] text-[var(--muted)] uppercase sm:text-[0.52rem]">
                <span className="md:hidden">{item.shortLabel}</span>
                <span className="hidden md:inline">{item.label}</span>
              </dt>
            </div>
          ))}
        </dl>
      </div>
    </aside>
  );
}
