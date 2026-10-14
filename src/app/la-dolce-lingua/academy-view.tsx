"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Lesson = { number: number; title: string; content: string };
const pad = (n: number) => String(n).padStart(3, "0");
const headings = ["Fondamenta", "I tempi del passato", "Consolidamento A2", "Il congiuntivo e i pronomi"];

function divide(text: string) {
  const marker = /(?:^|\n)\s*(Soluzioni e feedback[^\n]*|Soluzioni e feedback del docente[^\n]*|Soluzioni[^\n]*|Chiave delle risposte[^\n]*)/im;
  const hit = marker.exec(text);
  return hit ? [text.slice(0, hit.index), text.slice(hit.index)] : [text, ""];
}

export default function AcademyView({ lessons }: { lessons: Lesson[] }) {
  const [active, setActive] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [showAnswers, setShowAnswers] = useState(false);
  const [done, setDone] = useState<number[]>([]);
  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem("dolce-lingua-done-v1") || "[]")); } catch { setDone([]); }
  }, []);
  const filtered = useMemo(() => lessons.filter((l) => (pad(l.number) + " " + l.title).toLocaleLowerCase().includes(query.toLocaleLowerCase())), [lessons, query]);
  const lesson = lessons.find((l) => l.number === active);
  const [body, solutions] = lesson ? divide(lesson.content) : ["", ""];
  function toggleDone(number: number) {
    const next = done.includes(number) ? done.filter((x) => x !== number) : [...done, number];
    setDone(next); localStorage.setItem("dolce-lingua-done-v1", JSON.stringify(next));
  }
  return <main className="min-h-svh bg-[#f7f0e7] text-[#2c2523]">
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-9 sm:px-10">
      <nav className="mb-14 flex items-center justify-between text-xs tracking-[0.2em] uppercase">
        <Link href="/home" className="hover:text-[#833d45]">← V&G</Link>
        <span className="text-[#8b4d55]">Italian Academy · Private Edition</span>
      </nav>
      <header className="mb-10 border-b border-[#6e353d]/20 pb-10">
        <p className="mb-3 text-xs font-semibold tracking-[0.3em] text-[#8b4d55] uppercase">Per Valentina · Un viaggio in italiano</p>
        <h1 className="font-serif text-5xl tracking-tight text-[#632d38] sm:text-7xl">La Dolce Lingua</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#655753]">Ottanta lezioni, quattro volumi. Il testo didattico è riprodotto dai manoscritti originali, senza riscritture.</p>
        <div className="mt-6 flex items-center gap-4 text-sm text-[#6c5450]"><span>{done.length} / 80 completate</span><div className="h-2 w-48 overflow-hidden rounded-full bg-[#e7d5ca]"><div className="h-full bg-[#833d45]" style={{ width: `${done.length / 80 * 100}%` }} /></div></div>
      </header>
      {lesson ? <section className="mx-auto max-w-3xl">
        <button className="mb-8 text-sm text-[#833d45] underline underline-offset-4" onClick={() => {setActive(null); setShowAnswers(false);}}>← Tutte le lezioni</button>
        <div className="rounded-2xl border border-[#d8c4b8] bg-[#fffdf9] px-6 py-9 shadow-[0_18px_60px_rgba(68,35,36,.08)] sm:px-12">
          <p className="mb-3 text-xs font-bold tracking-[0.2em] text-[#944d58] uppercase">Lezione {pad(lesson.number)}</p>
          <h2 className="mb-9 font-serif text-3xl leading-tight text-[#602b36] sm:text-4xl">{lesson.title}</h2>
          <div className="whitespace-pre-wrap break-words font-sans text-[15px] leading-[1.9] text-[#423b38]">{body}</div>
          {solutions && <div className="mt-10 border-t border-[#d9c8bc] pt-7">
            <button className="rounded-full bg-[#642e39] px-6 py-3 text-sm font-medium text-white hover:bg-[#813e4c]" onClick={() => setShowAnswers(!showAnswers)}>{showAnswers ? "Nascondi soluzioni" : "Mostra soluzioni originali"}</button>
            {showAnswers && <div className="mt-7 whitespace-pre-wrap break-words rounded-xl bg-[#f5ece5] p-6 text-sm leading-8">{solutions}</div>}
          </div>}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-[#d9c8bc] pt-7">
            <button className="rounded-full border border-[#713845] px-5 py-3 text-sm text-[#713845]" onClick={() => toggleDone(lesson.number)}>{done.includes(lesson.number) ? "✓ Completata · annulla" : "Segna come completata"}</button>
            {lesson.number < 80 && <button className="text-sm font-semibold text-[#713845]" onClick={() => {setActive(lesson.number + 1); setShowAnswers(false); window.scrollTo(0,0);}}>Prossima lezione →</button>}
          </div>
        </div>
      </section> : <>
        <label className="mb-8 block"><span className="sr-only">Cerca una lezione</span><input className="w-full rounded-xl border border-[#d5bfb6] bg-white/80 px-5 py-4 outline-[#8b4d55]" placeholder="Cerca una lezione o un argomento…" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
        {[0,1,2,3].map((group) => {
          const items = filtered.filter((l) => Math.floor((l.number - 1) / 20) === group);
          return items.length ? <section key={group} className="mb-12"><p className="mb-2 text-xs tracking-[0.22em] text-[#9b5960] uppercase">Volume {["I","II","III","IV"][group]}</p><h2 className="mb-5 font-serif text-3xl text-[#632d38]">{headings[group]}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{items.map((item) => <button key={item.number} onClick={() => {setActive(item.number);setShowAnswers(false);window.scrollTo(0,0);}} className="group rounded-xl border border-[#e0cec4] bg-[#fffdf9] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#9d6470] hover:shadow-lg"><span className="text-xs tracking-widest text-[#a1646a]">{pad(item.number)} {done.includes(item.number) ? "✓" : "·"}</span><span className="mt-2 block font-serif text-xl leading-snug text-[#40302e] group-hover:text-[#713845]">{item.title}</span><span className="mt-4 block text-xs text-[#987f78]">Apri lezione →</span></button>)}</div></section> : null;
        })}
      </>}
    </div>
  </main>;
}
