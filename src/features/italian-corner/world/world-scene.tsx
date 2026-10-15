"use client";

import Image from "next/image";
import { useState } from "react";

import { worldCharacters, worldForLesson } from "@/data/italian-world";

function motionFamily(name: string): string {
  if (/steam|boiling|oven|torch|flame/.test(name)) return "steam";
  if (/water|wave|reflection/.test(name)) return "water";
  if (/flag|banner|curtain|awning|ribbon|grass|leaf|leaves/.test(name))
    return "sway";
  if (/page|paper|menu|book|newspaper|press/.test(name)) return "page";
  if (/train|tram|boat|gondola|car|scooter|wheel/.test(name)) return "travel";
  if (/bird|pigeon|gull/.test(name)) return "bird";
  if (/confetti|flour|snow|dust/.test(name)) return "fall";
  return "glow";
}

export function WorldScene({
  number,
  title,
  objective,
  level,
  volume,
  step,
  totalSteps,
  percent,
}: {
  number: number;
  title: string;
  objective: string | null;
  level: string;
  volume: number;
  step: number;
  totalSteps: number;
  percent: number;
}) {
  const world = worldForLesson(number);
  const [message, setMessage] = useState("");
  if (!world) return null;
  const character = worldCharacters[world.characterId];

  return (
    <header
      className="academy-scene"
      style={{ "--world-accent": world.palette.accent } as React.CSSProperties}
    >
      <div className="academy-scene-visual">
        <Image
          alt={`${world.name}: ${world.scenery.join(", ")}`}
          className="academy-scene-background"
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          src={`/images/academy/world-${world.id}.webp`}
        />
        <div aria-hidden="true" className="academy-scene-depth" />
        {world.motion.map((motion, index) => (
          <span
            aria-hidden="true"
            className={`academy-scene-motion academy-scene-motion--${motionFamily(motion)}`}
            data-motion={motion}
            key={`${motion}-${index}`}
            style={{ "--motion-index": index } as React.CSSProperties}
          />
        ))}
        <button
          aria-label={`Explore the ${world.interactiveProp}`}
          className="academy-scene-prop academy-focus"
          onClick={() => setMessage(world.easterEgg)}
          type="button"
        >
          <span aria-hidden="true">✦</span> Explore {world.interactiveProp}
        </button>
        <button
          aria-label={`Meet ${character.name}`}
          className="academy-scene-character academy-focus"
          onClick={() =>
            setMessage(
              world.characterId === "pippo"
                ? "Miao! Anche io studio italiano."
                : `${character.name} is travelling with you.`,
            )
          }
          type="button"
        >
          <Image
            alt=""
            aria-hidden="true"
            fill
            priority
            sizes="(max-width: 640px) 95px, 170px"
            src={`/images/academy/character-${world.characterId}.webp`}
          />
          <span>{character.name}</span>
        </button>
      </div>
      <div className="academy-scene-copy">
        <p className="academy-scene-kicker">
          {world.name} · Volume {volume} · {level}
        </p>
        <h1>{title}</h1>
        {objective ? (
          <p className="academy-scene-objective">
            <strong>Obiettivo</strong> {objective}
          </p>
        ) : null}
        <div className="academy-scene-progress">
          <span>
            Lezione {String(number).padStart(3, "0")} · Sezione {step + 1}/
            {totalSteps}
          </span>
          <div
            aria-label={`${percent}% della lezione visualizzato`}
            aria-valuemax={100}
            aria-valuemin={0}
            aria-valuenow={percent}
            role="progressbar"
          >
            <span style={{ width: `${percent}%` }} />
          </div>
        </div>
        {message ? (
          <p className="academy-scene-easter-egg" role="status">
            {message}
          </p>
        ) : null}
      </div>
    </header>
  );
}
