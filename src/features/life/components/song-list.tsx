"use client";

import { useState } from "react";

import { HighlightedText } from "@/components/annotations/highlighted-text";

import { spotifyEmbed } from "../lib/schemas";
import type { Song } from "../repositories/life";
import styles from "./songs.module.css";

const labels = ["#d6114f", "#f2c84b", "#34596d", "#93463e", "#afc99d"];
const when = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function SongList({ songs }: { songs: Song[] }) {
  const [playing, setPlaying] = useState<string | null>(null);
  if (songs.length === 0)
    return (
      <p className="text-[var(--muted)]">
        No songs yet. Gianmaria is still choosing.
      </p>
    );
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {songs.map((song, index) => {
        const embed = spotifyEmbed(song.spotifyUrl);
        const open = playing === song.id;
        return (
          <li className={styles.card} key={song.id}>
            <span
              aria-hidden="true"
              className={`${styles.vinyl} ${open ? styles.spinning : ""}`}
              style={{ ["--label" as string]: labels[index % labels.length] }}
            />
            <div className="min-w-0">
              <p className="font-display text-2xl leading-tight">
                {song.title}
              </p>
              <p className="text-sm text-[var(--muted)]">{song.artist}</p>
              {song.date || song.place ? (
                <p className="mt-1 text-xs font-semibold tracking-[0.08em] text-[var(--rust)] uppercase">
                  {[
                    song.date
                      ? when.format(new Date(`${song.date}T12:00:00Z`))
                      : null,
                    song.place,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
              {song.why ? (
                <p className="mt-2 text-sm leading-6">
                  <HighlightedText text={song.why} />
                </p>
              ) : null}
              {embed ? (
                <button
                  aria-pressed={open}
                  className="mt-3 min-h-11 rounded-full bg-[var(--ink)] px-4 text-sm font-semibold text-[var(--paper-white)]"
                  onClick={() => setPlaying(open ? null : song.id)}
                  type="button"
                >
                  {open ? "■ Close player" : "▶ Play"}
                </button>
              ) : (
                <p className="mt-3 text-xs text-[var(--muted)]">
                  No Spotify link yet.
                </p>
              )}
            </div>
            {open && embed ? (
              <iframe
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className={styles.player}
                loading="lazy"
                referrerPolicy="no-referrer"
                src={`${embed}?utm_source=generator&theme=0`}
                title={`${song.title} on Spotify`}
              />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
