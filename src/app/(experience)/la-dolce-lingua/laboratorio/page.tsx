import { ArrowRight, BookOpenText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  laboratoryHref,
  laboratoryIndex,
} from "@/features/italian-corner/laboratory/laboratory-store";
import { loadOriginalProgress } from "@/features/italian-corner/original-academy/progress-actions";

export const metadata: Metadata = {
  title: "Laboratorio B1/B2 · La Dolce Lingua",
  robots: { index: false, follow: false },
};

export default async function LaboratoryIndexPage() {
  const progress = await loadOriginalProgress();
  const started = new Set(progress.lessons.map((item) => item.lessonId));
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <Link
        className="academy-focus inline-flex min-h-11 items-center gap-2 text-xs font-bold tracking-[.12em] text-[#355244] uppercase"
        href="/la-dolce-lingua"
      >
        ← La Dolce Lingua
      </Link>
      <header className="academy-paper mt-5 rounded-[1.7rem] border border-[#718471]/25 p-6 sm:p-10">
        <BookOpenText
          aria-hidden="true"
          className="text-[#a75943]"
          size={30}
          strokeWidth={1.4}
        />
        <p className="mt-5 text-[.62rem] font-bold tracking-[.2em] text-[#a75943] uppercase">
          Fascicoli in lavorazione · V&G
        </p>
        <h1 className="mt-3 font-display text-5xl text-[#304b3d] sm:text-7xl">
          Il laboratorio.
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-[#566355]">
          Dopo le prime 80 lezioni, qui puoi esplorare il percorso B1 e B2 e
          salvare le tue risposte. Questi fascicoli sono ancora bozze
          didattiche: non rappresentano un livello certificato, e alcune
          attività aperte richiedono una revisione umana.
        </p>
        {progress.failed ? (
          <p className="mt-4 text-sm text-[#a75943]" role="status">
            Il quaderno dei progressi non è disponibile; le lezioni restano
            leggibili.
          </p>
        ) : null}
      </header>
      <section
        className="mt-8 grid gap-5 lg:grid-cols-2"
        aria-label="Fascicoli del laboratorio"
      >
        {(["B1", "B2"] as const).map((level) => (
          <div
            className="rounded-[1.5rem] border border-[#718471]/25 bg-[#fffcf5] p-5 sm:p-7"
            key={level}
          >
            <p className="text-[.62rem] font-bold tracking-[.18em] text-[#a75943] uppercase">
              {level === "B1"
                ? "Volume V · 081–099"
                : "Volumi VI–VIII · 101–149"}
            </p>
            <h2 className="mt-3 font-display text-3xl text-[#304b3d]">
              {level === "B1"
                ? "La lingua prende forma."
                : "Sfumature, voce, stile."}
            </h2>
            <ol className="mt-5 divide-y divide-[#718471]/15">
              {laboratoryIndex
                .filter((lesson) => lesson.level === level)
                .map((lesson) => (
                  <li key={lesson.number}>
                    <Link
                      className="academy-focus flex min-h-14 items-center gap-3 rounded-xl px-2 py-3 text-sm hover:bg-[#edf0e5]"
                      href={laboratoryHref(lesson.number)}
                    >
                      <span className="w-8 shrink-0 font-mono text-xs text-[#a75943]">
                        {String(lesson.number).padStart(3, "0")}
                      </span>
                      <span className="min-w-0 flex-1">{lesson.title}</span>
                      <span className="shrink-0 text-xs text-[#59705d]">
                        {started.has(
                          `${level.toLowerCase()}-${String(lesson.number).padStart(3, "0")}`,
                        ) ? (
                          "Riprendi"
                        ) : (
                          <ArrowRight aria-label="Apri" size={16} />
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
            </ol>
          </div>
        ))}
      </section>
      <section className="mt-7 rounded-[1.5rem] border border-[#718471]/25 bg-[#edf0e5] p-6 sm:p-8">
        <p className="text-[.62rem] font-bold tracking-[.18em] text-[#a75943] uppercase">
          Tappa 100 · B1
        </p>
        <h2 className="mt-2 font-display text-3xl text-[#304b3d]">
          Prova finale in modalità studio.
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-7">
          Lettura, grammatica e scrittura. L’ascolto resta sospeso finché non
          esiste una traccia audio; la produzione scritta richiede valutazione
          umana. Nessun attestato automatico.
        </p>
        <Link
          className="academy-focus mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#355244] px-6 text-xs font-bold tracking-[.1em] text-white uppercase"
          href="/la-dolce-lingua/esame-b1"
        >
          Apri la prova B1 <ArrowRight aria-hidden="true" size={15} />
        </Link>
      </section>
    </div>
  );
}
