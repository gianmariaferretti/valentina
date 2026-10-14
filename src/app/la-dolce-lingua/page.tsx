import { readFileSync } from "node:fs";
import { join } from "node:path";
import AcademyView from "./academy-view";

const sources = [1,2,3,4].map((volume) => {
  const first = String((volume - 1) * 20 + 1).padStart(3, "0");
  const last = String(volume * 20).padStart(3, "0");
  return readFileSync(join(process.cwd(), "src/content/italian/original-lessons", `volume-${volume}-${first}-${last}.txt`), "utf8");
});

function extract(text: string, first: number, last: number) {
  const matches = [...text.matchAll(/^\s*(?:LEZIONE\s+)?(0\d\d)\s*(?:\||\s)\s*([^\n]*)/gm)];
  const sections = matches.map((match, index) => ({
    number: Number(match[1]),
    heading: match[2].trim(),
    content: text.slice(match.index!, matches[index + 1]?.index ?? text.length).trim(),
  }));
  return Array.from({ length: last - first + 1 }, (_, offset) => {
    const number = first + offset;
    const candidates = sections.filter((section) => section.number === number);
    const chosen = candidates.sort((a, b) => b.content.length - a.content.length)[0];
    if (!chosen) throw new Error(`Missing original lesson ${number}`);
    const lines = chosen.content.split("\n").map((line) => line.trim()).filter(Boolean);
    const title = lines[0].startsWith("LEZIONE") ? lines[1] : chosen.heading || lines[0].replace(/^\d{3}\s*\|?\s*/, "");
    return { number, title, content: chosen.content };
  });
}

export default function LaDolceLinguaPage() {
  const lessons = sources.flatMap((source, index) => extract(source, index * 20 + 1, index * 20 + 20));
  return <AcademyView lessons={lessons} />;
}
