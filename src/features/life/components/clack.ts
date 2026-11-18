"use client";

/**
 * The "clack" of a flap, synthesised with WebAudio (a few milliseconds of
 * filtered noise): no audio file to download, nothing to license. Off by
 * default; the choice is remembered on this device.
 */

const KEY = "vg.board.sound";
let context: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let last = 0;

export function boardSoundWanted(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function rememberBoardSound(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? "1" : "0");
  } catch {
    // Private mode: the switch still works for this visit.
  }
}

/** Must run inside a tap (iOS only starts audio from a user gesture). */
export function unlockClack() {
  if (context) return void context.resume();
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return;
  context = new Ctor();
  const length = Math.floor(context.sampleRate * 0.03);
  noise = context.createBuffer(1, length, context.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < length; i++)
    data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
}

/** One soft clack; bursts are thinned so a whole row sounds like a board. */
export function clack() {
  if (!context || !noise || context.state !== "running") return;
  const now = context.currentTime;
  if (now - last < 0.035) return;
  last = now;
  const source = context.createBufferSource();
  source.buffer = noise;
  source.playbackRate.value = 0.85 + Math.random() * 0.3;
  const filter = context.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 2200 + Math.random() * 900;
  filter.Q.value = 1.4;
  const gain = context.createGain();
  gain.gain.value = 0.12;
  source.connect(filter).connect(gain).connect(context.destination);
  source.start(now);
}
