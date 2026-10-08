import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PassportStamp, Sticker } from "@/components/design-system";
import { FadeIn } from "@/components/motion/fade-in";
import { AccessForm } from "@/features/access/components/access-form";
import { hasValidAccessSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Restricted area",
};

export default async function AccessPage() {
  if (await hasValidAccessSession()) redirect("/home");

  return (
    <main className="relative grid min-h-svh overflow-hidden px-5 py-8 sm:px-8 sm:py-12 lg:place-items-center">
      <div
        aria-hidden="true"
        className="absolute -top-48 -right-40 size-[32rem] rounded-full bg-[var(--red-muted)]/12 blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-4xl">
        <FadeIn className="flex items-center justify-between">
          <Link
            aria-label="Back to the V and G landing page"
            className="font-display text-2xl tracking-[-0.04em]"
            href="/"
          >
            V<span className="text-[var(--rust)]">+</span>G
          </Link>
          <Sticker rotation={2} size="sm" variant="classified" />
        </FadeIn>

        <FadeIn delay={0.08}>
          <section className="relative mt-10 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--paper-white)]/72 px-6 py-8 shadow-[var(--shadow-paper)] sm:px-11 sm:py-12 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(21rem,0.78fr)] lg:gap-16 lg:px-14 lg:py-14">
            <div>
              <p className="text-[0.62rem] font-bold tracking-[0.22em] text-[var(--rust)] uppercase">
                Identity check · 01
              </p>
              <h1 className="mt-5 max-w-2xl font-display text-[clamp(3rem,10vw,7rem)] leading-[0.8] tracking-[-0.06em] uppercase">
                Restricted
                <br />
                <span className="italic text-[var(--rust)]">Area</span>
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg">
                This website contains classified information about one year of
                questionable decisions.
              </p>
              <p className="mt-3 font-display text-2xl italic">
                Prove you&apos;re Valentina.
              </p>
            </div>

            <div className="relative mt-10 border-t border-dashed border-[var(--line-strong)] pt-8 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-4 lg:pl-12">
              <AccessForm />
              <PassportStamp
                className="mt-9 ml-auto hidden opacity-45 sm:flex"
                code="V+G"
                date="04 OCT 2025"
                location="For her eyes only"
                rotation={7}
              />
            </div>
          </section>
        </FadeIn>

        <FadeIn delay={0.16}>
          <p className="mt-5 text-center text-[0.58rem] font-semibold tracking-[0.15em] text-[var(--muted)] uppercase">
            Unauthorized boyfriends already know the code
          </p>
        </FadeIn>
      </div>
    </main>
  );
}
