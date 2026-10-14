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
import { loadOriginalProgress } from "@/features/italian-corner/original-academy/progress-actions";

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
  const currentVolume = Math.min(Math.floor(completedIds.length / 20), 3);
  const lastLesson = last
    ? originalCurriculum.find((entry) => entry.id === last.lessonId)
    : null;

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
              <em className="font-normal text-[#a7563f]">Lingua.</em>
            </h1>
            <div className="academy-rule my-7 max-w-xs" />
            <p className="max-w-md font-display text-xl italic leading-7 text-[#2f3f32] sm:text-2xl">
              Un viaggio nella lingua e nella cultura italiana.
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

        <section aria-labelledby="atlas-title" className="mt-14 sm:mt-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="academy-eyebrow">Cartoline dall&apos;Italia</p>
              <h2
                className="mt-2 font-display text-4xl text-[#284333] sm:text-5xl"
                id="atlas-title"
              >
                La lingua ha <em className="font-normal">un paesaggio.</em>
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-6 text-[#616b5b]">
              Quattro appunti visivi, dalla pietra romana alle colline toscane.
            </p>
          </div>
          <div className="academy-atlas mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                city: "Roma",
                cue: "Pietra · archi · storia",
                style: "rome",
                mark: "RM",
              },
              {
                city: "Firenze",
                cue: "Cupole · arte · parole",
                style: "florence",
                mark: "FI",
              },
              {
                city: "Venezia",
                cue: "Acqua · riflessi · dialoghi",
                style: "venice",
                mark: "VE",
              },
              {
                city: "Toscana",
                cue: "Colline · tavole · racconti",
                style: "tuscany",
                mark: "TO",
              },
            ].map((place) => (
              <article
                className={`academy-postcard academy-postcard--${place.style}`}
                key={place.city}
              >
                <div aria-hidden="true" className="academy-postcard-art">
                  <span className="academy-postcard-scenery" />
                  <span className="academy-postcard-stamp">
                    {place.mark}
                    <br />
                    ITALIA
                  </span>
                </div>
                <div className="flex items-end justify-between gap-2 px-4 py-4">
                  <div>
                    <h3 className="font-display text-2xl italic text-[#284333]">
                      {place.city}
                    </h3>
                    <p className="mt-1 text-[.64rem] tracking-[.08em] text-[#65705e] uppercase">
                      {place.cue}
                    </p>
                  </div>
                  <span
                    aria-hidden="true"
                    className="font-display text-xl text-[#a7563f]"
                  >
                    ✶
                  </span>
                </div>
              </article>
            ))}
          </div>
        </section>

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
      </div>
      <AcademyCatalog completed={completedIds} lessons={originalCurriculum} />
    </>
  );
}
