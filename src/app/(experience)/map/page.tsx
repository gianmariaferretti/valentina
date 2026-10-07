import { ArrowUpRight, MapPinned } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PassportStamp, PostageStamp } from "@/components/design-system";
import { PageIntro } from "@/components/ui/page-intro";
import { places } from "@/data/places";

export const metadata: Metadata = {
  title: "Our map",
};

const pinPositions = ["18% 68%", "47% 32%", "58% 50%", "78% 28%"];

export default function MapPage() {
  return (
    <div className="page-container py-10 sm:py-14 lg:py-20">
      <PageIntro
        description="Places are just coordinates until something happens there. These are the first pins in our very biased atlas."
        eyebrow="Where we have been"
        title="Our little world, approximately."
      />

      <section className="mt-8 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--paper-deep)] sm:mt-12 lg:grid lg:min-h-[38rem] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="relative min-h-[32rem] overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,.65),transparent_60%),linear-gradient(rgba(36,30,28,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(36,30,28,.07)_1px,transparent_1px)] bg-[size:auto,34px_34px,34px_34px]">
          <div className="absolute inset-[12%] rounded-[50%_42%_48%_44%] border border-[var(--line-strong)] opacity-70" />
          <div className="absolute inset-[25%_20%] rotate-[-8deg] rounded-[45%] border border-[var(--line)]" />
          <div className="absolute right-7 bottom-7 hidden opacity-70 sm:block">
            <PassportStamp date="YEAR ONE" location="V + G" rotation={7} />
          </div>
          {places.map((place, index) => (
            <Link
              aria-label={`Open ${place.city}`}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              href={`/map/${place.slug}`}
              key={place.slug}
              style={{
                left: pinPositions[index]?.split(" ")[0],
                top: pinPositions[index]?.split(" ")[1],
              }}
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-[var(--rust)] opacity-15 motion-reduce:animate-none" />
              <span className="relative flex items-center gap-2 rounded-full bg-[var(--ink)] px-3 py-2 text-[0.65rem] font-semibold tracking-[0.06em] text-white shadow-xl transition group-hover:bg-[var(--rust)]">
                <MapPinned aria-hidden="true" size={14} />
                {place.city}
              </span>
            </Link>
          ))}
        </div>
        <aside className="border-t border-[var(--line)] bg-white/35 p-6 lg:border-t-0 lg:border-l lg:p-8">
          <p className="text-[0.6rem] font-semibold tracking-[0.16em] text-[var(--muted)] uppercase">
            The index
          </p>
          <div className="mt-5 divide-y divide-[var(--line)]">
            {places.map((place, index) => (
              <Link
                className="group flex items-center gap-3 py-4"
                href={`/map/${place.slug}`}
                key={place.slug}
              >
                <span className="font-mono text-[0.62rem] text-[var(--muted)]">
                  0{index + 1}
                </span>
                <span className="flex-1">
                  <span className="block font-display text-2xl">
                    {place.city}
                  </span>
                  <span className="mt-0.5 block text-xs text-[var(--muted)]">
                    {place.country}
                  </span>
                </span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  size={16}
                />
              </Link>
            ))}
          </div>
          <PostageStamp
            className="mt-8"
            country="Our world"
            tone="burgundy"
            value="01"
          />
        </aside>
      </section>
    </div>
  );
}
