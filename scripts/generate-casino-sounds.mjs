#!/usr/bin/env node
/**
 * Synthesises the Kiss Casino sound effects as small mono WAV files in
 * public/sounds/casino/. Everything is generated from sine/triangle waves and
 * noise, so the sounds are original to this project.
 *
 *   node scripts/generate-casino-sounds.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RATE = 22_050;
const out = join(process.cwd(), "public", "sounds", "casino");
mkdirSync(out, { recursive: true });

let seed = 1234567;
const noise = () => {
  seed = (seed * 1103515245 + 12345) >>> 0;
  return (seed / 4294967296) * 2 - 1;
};

function render(seconds, sample) {
  const length = Math.round(seconds * RATE);
  const data = new Float32Array(length);
  for (let i = 0; i < length; i++) data[i] = sample(i / RATE, i / length);
  return data;
}

function mix(...tracks) {
  const length = Math.max(...tracks.map((t) => t.length));
  const data = new Float32Array(length);
  for (const t of tracks) for (let i = 0; i < t.length; i++) data[i] += t[i];
  return data;
}

function offset(track, seconds) {
  const pad = Math.round(seconds * RATE);
  const data = new Float32Array(track.length + pad);
  data.set(track, pad);
  return data;
}

const env = (p, attack = 0.01, release = 0.9) =>
  p < attack ? p / attack : Math.max(0, 1 - (p - attack) / release) ** 2;
const sine = (f, t) => Math.sin(2 * Math.PI * f * t);
const tri = (f, t) => (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * f * t));

function note(freq, seconds, volume = 0.35, shape = sine) {
  return render(
    seconds,
    (t, p) => shape(freq, t) * env(p, 0.02, 0.98) * volume,
  );
}

function bell(freq, seconds, volume = 0.3) {
  return render(seconds, (t, p) => {
    const decay = Math.exp(-4 * p);
    return (
      (sine(freq, t) * 0.6 +
        sine(freq * 2.76, t) * 0.25 +
        sine(freq * 5.4, t) * 0.15) *
      decay *
      volume
    );
  });
}

function save(name, data) {
  let peak = 0;
  for (const v of data) peak = Math.max(peak, Math.abs(v));
  const scale = peak > 0.95 ? 0.95 / peak : 1;
  const buffer = Buffer.alloc(44 + data.length * 2);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + data.length * 2, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(RATE, 24);
  buffer.writeUInt32LE(RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(data.length * 2, 40);
  data.forEach((v, i) =>
    buffer.writeInt16LE(
      Math.round(Math.max(-1, Math.min(1, v * scale)) * 32767),
      44 + i * 2,
    ),
  );
  writeFileSync(join(out, `${name}.wav`), buffer);
  console.log(`${name}.wav  ${(buffer.length / 1024).toFixed(1)} kB`);
}

// Reels whirring: a ratchet of soft clicks (loopable).
save(
  "spin",
  render(0.6, (t) => {
    const phase = (t * 22) % 1;
    return (
      (phase < 0.08 ? noise() * (1 - phase / 0.08) : 0) * 0.35 +
      sine(90, t) * 0.04
    );
  }),
);
// A reel stopping: a short wooden thunk.
save(
  "stop",
  render(
    0.14,
    (t, p) =>
      (sine(140 - 60 * p, t) * 0.6 + noise() * 0.15) * env(p, 0.005, 0.9),
  ),
);
// Coin clink.
save("coin", mix(bell(2093, 0.25, 0.25), offset(bell(2637, 0.3, 0.2), 0.06)));
// Small win jingle: C–E–G.
save(
  "win",
  mix(
    note(523, 0.16, 0.3, tri),
    offset(note(659, 0.16, 0.3, tri), 0.11),
    offset(note(784, 0.32, 0.3, tri), 0.22),
  ),
);
// Big win fanfare.
save(
  "bigwin",
  mix(
    note(523, 0.2, 0.28, tri),
    offset(note(659, 0.2, 0.28, tri), 0.14),
    offset(note(784, 0.2, 0.28, tri), 0.28),
    offset(note(1047, 0.6, 0.32, tri), 0.42),
    offset(bell(1047, 0.8, 0.18), 0.42),
  ),
);
// Jackpot bell and a short melody.
save(
  "jackpot",
  mix(
    bell(1319, 1.4, 0.35),
    offset(bell(1568, 1.2, 0.3), 0.18),
    offset(bell(2093, 1.0, 0.28), 0.36),
    offset(note(784, 0.18, 0.25, tri), 0.6),
    offset(note(988, 0.18, 0.25, tri), 0.74),
    offset(note(1175, 0.18, 0.25, tri), 0.88),
    offset(note(1568, 0.7, 0.3, tri), 1.02),
  ),
);
// Scratch: filtered noise bursts.
{
  let last = 0;
  save(
    "scratch",
    render(0.35, (t, p) => {
      last = last * 0.7 + noise() * 0.3;
      return last * (0.6 + 0.4 * Math.sin(t * 60)) * env(p, 0.05, 0.9) * 0.9;
    }),
  );
}
// Wheel peg tick.
save(
  "tick",
  render(0.03, (t, p) => (noise() * 0.6 + sine(1800, t) * 0.4) * (1 - p) ** 3),
);
// Card dealt: a quick swish.
{
  let last = 0;
  save(
    "card",
    render(0.16, (t, p) => {
      last = last * 0.5 + noise() * 0.5;
      return last * Math.sin(Math.PI * p) * 0.5;
    }),
  );
}
// Coin flip whoosh with a ring.
save(
  "flip",
  mix(
    render(
      0.5,
      (t, p) => sine(600 + 900 * p, t) * Math.sin(Math.PI * p) * 0.18,
    ),
    offset(bell(2349, 0.4, 0.15), 0.45),
  ),
);
// Soft lose blip.
save(
  "lose",
  render(0.18, (t, p) => sine(220 - 80 * p, t) * env(p, 0.01, 0.9) * 0.25),
);
// Suspense heartbeat.
save(
  "heartbeat",
  mix(
    render(0.12, (t, p) => sine(60, t) * env(p, 0.01, 0.8) * 0.8),
    offset(
      render(0.12, (t, p) => sine(55, t) * env(p, 0.01, 0.8) * 0.6),
      0.2,
    ),
  ),
);
// Ball rolling in the roulette.
save(
  "roll",
  render(0.8, (t, p) => {
    const phase = (t * (40 - 25 * p)) % 1;
    return (phase < 0.05 ? noise() * 0.5 : 0) + sine(300, t) * 0.02;
  }),
);
