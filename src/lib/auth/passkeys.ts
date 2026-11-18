/**
 * Pure rules for passkeys (WebAuthn). The ceremony itself is checked by
 * @simplewebauthn/server; this file decides which challenge, relying party
 * and stored passkey may be used. No I/O here, so it is tested directly.
 */

export type PasskeyScope = "visitor" | "admin";
export type ChallengePurpose = "register" | "login";

/** A challenge is good for five minutes, and for one ceremony only. */
export const CHALLENGE_TTL_SECONDS = 5 * 60;

export interface StoredChallenge {
  readonly challenge: string;
  readonly scope: PasskeyScope;
  readonly purpose: ChallengePurpose;
  /** Unix milliseconds. */
  readonly expiresAt: number;
}

export interface ChallengeStore {
  save(challenge: StoredChallenge): Promise<void>;
  /**
   * True once, and only if the challenge exists for this scope and
   * purpose, has not expired and was never used. Marks it used.
   */
  consume(
    challenge: string,
    scope: PasskeyScope,
    purpose: ChallengePurpose,
    now: number,
  ): Promise<boolean>;
}

const CHALLENGE = /^[A-Za-z0-9_-]{16,256}$/;

export function newChallenge(
  challenge: string,
  scope: PasskeyScope,
  purpose: ChallengePurpose,
  now: number,
): StoredChallenge {
  if (!CHALLENGE.test(challenge)) throw new Error("Invalid challenge.");
  return {
    challenge,
    scope,
    purpose,
    expiresAt: now + CHALLENGE_TTL_SECONDS * 1000,
  };
}

/** In memory: tests, and the same rules the SQL function applies. */
export function memoryChallengeStore(): ChallengeStore & {
  size(): number;
} {
  const rows = new Map<string, StoredChallenge & { used: boolean }>();
  return {
    async save(challenge) {
      rows.set(challenge.challenge, { ...challenge, used: false });
    },
    async consume(challenge, scope, purpose, now) {
      const row = rows.get(challenge);
      if (
        !row ||
        row.used ||
        row.scope !== scope ||
        row.purpose !== purpose ||
        row.expiresAt <= now
      )
        return false;
      row.used = true;
      return true;
    },
    size: () => rows.size,
  };
}

export interface PasskeyRecord {
  readonly id: string;
  readonly createdAt: string;
  readonly revokedAt: string | null;
}

/**
 * A passkey works until it is revoked, or until "log out of every device"
 * runs after it was created (revokedBefore: Unix seconds, 0 = never).
 */
export function passkeyUsable(
  passkey: PasskeyRecord,
  revokedBefore: number,
): boolean {
  if (passkey.revokedAt) return false;
  const created = Date.parse(passkey.createdAt);
  if (Number.isNaN(created)) return false;
  return Math.floor(created / 1000) >= revokedBefore;
}

/**
 * Relying party: WEBAUTHN_RP_ID (the site's domain, e.g. example.com) in
 * production. Without it, the host the request came to is used, which
 * covers localhost in development. The origin must match exactly.
 */
export function relyingParty(
  envRpId: string | undefined,
  requestOrigin: string,
): { rpID: string; origin: string } {
  const url = new URL(requestOrigin);
  const rpID = (envRpId ?? "").trim().toLowerCase() || url.hostname;
  if (!/^[a-z0-9.-]+$/.test(rpID)) throw new Error("Invalid WEBAUTHN_RP_ID.");
  if (url.hostname !== rpID && !url.hostname.endsWith(`.${rpID}`))
    throw new Error("This site is not the passkey's relying party.");
  return { rpID, origin: url.origin };
}

/** "iPhone · Safari": a label for the panel, from the user agent. */
export function deviceLabel(userAgent: string): string {
  const device = /iPhone/.test(userAgent)
    ? "iPhone"
    : /iPad/.test(userAgent)
      ? "iPad"
      : /Android/.test(userAgent)
        ? "Android"
        : /Macintosh/.test(userAgent)
          ? "Mac"
          : /Windows/.test(userAgent)
            ? "Windows"
            : "Device";
  const browser = /Edg\//.test(userAgent)
    ? "Edge"
    : /CriOS|Chrome\//.test(userAgent)
      ? "Chrome"
      : /FxiOS|Firefox\//.test(userAgent)
        ? "Firefox"
        : /Safari\//.test(userAgent)
          ? "Safari"
          : "Browser";
  return `${device} · ${browser}`;
}
