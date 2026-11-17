"use client";

import { useEffect, useRef, useState } from "react";

import { Portal } from "@/components/ui/portal";
import { useModalDialog } from "@/hooks/use-modal-dialog";

import type { City } from "../lib/schemas";
import { isNightAt, weatherIcon, type CityWeather } from "../lib/weather";

export interface CityWithWeather {
  city: City;
  weather: CityWeather | null;
}

function timeIn(timeZone: string, now: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).format(now);
}

function weekday(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00Z`));
}

/** "Rome 9:12 ☀️ 14° · Cartagena 3:12 🌙 27° …" — live, tap for the forecast. */
export function CityClocks({ items }: { items: CityWithWeather[] }) {
  const [now, setNow] = useState<Date | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const triggers = useRef<(HTMLButtonElement | null)[]>([]);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 10_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  const { dialogRef, onKeyDown } = useModalDialog({
    initialFocusRef: closeRef,
    isOpen: open !== null,
    onClose: () => setOpen(null),
    returnFocusRef: returnRef,
  });

  const selected = open === null ? null : items[open];

  return (
    <>
      <ul
        aria-label="Our cities, live"
        className="flex snap-x gap-2 overflow-x-auto pb-1 [scrollbar-width:none]"
      >
        {items.map(({ city, weather }, index) => {
          const night = weather
            ? !weather.isDay
            : now
              ? isNightAt(city.timeZone, now)
              : false;
          const icon = weather
            ? weatherIcon(weather.code, weather.isDay).icon
            : night
              ? "🌙"
              : "☀️";
          return (
            <li className="shrink-0 snap-start" key={`${city.name}-${index}`}>
              <button
                className={`flex min-h-12 items-center gap-2 rounded-full border px-3.5 text-sm transition ${
                  night
                    ? "border-[#2b3a63] bg-[#1d2742] text-[#e8ecff]"
                    : "border-[var(--line)] bg-[var(--paper-white)] text-[var(--ink)]"
                }`}
                onClick={() => {
                  returnRef.current = triggers.current[index];
                  setOpen(index);
                }}
                ref={(element) => {
                  triggers.current[index] = element;
                }}
                type="button"
              >
                <span className="font-semibold">{city.name}</span>
                <span
                  className="font-mono tabular-nums"
                  suppressHydrationWarning
                >
                  {now ? timeIn(city.timeZone, now) : "--:--"}
                </span>
                <span aria-hidden="true">{icon}</span>
                {weather ? <span>{weather.temperature}°</span> : null}
                {city.who ? (
                  <span className="text-xs opacity-70">· {city.who}</span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>

      {selected ? (
        <Portal>
          <div
            aria-labelledby="city-title"
            aria-modal="true"
            className="fixed inset-0 z-[80] grid place-items-end bg-black/45 p-3 sm:place-items-center"
            onKeyDown={onKeyDown}
            onMouseDown={(event) =>
              event.target === event.currentTarget && setOpen(null)
            }
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
          >
            <div className="w-full max-w-sm rounded-[1.6rem] bg-[var(--paper-white)] p-5 shadow-xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-3xl" id="city-title">
                    {selected.city.name}
                  </h2>
                  <p className="text-sm text-[var(--muted)]">
                    {now ? timeIn(selected.city.timeZone, now) : ""}
                    {selected.city.who ? ` · ${selected.city.who} is here` : ""}
                  </p>
                </div>
                <button
                  className="min-h-11 rounded-full border border-[var(--line-strong)] px-4 text-sm"
                  onClick={() => setOpen(null)}
                  ref={closeRef}
                  type="button"
                >
                  Close
                </button>
              </div>
              {selected.weather ? (
                <ul className="mt-4 grid gap-1.5">
                  {selected.weather.daily.map((day) => {
                    const w = weatherIcon(day.code);
                    return (
                      <li
                        className="flex items-center justify-between gap-3 rounded-xl bg-[var(--paper)] px-3 py-2 text-sm"
                        key={day.date}
                      >
                        <span className="w-16">{weekday(day.date)}</span>
                        <span aria-hidden="true" className="text-lg">
                          {w.icon}
                        </span>
                        <span className="flex-1 text-[var(--muted)]">
                          {w.label}
                        </span>
                        <span className="tabular-nums">
                          {day.max}°{" "}
                          <span className="text-[var(--muted)]">
                            {day.min}°
                          </span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-[var(--muted)]">
                  The weather service isn&apos;t answering right now. The clock
                  still works.
                </p>
              )}
            </div>
          </div>
        </Portal>
      ) : null}
    </>
  );
}
