import { Suspense, type ReactNode } from "react";

import { redirect } from "next/navigation";

import { ProgressIndicator } from "@/components/layout/progress-indicator";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader, TabBar } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/toaster";
import { CasinoNavBadge } from "@/features/casino/components/casino-nav-badge";
import { CouponsNavBadge } from "@/features/coupons/components/coupons-nav-badge";
import { HeartListener } from "@/features/notifications/components/heart-listener";
import { MissYouButton } from "@/features/notifications/components/miss-you-button";
import { hasValidAccessSession } from "@/lib/auth/session";

export default async function ExperienceLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const isAuthorized = await hasValidAccessSession();

  if (!isAuthorized) redirect("/access");

  const casinoBadge = (
    <Suspense fallback={null}>
      <CasinoNavBadge />
    </Suspense>
  );
  const couponsBadge = (
    <Suspense fallback={null}>
      <CouponsNavBadge />
    </Suspense>
  );

  return (
    // --tabbar: room taken by the phone tab bar (0 on computers).
    <div className="flex min-h-svh flex-col [--tabbar:calc(4.25rem+env(safe-area-inset-bottom))] lg:[--tabbar:0px]">
      <SiteHeader
        casinoBadge={casinoBadge}
        couponsBadge={couponsBadge}
        progress={<ProgressIndicator />}
      />
      <main className="flex-1">{children}</main>
      <div className="pb-[var(--tabbar)]">
        <SiteFooter />
      </div>
      <TabBar casinoBadge={casinoBadge} couponsBadge={couponsBadge} />
      <Toaster />
      <MissYouButton />
      <HeartListener />
    </div>
  );
}
