import type { Metadata } from "next";

import { TicketCard } from "@/components/design-system";
import { PageIntro } from "@/components/ui/page-intro";
import { coupons } from "@/data/coupons";

export const metadata: Metadata = {
  title: "Coupons",
};

export default function CouponsPage() {
  return (
    <div className="page-container py-10 sm:py-14 lg:py-20">
      <PageIntro
        aside={
          <div className="mt-5 flex gap-2 text-[0.62rem] font-semibold tracking-[0.13em] uppercase">
            <span className="rounded-full border border-[var(--line)] px-3 py-1.5">
              03 drafted
            </span>
            <span className="rounded-full border border-[var(--line)] px-3 py-1.5">
              01 impossible
            </span>
          </div>
        }
        description="Some are useful. Some are dangerous. One would bankrupt the finance department, which currently consists of one nervous Italian."
        eyebrow="Valentina’s private wallet"
        title="Coupons, with terms and conditions-ish."
      />

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 sm:mt-12">
        {coupons.map((coupon) => (
          <TicketCard
            code={coupon.code}
            description={coupon.description}
            eyebrow={coupon.category}
            href={`/coupons/${coupon.id}`}
            key={coupon.id}
            status={coupon.isImpossible ? "Legendary" : undefined}
            statusVariant={coupon.isImpossible ? "legendary" : undefined}
            title={coupon.title}
            tone={coupon.isImpossible ? "burgundy" : "paper"}
          />
        ))}
      </section>
    </div>
  );
}
