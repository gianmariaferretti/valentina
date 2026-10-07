import "server-only";

import { cookies } from "next/headers";

import type { OpenWhenStateRepository } from "@/features/open-when/repositories/open-when-state-repository";
import {
  EMPTY_OPEN_WHEN_STATE,
  type ClaimedRewardRecord,
  type OpenedLetterRecord,
  type OpenWhenState,
} from "@/features/open-when/types";
import { decodeSignedState, encodeSignedState } from "@/lib/auth/signed-state";

const OPEN_WHEN_STATE_COOKIE = "vg_open_when_state";
const COOKIE_DURATION_SECONDS = 60 * 60 * 24 * 365;

function isDate(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isOpenedLetter(value: unknown): value is OpenedLetterRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.slug === "string" && isDate(record.openedAt);
}

function isClaimedReward(value: unknown): value is ClaimedRewardRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return typeof record.rewardId === "string" && isDate(record.claimedAt);
}

function parseState(value: string | undefined): OpenWhenState {
  const parsed = decodeSignedState(value);
  if (!parsed || typeof parsed !== "object") return EMPTY_OPEN_WHEN_STATE;

  const record = parsed as Record<string, unknown>;
  const openedLetters = Array.isArray(record.openedLetters)
    ? record.openedLetters.filter(isOpenedLetter)
    : [];
  const claimedRewards = Array.isArray(record.claimedRewards)
    ? record.claimedRewards.filter(isClaimedReward)
    : [];

  return { version: 1, openedLetters, claimedRewards };
}

export class CookieOpenWhenStateRepository implements OpenWhenStateRepository {
  async get(): Promise<OpenWhenState> {
    const cookieStore = await cookies();
    return parseState(cookieStore.get(OPEN_WHEN_STATE_COOKIE)?.value);
  }

  async save(state: OpenWhenState): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set(OPEN_WHEN_STATE_COOKIE, encodeSignedState(state), {
      httpOnly: true,
      maxAge: COOKIE_DURATION_SECONDS,
      path: "/",
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });
  }
}
