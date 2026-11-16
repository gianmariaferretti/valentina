import type { CasinoActionResult } from "../actions";
import type { CasinoView } from "../lib/engine";
import type { CasinoSoundApi } from "./sounds";

/** What every game receives from the casino shell. */
export interface GameProps {
  view: CasinoView;
  turbo: boolean;
  /** Another action (shop, claim, double) is running. */
  busy: boolean;
  /** A decision or celebration is on screen: auto-play waits. */
  paused: boolean;
  sound: CasinoSoundApi;
  /** Takes the bet off the displayed balance straight away. */
  spend: (amount: number) => void;
  /** Shows the result: coins, coupons, celebrations, the new balance. */
  onResult: (
    result: CasinoActionResult,
    origin: Element | null,
  ) => Promise<void>;
  setQuip: (quip: string) => void;
}

export const connectionLost: CasinoActionResult = {
  ok: false,
  message: "The connection dropped. Nothing was charged — try again.",
};
