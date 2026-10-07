import { ArrowLeft, ScanLine } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Eyebrow } from "@/components/ui/eyebrow";
import { coupons, getCoupon } from "@/data/coupons";

interface CouponPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return coupons.map((coupon) => ({ id: coupon.id }));
}

export async function generateMetadata({
  params,
}: CouponPageProps): Promise<Metadata> {
  const coupon = getCoupon((await params).id);
  return { title: coupon?.title ?? "Coupon" };
}

export default async function CouponPage({ params }: CouponPageProps) {
  const coupon = getCoupon((await params).id);
  if (!coupon) notFound();

  return (
    <div className="page-container py-10 sm:py-14 lg:py-20">
      <Link
        className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--muted)] uppercase transition hover:text-[var(--ink)]"
        href="/coupons"
      >
        <ArrowLeft aria-hidden="true" size={15} />
        The wallet
      </Link>
      <section className="mt-8 grid min-h-[36rem] overflow-hidden rounded-[2rem] border border-[var(--line)] bg-white/35 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col p-7 sm:p-12 lg:p-16">
          <div className="flex items-center justify-between">
            <Eyebrow>{coupon.code}</Eyebrow>
            <span className="rounded-full border border-[var(--line)] px-3 py-1 text-[0.58rem] tracking-[0.14em] uppercase">
              Draft
            </span>
          </div>
          <div className="my-auto py-16">
            <h1 className="max-w-4xl font-display text-6xl leading-[0.88] tracking-[-0.055em] sm:text-8xl">
              {coupon.title}.
            </h1>
            <p className="mt-7 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
              {coupon.description}
            </p>
          </div>
          <p className="text-[0.62rem] tracking-[0.14em] text-[var(--muted)] uppercase">
            Final redemption rules and confirmation will be added with feature
            content.
          </p>
        </div>
        <aside className="flex flex-col justify-between border-t border-[var(--line)] bg-[var(--ink)] p-7 text-[var(--paper)] lg:border-t-0 lg:border-l lg:p-9">
          <ScanLine aria-hidden="true" className="text-white/60" size={28} />
          <div className="py-14">
            <p className="font-display text-3xl">Valid for Valentina</p>
            <p className="mt-3 text-sm leading-6 text-white/55">
              Non-transferable. Probably enforceable. Designed for exactly one
              very specific customer.
            </p>
          </div>
          <div className="h-16 bg-[repeating-linear-gradient(90deg,white_0_2px,transparent_2px_5px,white_5px_6px,transparent_6px_10px)] opacity-70" />
        </aside>
      </section>
    </div>
  );
}
