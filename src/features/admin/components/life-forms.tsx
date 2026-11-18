"use client";

import { useState } from "react";

import type { City } from "@/features/life/lib/schemas";
import type { Song } from "@/features/life/repositories/life";

import { ActionButton, useAdminAction, type ActionResult } from "./admin-ui";
import { buttonClass, inputClass } from "./styles";

export function NextTimeForm({
  initial,
  save,
}: {
  initial: { at: string; from: string; to: string; status: string };
  save: (form: FormData) => Promise<ActionResult>;
}) {
  const { pending, run } = useAdminAction();
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        run(() => save(form));
      }}
    >
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold">Arrivo (ora di Roma)</span>
        <input
          className={inputClass}
          defaultValue={initial.at}
          name="at"
          type="datetime-local"
        />
        <span className="text-xs text-[var(--muted)]">
          Vuoto = “Date to be announced”.
        </span>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold">Partenza da</span>
          <input
            className={inputClass}
            defaultValue={initial.from}
            maxLength={40}
            name="from"
            required
          />
        </label>
        <label className="grid gap-1.5 text-sm">
          <span className="font-semibold">Arrivo a</span>
          <input
            className={inputClass}
            defaultValue={initial.to}
            maxLength={40}
            name="to"
            required
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold">Stato sul tabellone</span>
        <select
          className={inputClass}
          defaultValue={initial.status}
          name="status"
        >
          <option value="on-time">ON TIME</option>
          <option value="delayed">DELAYED (scherzoso)</option>
          <option value="boarding">NOW BOARDING</option>
        </select>
      </label>
      <button
        className={buttonClass("primary", "w-full sm:w-auto")}
        disabled={pending}
        type="submit"
      >
        {pending ? "Salvo…" : "Salva"}
      </button>
    </form>
  );
}

