import {
  ArrowRight,
  BookOpenText,
  Compass,
  Feather,
  GraduationCap,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AcademyCatalog } from "@/features/italian-corner/original-academy/academy-catalog";
import {
  originalCurriculum,
  lessonHref,
} from "@/features/italian-corner/original-academy/lesson-store";
import {
  loadOriginalProgress,
  loadWorldCollectibles,
} from "@/features/italian-corner/original-academy/progress-actions";
import { WorldCollection } from "@/features/italian-corner/world/world-collection";
import { WorldMap } from "@/features/italian-corner/world/world-map";

export const metadata: Metadata = {
  title: "La Dolce Lingua",
  robots: { index: false, follow: false },
};

const volumes = [
  { number: "I", label: "Le fondamenta", range: "001—020", theme: "olive" },
  {
    number: "II",
    label: "Il racconto e il tempo",
    range: "021—040",
    theme: "rust",
  },
  { number: "III", label: "Verso il B1", range: "041—060", theme: "sage" },
  {
    number: "IV",
    label: "Il congiuntivo e le costruzioni",
    range: "061—080",
    theme: "gold",
  },
] as const;

export default async function LaDolceLinguaPage() {
  const [progress, collectibles] = await Promise.all([
    loadOriginalProgress(),
    loadWorldCollectibles(),
  ]);
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
  const currentVolume = Math.min(Math.floor(completedIds.length / 20), 3);
  const lastLesson = last
    ? originalCurriculum.find((entry) => entry.id === last.lessonId)
    : null;
  const completedNumbers = originalCurriculum
    .filter((lesson) => completedIds.includes(lesson.id))
    .map((lesson) => lesson.number);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pt-7 sm:px-8 sm:pt-12">
        <header className="academy-hero relative isolate overflow-hidden rounded-[1.4rem] border border-[#d4c9ab] bg-[#f8f2e5] shadow-[0_28px_65px_rgba(49,59,38,.11)] sm:rounded-[2rem]">
          <div className="academy-hero-art relative h-52 overflow-hidden sm:h-64 md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-[58%]">
            <Image
              alt="Illustrazione originale dei tetti di Firenze, con il Duomo e le colline toscane"
              className="object-cover object-[center_65%]"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 58vw"
              src="/images/academy/italian-city-illustration.webp"
            />
            <div className="academy-hero-art-overlay absolute inset-0" />
          </div>
          <div className="relative z-10 flex min-h-[29rem] flex-col justify-center px-6 py-9 sm:px-12 sm:py-14 md:max-w-[55%] md:py-20 lg:px-16">
            <div className="flex items-center gap-3">
              <span className="academy-seal" aria-hidden="true">
                A
              </span>
              <p className="text-[0.62rem] font-bold tracking-[0.24em] text-[#7a4638] uppercase">
                Accademia privata · V&G
              </p>
            </div>
            <h1 className="mt-8 max-w-xl font-display text-[clamp(3.55rem,8.5vw,7.4rem)] leading-[.88] tracking-[-.065em] text-[#284333]">
              La Dolce
              <br />
              <em className="font-normal text-[#a7563f]">Lingua World.</em>
            </h1>
            <div className="academy-rule my-7 max-w-xs" />
            <p className="max-w-md font-display text-xl italic leading-7 text-[#2f3f32] sm:text-2xl">
              Learn Italian. Live Italy.
            </p>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#4f5949]">
              Ottanta lezioni originali, quattro volumi e una pagina nuova da
              scrivere ogni volta che torni.
            </p>
            <Link
              className="academy-focus mt-7 inline-flex min-h-12 w-fit items-center gap-3 rounded-full bg-[#284333] px-6 text-xs font-bold tracking-[.12em] text-white uppercase transition-colors hover:bg-[#3e604b]"
              href={target ? lessonHref(target.number) : "#curriculum"}
            >
              {last ? "Continua il tuo viaggio" : "Inizia a imparare"}
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
          <span
            className="academy-postmark absolute right-5 bottom-5 z-10 hidden rotate-[-10deg] text-[#36523c] sm:block md:right-9 md:bottom-8"
            aria-hidden="true"
          >
            ACCADEMIA
            <br />
            ITALIANA
            <br />
            2026
          </span>
        </header>

        <section
          aria-labelledby="italian-challenge-title"
          className="mt-7 grid overflow-hidden rounded-[1.4rem] border border-[#ab9b79] bg-[#314a39] text-[#fbf5e7] shadow-[0_24px_56px_rgba(35,55,40,.16)] md:grid-cols-[minmax(0,1fr)_15rem]"
        >
          <div className="p-7 sm:p-9 lg:p-11">
            <p className="text-[.62rem] font-bold tracking-[.22em] text-[#d6bd82] uppercase">
              Fascicolo speciale · A2–B1
            </p>
            <h2
              className="mt-4 font-display text-[clamp(2.7rem,7vw,5.2rem)] leading-[.95] tracking-[-.045em]"
              id="italian-challenge-title"
            >
              The Italian <em>Challenge.</em>
            </h2>
            <p className="mt-4 font-display text-xl italic text-[#e6d8bc]">
              Are You Italian Enough?
            </p>
            <p className="mt-4 text-sm leading-7 text-[#f5f0e5]/75">
              15 Questions. 10 Minutes. One Secret Reward. Three attempts, with
              the result safely recorded in your private passport.
            </p>
            <Link
              className="academy-focus mt-7 inline-flex min-h-12 items-center gap-3 rounded-full bg-[#f8f2e5] px-6 text-xs font-bold tracking-[.12em] text-[#284333] uppercase transition-colors hover:bg-[#e5d3ae]"
              href="/italian-corner/challenge"
            >
              Take the challenge <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div
            aria-hidden="true"
            className="flex min-h-32 items-center justify-center border-t border-[#d8c49b]/25 bg-[radial-gradient(circle_at_center,rgba(210,176,110,.14),transparent_65%)] md:border-t-0 md:border-l"
          >
            <span className="rotate-[-12deg] rounded-full border-2 border-[#d8c49b]/70 px-7 py-8 text-center font-mono text-xs leading-5 tracking-[.18em] text-[#d8c49b] uppercase">
              Esame
              <br />
              Privato
              <br />V + G
            </span>
          </div>
        </section>

        <section
          aria-label="Passaporto linguistico e progresso"
          className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]"
        >
          <div className="academy-passport relative overflow-hidden rounded-[1.4rem] p-6 text-[#f9f3e5] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[#dcc99e] uppercase">
                  Passaporto linguistico
                </p>
                <h2 className="mt-5 font-display text-4xl">Valentina</h2>
              </div>
              <Compass
                aria-hidden="true"
                className="text-[#d5be8b]"
                size={32}
                strokeWidth={1.3}
              />
            </div>
            <div className="my-7 h-px bg-white/25" />
            <dl className="grid grid-cols-2 gap-5 text-xs">
              <div>
                <dt className="text-[#c9d1bc]">Livello attuale</dt>
                <dd className="mt-1 font-display text-2xl">
                  {next?.level ?? "B1"}
                </dd>
              </div>
              <div>
                <dt className="text-[#c9d1bc]">Volume</dt>
                <dd className="mt-1 font-display text-2xl">
                  {volumes[currentVolume].number} / IV
                </dd>
              </div>
              <div>
                <dt className="text-[#c9d1bc]">Lezioni completate</dt>
                <dd className="mt-1 font-display text-2xl">
                  {completedIds.length} / 80
                </dd>
              </div>
              <div>
                <dt className="text-[#c9d1bc]">Percorso</dt>
                <dd className="mt-1 font-display text-2xl">{percent}%</dd>
              </div>
            </dl>
            <div
              aria-label={`${percent}% del percorso completato`}
              className="mt-7 h-1.5 overflow-hidden rounded-full bg-white/20"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-[#d1af70]"
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="academy-passport-watermark" aria-hidden="true">
              IT
            </span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="academy-overview-card flex flex-col justify-between rounded-[1.4rem] p-6 sm:p-7">
              <BookOpenText
                aria-hidden="true"
                className="text-[#a7563f]"
                size={24}
                strokeWidth={1.5}
              />
              <div className="mt-5">
                <p className="text-[0.64rem] font-bold tracking-[.16em] text-[#a7563f] uppercase">
                  Ultima lezione aperta
                </p>
                <p className="mt-2 font-display text-xl leading-7">
                  {lastLesson
                    ? `${String(lastLesson.number).padStart(3, "0")} · ${lastLesson.title}`
                    : "Il quaderno ti aspetta."}
                </p>
              </div>
            </div>
            <div className="academy-overview-card flex flex-col justify-between rounded-[1.4rem] p-6 sm:p-7">
              <Feather
                aria-hidden="true"
                className="text-[#a7563f]"
                size={24}
                strokeWidth={1.5}
              />
              <div className="mt-5">
                <p className="text-[0.64rem] font-bold tracking-[.16em] text-[#a7563f] uppercase">
                  Prossima consigliata
                </p>
                <p className="mt-2 font-display text-xl leading-7">
                  {next
                    ? `${String(next.number).padStart(3, "0")} · ${next.title}`
                    : "Tutte completate. Complimenti!"}
                </p>
              </div>
            </div>
            <div className="academy-overview-card flex items-center gap-5 rounded-[1.4rem] p-6 sm:col-span-2 sm:p-7">
              <GraduationCap
                aria-hidden="true"
                className="shrink-0 text-[#a7563f]"
                size={28}
                strokeWidth={1.5}
              />
              <p className="font-display text-3xl text-[#284333]">
                {80 - completedIds.length}{" "}
                <span className="text-base italic text-[#5d6959]">
                  lezioni ancora da scoprire
                </span>
              </p>
            </div>
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

        <WorldMap completedNumbers={completedNumbers} />
        <WorldCollection
          unavailable={collectibles.failed}
          unlocked={collectibles.unlocked}
        />

        <section aria-labelledby="volumes-title" className="mt-14 sm:mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="academy-eyebrow">Il percorso</p>
              <h2
                id="volumes-title"
                className="mt-2 font-display text-4xl text-[#284333] sm:text-5xl"
              >
                Quattro volumi. <em className="font-normal">Una voce.</em>
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-[#616b5b]">
              Dalle prime strutture fino a un italiano più libero: ogni volume
              ha il suo ritmo.
            </p>
          </div>
          <div className="academy-volume-grid mt-8 grid gap-3 md:grid-cols-4">
            {volumes.map((volume) => (
              <a
                className={`academy-volume academy-volume--${volume.theme} academy-focus group rounded-[1.2rem] p-5`}
                href={`#volume-${volume.number}`}
                key={volume.number}
              >
                <span
                  className="font-display text-5xl italic opacity-70"
                  aria-hidden="true"
                >
                  {volume.number}
                </span>
                <span className="mt-8 block text-[0.62rem] font-bold tracking-[.16em] uppercase">
                  Volume {volume.number} · {volume.range}
                </span>
                <span className="mt-2 block font-display text-xl">
                  {volume.label}
                </span>
                <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold uppercase">
                  Esplora <ArrowRight aria-hidden="true" size={14} />
                </span>
              </a>
            ))}
          </div>
        </section>
        <section className="academy-paper mt-8 rounded-[1.5rem] border border-[#718471]/25 p-6 sm:p-8">
          <p className="text-[0.62rem] font-bold tracking-[.18em] text-[#a75943] uppercase">
            Dopo il quarto volume
          </p>
          <h2 className="mt-3 font-display text-3xl text-[#304b3d] sm:text-4xl">
            Il laboratorio B1/B2.
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[#566355]">
            I fascicoli 081–149 e la prova pilota B1 della lezione 100 sono
            consultabili in anteprima. Puoi salvare le risposte; il materiale è
            ancora in revisione e non rilascia una certificazione di livello.
          </p>
          <Link
            className="academy-focus mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#355244] px-6 text-xs font-bold tracking-[.1em] text-white uppercase"
            href="/la-dolce-lingua/laboratorio"
          >
            Esplora il laboratorio <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </section>
      </div>
      <AcademyCatalog completed={completedIds} lessons={originalCurriculum} />
    </>
  );
}
