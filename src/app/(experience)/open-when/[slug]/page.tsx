import { ArrowLeft, MailOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Eyebrow } from "@/components/ui/eyebrow";
import { getOpenWhenLetter, openWhenLetters } from "@/data/open-when";

interface LetterPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return openWhenLetters.map((letter) => ({ slug: letter.slug }));
}

export async function generateMetadata({
  params,
}: LetterPageProps): Promise<Metadata> {
  const letter = getOpenWhenLetter((await params).slug);
  return {
    title: letter ? `Open when ${letter.title.toLowerCase()}` : "Letter",
  };
}

export default async function LetterPage({ params }: LetterPageProps) {
  const letter = getOpenWhenLetter((await params).slug);
  if (!letter) notFound();

  return (
    <div className="page-container py-10 sm:py-14 lg:py-20">
      <Link
        className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--muted)] uppercase"
        href="/open-when"
      >
        <ArrowLeft aria-hidden="true" size={15} />
        All letters
      </Link>
      <article className="mx-auto mt-8 max-w-4xl rounded-[2rem] border border-[var(--line)] bg-white/45 p-7 shadow-[0_35px_100px_rgba(50,35,30,0.07)] sm:p-12 lg:p-16">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-6">
          <Eyebrow>Open when</Eyebrow>
          <MailOpen
            aria-hidden="true"
            className="text-[var(--rust)]"
            size={20}
          />
        </div>
        <h1 className="mt-14 font-display text-6xl leading-[0.92] tracking-[-0.05em] sm:text-8xl">
          {letter.title}.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--muted)]">
          {letter.preview}
        </p>
        <div className="mt-16 border-t border-dashed border-[var(--line-strong)] pt-6">
          <p className="text-sm italic text-[var(--muted)]">
            The private letter belongs here. Its final words should come from
            Gianmaria, not a scaffold generator.
          </p>
        </div>
      </article>
    </div>
  );
}