export function CitiesForm({
  initial,
  save,
}: {
  initial: City[];
  save: (json: string) => Promise<ActionResult>;
}) {
  const [cities, setCities] = useState(initial);
  const { pending, run } = useAdminAction();
  const update = (index: number, patch: Partial<City>) =>
    setCities((list) =>
      list.map((city, i) => (i === index ? { ...city, ...patch } : city)),
    );
  return (
    <div className="grid gap-3">
      {cities.map((city, index) => (
        <div
          className="grid gap-2 rounded-2xl bg-[var(--paper)] p-3 sm:grid-cols-[1fr_1fr_6rem_6rem_1fr_auto]"
          key={index}
        >
          <input
            aria-label="Nome"
            className={inputClass}
            onChange={(e) => update(index, { name: e.target.value })}
            placeholder="Nome"
            value={city.name}
          />
          <input
            aria-label="Fuso orario"
            className={inputClass}
            onChange={(e) => update(index, { timeZone: e.target.value })}
            placeholder="Europe/Rome"
            value={city.timeZone}
          />
          <input
            aria-label="Latitudine"
            className={inputClass}
            inputMode="decimal"
            onChange={(e) =>
              update(index, { latitude: Number(e.target.value) })
            }
            placeholder="Lat"
            value={city.latitude}
          />
          <input
            aria-label="Longitudine"
            className={inputClass}
            inputMode="decimal"
            onChange={(e) =>
              update(index, { longitude: Number(e.target.value) })
            }
            placeholder="Lon"
            value={city.longitude}
          />
          <input
            aria-label="Chi c'è"
            className={inputClass}
            onChange={(e) => update(index, { who: e.target.value })}
            placeholder="Chi c'è"
            value={city.who}
          />
          <div className="flex gap-1">
            <button
              aria-label="Su"
              className={buttonClass("ghost")}
              disabled={index === 0}
              onClick={() =>
                setCities((l) => {
                  const n = [...l];
                  [n[index - 1], n[index]] = [n[index], n[index - 1]];
                  return n;
                })
              }
              type="button"
            >
              ↑
            </button>
            <button
              aria-label="Rimuovi"
              className={buttonClass("ghost")}
              disabled={cities.length === 1}
              onClick={() => setCities((l) => l.filter((_, i) => i !== index))}
              type="button"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button
          className={buttonClass("ghost")}
          disabled={cities.length >= 8}
          onClick={() =>
            setCities((l) => [
              ...l,
              {
                name: "",
                timeZone: "Europe/Rome",
                latitude: 0,
                longitude: 0,
                who: "",
              },
            ])
          }
          type="button"
        >
          + Città
        </button>
        <button
          className={buttonClass("primary")}
          disabled={pending}
          onClick={() => run(() => save(JSON.stringify(cities)))}
          type="button"
        >
          {pending ? "Salvo…" : "Salva città"}
        </button>
      </div>
      <p className="text-xs text-[var(--muted)]">
        Fusi orari: Europe/Rome, America/Bogota, Europe/Berlin… Latitudine e
        longitudine servono per il meteo.
      </p>
    </div>
  );
}

export interface SongActions {
  create: (form: FormData) => Promise<ActionResult>;
  update: (id: string, form: FormData) => Promise<ActionResult>;
  remove: (id: string) => Promise<ActionResult>;
  move: (id: string, direction: number) => Promise<ActionResult>;
}

function SongForm({
  song,
  submit,
  label,
  onDone,
}: {
  song?: Song;
  submit: (form: FormData) => Promise<ActionResult>;
  label: string;
  onDone?: () => void;
}) {
  const { pending, run } = useAdminAction();
  return (
    <form
      className="grid gap-2 sm:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const element = event.currentTarget;
        run(async () => {
          const result = await submit(form);
          if (result.ok) {
            if (!song) element.reset();
            onDone?.();
          }
          return result;
        });
      }}
    >
      <input
        aria-label="Titolo"
        className={inputClass}
        defaultValue={song?.title}
        maxLength={140}
        name="title"
        placeholder="Titolo"
        required
      />
      <input
        aria-label="Artista"
        className={inputClass}
        defaultValue={song?.artist}
        maxLength={140}
        name="artist"
        placeholder="Artista"
        required
      />
      <input
        aria-label="Link Spotify"
        className={`${inputClass} sm:col-span-2`}
        defaultValue={song?.spotifyUrl ?? ""}
        name="spotifyUrl"
        placeholder="https://open.spotify.com/track/…"
      />
      <input
        aria-label="Data"
        className={inputClass}
        defaultValue={song?.date ?? ""}
        name="date"
        type="date"
      />
      <input
        aria-label="Posto"
        className={inputClass}
        defaultValue={song?.place ?? ""}
        maxLength={120}
        name="place"
        placeholder="Dove"
      />
      <textarea
        aria-label="Perché"
        className={`${inputClass} min-h-20 sm:col-span-2`}
        defaultValue={song?.why ?? ""}
        maxLength={600}
        name="why"
        placeholder="Il perché, in poche righe (in inglese). ==Così== per l'evidenziatore"
      />
      <button
        className={buttonClass("primary", "sm:col-span-2 sm:w-auto")}
        disabled={pending}
        type="submit"
      >
        {pending ? "Salvo…" : label}
      </button>
    </form>
  );
}

export function SongManager({
  songs,
  actions,
}: {
  songs: Song[];
  actions: SongActions;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="grid gap-4">
      <ul className="divide-y divide-[var(--line)]">
        {songs.map((song) => (
          <li className="grid gap-2 py-3" key={song.id}>
            {editing === song.id ? (
              <SongForm
                label="Salva"
                onDone={() => setEditing(null)}
                song={song}
                submit={(form) => actions.update(song.id, form)}
              />
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">🎵 {song.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {song.artist}
                    {song.spotifyUrl ? " · Spotify ✓" : " · senza link"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <ActionButton action={() => actions.move(song.id, -1)}>
                    ↑
                  </ActionButton>
                  <ActionButton action={() => actions.move(song.id, 1)}>
                    ↓
                  </ActionButton>
                  <button
                    className={buttonClass("ghost")}
                    onClick={() => setEditing(song.id)}
                    type="button"
                  >
                    Modifica
                  </button>
                  <ActionButton
                    action={() => actions.remove(song.id)}
                    confirm={{
                      title: "Eliminare la canzone?",
                      body: `“${song.title}” sparisce dalla pagina.`,
                      confirmLabel: "Elimina",
                    }}
                    tone="danger"
                  >
                    Elimina
                  </ActionButton>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="rounded-2xl border border-dashed border-[var(--line-strong)] p-3">
        <p className="mb-2 text-sm font-semibold">Aggiungi una canzone</p>
        <SongForm label="Aggiungi" submit={actions.create} />
      </div>
    </div>
  );
}
