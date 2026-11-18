"use client";

import { motion, useScroll, useSpring } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Tape } from "@/components/design-system";
import { RollingNumber } from "@/components/ui/rolling-number";
import MediaImage from "@/features/media/components/media-image";

import { routePath, type StoryChapter } from "../lib/story";
import styles from "./story.module.css";

/**
 * Text that writes itself letter by letter when it scrolls into view
 * (plain spans + CSS, see story.module.css). Screen readers get the whole
 * sentence at once; reduced motion shows it still. Words never break.
 */
function TypeText({
  text,
  className,
  speed = 16,
  as: Tag = "p",
}: {
  text: string;
  className?: string;
  /** Milliseconds between two letters. */
  speed?: number;
  as?: "p" | "h2" | "h3";
}) {
  const ref = useRef<HTMLParagraphElement & HTMLHeadingElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setOn(true);
      },
      { threshold: 0.4 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  let n = 0;
  const words = text.split(" ");
  return (
    <Tag
      className={className}
      data-on={on || undefined}
      ref={ref}
      style={{ ["--speed" as string]: `${speed}ms` }}
    >
      <span className="sr-only">{text}</span>
      {words.map((word, i) => (
        <span aria-hidden="true" className={styles.word} key={i}>
          {[...word].map((char, j) => (
            <span
              className={styles.letter}
              key={j}
              style={{ ["--i" as string]: n++ }}
            >
              {char}
            </span>
          ))}
          {i < words.length - 1 ? "\u00a0" : null}
        </span>
      ))}
    </Tag>
  );
}

const day = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  timeZone: "UTC",
});

/** The chapter date: day and year roll in (NumberFlow), month in words. */
function ChapterDate({ chapter }: { chapter: StoryChapter }) {
  if (!chapter.dateStart)
    return (
      <span className="font-mono text-xs tracking-[0.16em] uppercase">
        {chapter.dateLabel}
      </span>
    );
  // UTC on both sides, so server and browser agree on the day.
  const date = new Date(`${chapter.dateStart.slice(0, 10)}T12:00:00Z`);
  return (
    <span className="font-mono text-sm tracking-[0.12em] uppercase">
      <RollingNumber rollIn value={date.getUTCDate()} /> {day.format(date)}{" "}
      <RollingNumber
        format={{ useGrouping: false }}
        rollIn
        value={date.getUTCFullYear()}
      />
    </span>
  );
}

function Polaroid({
  photo,
  index,
  side,
}: {
  photo: StoryChapter["photos"][number];
  index: number;
  side: 1 | -1;
}) {
  const tilt = side * (index % 2 === 0 ? -4 : 3) + index;
  return (
    // The tilt lives on the wrapper, so reduced motion (CSS) can drop the
    // entrance animation and keep the polaroid crooked.
    <div style={{ rotate: `${tilt}deg` }}>
      <motion.figure
        className="relative w-[min(15rem,72vw)] bg-[#fffdf8] p-2.5 pb-10 shadow-[0_18px_40px_rgba(49,35,30,0.2)] motion-reduce:!transform-none motion-reduce:!opacity-100"
        initial={{ opacity: 0, y: 60, rotate: tilt * 2 }}
        transition={{
          type: "spring",
          stiffness: 90,
          damping: 16,
          delay: index * 0.12,
        }}
        viewport={{ once: true, amount: 0.3 }}
        whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      >
        <Tape
          className="absolute -top-3 left-1/2 -translate-x-1/2"
          position="inline"
          rotation={-side * 6}
          size="sm"
          tone="cream"
        />
        <MediaImage
          alt={photo.alt}
          className="aspect-square w-full object-cover"
          height={photo.height}
          loading="lazy"
          sizes="240px"
          src={photo.src}
          width={photo.width}
        />
        <figcaption className="absolute right-3 bottom-2 left-3 truncate font-display text-sm text-[var(--muted)] italic">
          {photo.caption}
        </figcaption>
      </motion.figure>
    </div>
  );
}

