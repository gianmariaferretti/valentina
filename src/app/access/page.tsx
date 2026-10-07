import type { Metadata } from "next";
import Link from "next/link";

import { Eyebrow } from "@/components/ui/eyebrow";
import { AccessForm } from "@/features/access/components/access-form";

export const metadata: Metadata = {
  title: "Private entrance",
};

export default function AccessPage() {
  return (
    <main className="grid min-h-svh place-items-center px-5 py-12">
      <div className="w-full max-w-xl">
        <Link className="font-display text-2xl tracking-[-0.04em]" href="/">
          V<span className="text-[var(--rust)]">&</span>G
        </Link>
        <section className="mt-12 rounded-[2rem] border border-[var(--line)] bg-white/35 p-7 shadow-[0_30px_100px_rgba(50,35,30,0.08)] sm:p-11">
          <Eyebrow>Restricted, but tastefully</Eyebrow>
          <h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-[-0.045em] sm:text-6xl">
            Prove you’re
            <br />
            Valentina.
          </h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-[var(--muted)] sm:text-base">
            Only one person is supposed to be here. Conveniently, she should
            know the answer.
          </p>
          <AccessForm />
        </section>
        <p className="mt-5 text-center text-[0.62rem] tracking-[0.14em] text-[var(--muted)] uppercase">
          Attempts may be judged, silently and unfairly
        </p>
      </div>
    </main>
  );
}
