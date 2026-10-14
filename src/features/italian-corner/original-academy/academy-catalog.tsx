"use client";

import { Search, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import type { LessonIndexEntry } from "./lesson-store";

const volumeNames = [
  "Le fondamenta",
  "Il racconto e il tempo",
  "Verso il B1",
  "Il congiuntivo e le costruzioni",
];
const roman = ["I", "II", "III", "IV"];

export function AcademyCatalog({
  lessons,
  completed,
}: {
  lessons: LessonIndexEntry[];
  completed: string[];
}) {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLocaleLowerCase("it-IT");
  const filtered = useMemo(
    () =>
      lessons.filter((lesson) =>
        `${lesson.number} ${String(lesson.number).padStart(3, "0")} ${lesson.title} ${lesson.level} ${lesson.topics.join(" ")}`
          .toLocaleLowerCase("it-IT")
          .includes(normalized),
      ),
    [lessons, normalized],
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-8" id="curriculum">
      <div className="flex flex-col gap-5 border-b border-[#6f725a]/25 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[0.65rem] font-bold tracking-[0.22em] text-[#a75943] uppercase">
            Indice degli studi
          </p>
          <h2 className="mt-3 font-display text-4xl tracking-tight text-[#304b3d] sm:text-6xl">
            Il tuo percorso.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#5c6255]">
            Quattro volumi, ottanta lezioni. Apri un volume e scegli dove
            iniziare.
          </p>
        </div>
        <label className="relative block w-full md:max-w-sm">
          <span className="sr-only">Cerca per numero, titolo o argomento</span>
          <Search
            aria-hidden="true"
            className="absolute top-1/2 left-4 -translate-y-1/2 text-[#59705d]"
            size={17}
          />
          <input
            className="academy-focus min-h-12 w-full rounded-full border border-[#728675]/40 bg-white/75 pr-5 pl-11 text-sm placeholder:text-[#697368]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Numero, titolo o argomento…"
            type="search"
            value={query}
          />
        </label>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {roman.map((numeral, volumeIndex) => {
          const entries = filtered.filter(
            (lesson) => lesson.volume === volumeIndex + 1,
          );
          if (!entries.length) return null;
          const finished = entries.filter((lesson) =>
            completed.includes(lesson.id),
          ).length;
          return (
            <details
              className="group overflow-hidden rounded-[1.6rem] border border-[#6e7e6b]/25 bg-[#fffcf5] shadow-[0_16px_40px_rgba(52,66,49,.045)]"
              id={`volume-${numeral}`}
              key={numeral}
              open={normalized ? true : undefined}
            >
              <summary className="academy-focus flex min-h-36 cursor-pointer list-none items-center gap-5 p-5 marker:hidden sm:p-7">
                <span
                  aria-hidden="true"
                  className="font-display text-6xl italic text-[#a85843]/70"
                >
                  {numeral}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.63rem] font-bold tracking-[0.17em] text-[#a75943] uppercase">
                    Volume {numeral} ·{" "}
                    {volumeIndex < 2
                      ? "A2"
                      : volumeIndex === 2
                        ? "A2 → B1"
                        : "B1"}
                  </span>
                  <span className="mt-2 block font-display text-2xl leading-tight text-[#304b3d] sm:text-3xl">
                    {volumeNames[volumeIndex]}
                  </span>
                  <span className="mt-2 block text-xs text-[#687061]">
                    {finished} / {entries.length} completate
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="text-2xl text-[#48624f] group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <div className="border-t border-[#6e7e6b]/20 p-4 sm:p-6">
                {[0, 1, 2, 3].map((module) => {
                  const pages = entries.filter(
                    (lesson) =>
                      Math.floor(((lesson.number - 1) % 20) / 5) === module,
                  );
                  if (!pages.length) return null;
                  return (
                    <div className="mb-5 last:mb-0" key={module}>
                      <p className="mb-2 text-[0.6rem] font-bold tracking-[0.16em] text-[#a75943] uppercase">
                        Fascicolo {String(module + 1).padStart(2, "0")}
                      </p>
                      <ol className="space-y-1">
                        {pages.map((lesson) => (
                          <li key={lesson.id}>
                            <Link
                              className="academy-focus group/lesson flex min-h-14 items-center gap-4 rounded-xl px-3 py-2 text-sm hover:bg-[#edf0e5]"
                              href={`/la-dolce-lingua/lessons/${String(lesson.number).padStart(3, "0")}`}
                            >
                              <span className="w-8 shrink-0 font-mono text-xs text-[#a75943]">
                                {String(lesson.number).padStart(3, "0")}
                              </span>
                              <span className="min-w-0 flex-1 leading-5">
                                {lesson.title}
                              </span>
                              <span className="shrink-0 text-xs text-[#59705d]">
                                {completed.includes(lesson.id) ? (
                                  "✓"
                                ) : (
                                  <ArrowUpRight aria-hidden="true" size={15} />
                                )}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ol>
                    </div>
                  );
                })}
              </div>
            </details>
          );
        })}
      </div>
      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-[#5c6255]" role="status">
          Nessuna lezione corrisponde alla ricerca.
        </p>
      ) : null}
    </section>
  );
}