function Chapter({
  chapter,
  total,
  onSeen,
}: {
  chapter: StoryChapter;
  total: number;
  onSeen: (index: number) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const side = chapter.index % 2 === 0 ? 1 : -1;
  useEffect(() => {
    const host = ref.current;
    if (!host) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting))
          onSeen(chapter.index);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [chapter.index, onSeen]);

  return (
    <section
      aria-labelledby={`chapter-${chapter.slug}`}
      className={`relative grid min-h-[100svh] content-center gap-8 py-16 md:grid-cols-2 md:items-center ${side === 1 ? "" : "md:[&>*:first-child]:order-2"}`}
      ref={ref}
    >
      <div className="relative z-10 rounded-[1.4rem] bg-[color-mix(in_srgb,var(--paper)_88%,transparent)] p-5 backdrop-blur-[2px] md:p-7">
        <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[var(--rust)] uppercase">
          Chapter {String(chapter.index + 1).padStart(2, "0")} of{" "}
          {String(total).padStart(2, "0")} · {chapter.country}
        </p>
        <h2
          className="mt-2 font-display text-[clamp(2.6rem,11vw,5rem)] leading-[0.9] tracking-[-0.04em]"
          id={`chapter-${chapter.slug}`}
        >
          {chapter.city}
        </h2>
        <p className="mt-3 text-[var(--muted)]">
          <ChapterDate chapter={chapter} />
        </p>
        <TypeText
          as="h3"
          className="mt-5 font-display text-2xl leading-tight italic"
          speed={28}
          text={chapter.title}
        />
        <TypeText
          className="mt-3 max-w-prose text-base leading-7"
          text={chapter.text}
        />
      </div>
      <div className="relative z-10 flex flex-wrap items-start justify-center gap-5 md:gap-3">
        {chapter.photos.map((photo, index) => (
          <Polaroid index={index} key={photo.src} photo={photo} side={side} />
        ))}
      </div>
    </section>
  );
}

/**
 * Year One as a scroll story: a route drawing itself behind the chapters,
 * text writing itself, polaroids taped in. Native scrolling only (smooth on
 * iPhone); reduced motion gets the whole story laid out still.
 */
export function Story({
  intro,
  chapters,
}: {
  intro: string;
  chapters: readonly StoryChapter[];
}) {
  const body = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const { scrollYProgress } = useScroll({
    target: body,
    offset: ["start 60%", "end 80%"],
  });
  const drawn = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  // The route is drawn in real pixels of the story column (no stretching).
  const [box, setBox] = useState({ width: 100, height: chapters.length * 100 });
  useEffect(() => {
    const host = body.current;
    if (!host) return;
    const observer = new ResizeObserver(([entry]) =>
      setBox({
        width: Math.round(entry.contentRect.width),
        height: Math.round(entry.contentRect.height),
      }),
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, []);
  const d = routePath(chapters.length, box.width, box.height);

  return (
    <>
      <TypeText
        className="mt-6 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg"
        text={intro}
      />

      {/* The counter sticks only while the chapters scroll by. */}
      <div>
        <div
          aria-hidden="true"
          className="sticky top-[8.1rem] z-20 mx-auto mt-8 w-fit rounded-full bg-[var(--ink)] px-4 py-2 font-mono text-[0.65rem] tracking-[0.16em] text-[var(--paper-white)] uppercase shadow-lg"
        >
          Chapter{" "}
          <RollingNumber
            format={{ minimumIntegerDigits: 2 }}
            value={current + 1}
          />{" "}
          / {String(chapters.length).padStart(2, "0")}
        </div>

        <div className="relative" ref={body}>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox={`0 0 ${box.width} ${box.height}`}
          >
            <path
              d={d}
              fill="none"
              stroke="var(--line-strong)"
              strokeDasharray="2 6"
              strokeWidth={1.5}
            />
            <motion.path
              d={d}
              fill="none"
              stroke="var(--rust)"
              strokeLinecap="round"
              strokeWidth={3}
              className="motion-reduce:![stroke-dasharray:none] motion-reduce:![stroke-dashoffset:0]"
              style={{ pathLength: drawn }}
            />
          </svg>
          {chapters.map((chapter) => (
            <Chapter
              chapter={chapter}
              key={chapter.slug}
              onSeen={setCurrent}
              total={chapters.length}
            />
          ))}
        </div>
      </div>

      <section className="grid min-h-[80svh] place-items-center py-20 text-center">
        <div>
          <TypeText
            as="h2"
            className="font-display text-[clamp(2.6rem,10vw,5.5rem)] leading-[0.9] tracking-[-0.04em] italic"
            speed={60}
            text="Year Two — to be continued…"
          />
          <Link
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--ink)] px-6 text-xs font-bold tracking-[0.14em] text-[var(--paper-white)] uppercase transition hover:bg-[var(--oxblood)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]"
            href="/home"
          >
            Back home
          </Link>
        </div>
      </section>
    </>
  );
}
