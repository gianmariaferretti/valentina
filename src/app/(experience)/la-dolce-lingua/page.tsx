import { ArrowRight, BookOpenText, Feather, GraduationCap } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AcademyCatalog } from "@/features/italian-corner/original-academy/academy-catalog";
import {
  originalCurriculum,
  lessonHref,
} from "@/features/italian-corner/original-academy/lesson-store";
import { loadOriginalProgress } from "@/features/italian-corner/original-academy/progress-actions";

export const metadata: Metadata = {
  title: "La Dolce Lingua",
  robots: { index: false, follow: false },
};

export default async function LaDolceLinguaPage() {
  const progress = await loadOriginalProgress();
  const curriculumIds = new Set(originalCurriculum.map((lesson) => lesson.id));
  const completedIds = progress.lessons
    .filter(
      (lesson) =>
        lesson.status === "completed" && curriculumIds.has(lesson.lessonId),
    )
    .map((lesson) => lesson.lessonId);
  const last = progress.lessons.find((lesson) =>
    originalCurriculum.some((entry) => entry.id === lesson.lessonId),
  );
  const next = originalCurriculum.find(
    (lesson) => !completedIds.includes(lesson.id),
  );
  const target = last
    ? originalCurriculum.find((lesson) => lesson.id === last.lessonId)
    : next;
  const percent = Math.round((completedIds.length / 80) * 100);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-8 sm:pt-14">
        <header className="relative grid overflow-hidden rounded-[1.6rem] bg-[#304b3d] text-[#f9f4e9] md:grid-cols-[minmax(0,1.25fr)_minmax(16rem,.75fr)]">
          <div className="relative z-10 px-6 py-10 sm:px-12 sm:py-16 lg:py-20">
            <p className="text-[0.65rem] font-bold tracking-[0.24em] text-[#e9c8a0] uppercase">
              V&G · Accademia privata
            </p>
            <h1 className="mt-8 font-display text-[clamp(3.8rem,10vw,8rem)] leading-[.84] tracking-[-.065em]">
              La Dolce
              <br />
              <em className="font-normal text-[#e6c5a6]">Lingua.</em>
            </h1>
            <div className="academy-rule my-8 max-w-md" />
            <p className="max-w-lg font-display text-xl italic leading-7 sm:text-2xl">
              Un piccolo viaggio nella lingua più bella del mondo.
            </p>
            <p className="mt-5 max-w-lg text-sm leading-7 text-[#f5f0e2]/72">
              Ottanta lezioni originali, quattro volumi e un percorso tutto tuo.
              Un quaderno da aprire, non una lista da finire in fretta.
            </p>
            <Link
              className="academy-focus mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#f6eee0] px-6 text-xs font-bold tracking-[.12em] text-[#304b3d] uppercase hover:bg-white"
              href={target ? lessonHref(target.number) : "#curriculum"}
            >
              {last ? "Continua a studiare" : "Inizia il tuo viaggio"}{" "}
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
          <div
            aria-hidden="true"
            className="relative hidden overflow-hidden md:block"
          >
            <div className="academy-arch absolute right-[14%] bottom-[-2.5rem] h-[88%] w-[70%] border-[12px] border-[#e7d7bd] shadow-[inset_0_0_0_1px_#a4ab8a]" />
            <span className="absolute right-[20%] bottom-[12%] rotate-[-9deg] border-2 border-[#f7ebd6]/50 px-5 py-4 font-display text-2xl italic text-[#f7ebd6]/85">
              Firenze · 2026
            </span>
            <span className="absolute top-[17%] right-[14%] font-display text-[9rem] leading-none text-white/5">
              IT
            </span>
          </div>
        </header>

        <section
          aria-label="Il tuo progresso"
          className="mt-7 grid gap-3 sm:grid-cols-3"
        >
          <div className="rounded-[1.4rem] bg-[#fffcf5] p-6">
            <BookOpenText className="text-[#a75943]" size={23} />
            <p className="mt-5 font-display text-4xl text-[#304b3d]">
              {completedIds.length}
              <span className="text-[#819181]"> / 80</span>
            </p>
            <p className="mt-2 text-xs text-[#667163]">Lezioni completate</p>
          </div>
          <div className="rounded-[1.4rem] bg-[#fffcf5] p-6">
            <Feather className="text-[#a75943]" size={23} />
            <p className="mt-5 font-display text-4xl text-[#304b3d]">
              {80 - completedIds.length}
            </p>
            <p className="mt-2 text-xs text-[#667163]">Lezioni rimanenti</p>
          </div>
          <div className="rounded-[1.4rem] bg-[#fffcf5] p-6">
            <GraduationCap className="text-[#a75943]" size={23} />
            <p className="mt-5 font-display text-4xl text-[#304b3d]">
              {percent}%
            </p>
            <p className="mt-2 text-xs text-[#667163]">Percorso completato</p>
          </div>
        </section>
        {progress.failed ? (
          <p
            className="mt-4 rounded-xl border border-[#a75943]/40 bg-[#fff7ed] p-4 text-sm"
            role="status"
          >
            I progressi non sono disponibili al momento. Le lezioni restano
            consultabili; nessun risultato verrà inventato.
          </p>
        ) : null}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[1.4rem] border border-[#819181]/25 p-5">
            <p className="text-[0.65rem] font-bold tracking-[.17em] text-[#a75943] uppercase">
              Ultima lezione aperta
            </p>
            <p className="mt-3 font-display text-xl">
              {last
                ? originalCurriculum.find((entry) => entry.id === last.lessonId)
                    ?.title
                : "Il quaderno ti aspetta."}
            </p>
          </div>
          <div className="rounded-[1.4rem] border border-[#819181]/25 p-5">
            <p className="text-[0.65rem] font-bold tracking-[.17em] text-[#a75943] uppercase">
              Prossima consigliata
            </p>
            <p className="mt-3 font-display text-xl">
              {next
                ? `${String(next.number).padStart(3, "0")} · ${next.title}`
                : "Tutte completate. Complimenti!"}
            </p>
          </div>
        </div>
      </div>
      <AcademyCatalog completed={completedIds} lessons={originalCurriculum} />
    </>
  );
}
