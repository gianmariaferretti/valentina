import "server-only";

import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from "@simplewebauthn/server";
import type {
  AuthenticationResponseJSON,
  AuthenticatorTransport,
  RegistrationResponseJSON,
} from "@simplewebauthn/server";
import { headers } from "next/headers";

import { getSupabaseServerContext } from "@/lib/supabase/server";

import {
  newChallenge,
  passkeyUsable,
  relyingParty,
  type ChallengePurpose,
  type ChallengeStore,
  type PasskeyScope,
} from "./passkeys";
import { getRevokedBefore } from "./revocation";

/**
 * Passkeys on Supabase: challenges (five minutes, single use) and the
 * registered devices. Until the migration is applied every call throws
 * PasskeysNotReady and the site keeps using the access code only.
 */

export class PasskeysNotReady extends Error {
  constructor() {
    super("Passkeys are not set up yet.");
  }
}

interface PasskeyRow {
  id: string;
  public_key: string;
  counter: number;
  transports: string[];
  device: string | null;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

// The generated database types do not know these tables until the
// migration is applied.
type Query = PromiseLike<{ data: unknown; error: unknown }> & {
  [method: string]: (...args: unknown[]) => Query;
};
function from(table: string): Query {
  const { client } = getSupabaseServerContext();
  return (client as unknown as { from: (t: string) => Query }).from(table);
}
function rpc(name: string, args: Record<string, unknown>) {
  const { client } = getSupabaseServerContext();
  return (
    client as unknown as {
      rpc: (
        n: string,
        a: Record<string, unknown>,
      ) => PromiseLike<{ data: unknown; error: unknown }>;
    }
  ).rpc(name, args);
}

function check(error: unknown) {
  if (!error) return;
  const code = (error as { code?: string }).code;
  if (code === "PGRST205" || code === "PGRST202" || code === "42P01")
    throw new PasskeysNotReady();
  throw new Error(String((error as { message?: string }).message ?? error));
}

const toHex = (bytes: Uint8Array) => `\\x${Buffer.from(bytes).toString("hex")}`;
const fromHex = (value: string) =>
  new Uint8Array(Buffer.from(value.replace(/^\\x/, ""), "hex"));

export const supabaseChallengeStore: ChallengeStore = {
  async save(challenge) {
    const { error } = await from("webauthn_challenges").insert({
      challenge: challenge.challenge,
      scope: challenge.scope,
      purpose: challenge.purpose,
      expires_at: new Date(challenge.expiresAt).toISOString(),
    });
    check(error);
  },
  async consume(challenge, scope, purpose) {
    const { data, error } = await rpc("consume_webauthn_challenge", {
      p_challenge: challenge,
      p_scope: scope,
      p_purpose: purpose,
    });
    check(error);
    return data === true;
  },
};

async function requestRelyingParty() {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost";
  const proto =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  const origin = h.get("origin") ?? `${proto}://${host}`;
  return relyingParty(process.env.WEBAUTHN_RP_ID, origin);
}

/**
 * Burns the challenge inside the verification: it passes only if it was
 * issued here, for this purpose, less than five minutes ago, never used.
 */
const burn =
  (scope: PasskeyScope, purpose: ChallengePurpose, store: ChallengeStore) =>
  (challenge: string) =>
    store.consume(challenge, scope, purpose, Date.now());

const USER_ID = new TextEncoder().encode("vg-valentina");

export async function registrationOptions(scope: PasskeyScope = "visitor") {
  const { rpID } = await requestRelyingParty();
  const existing = await listPasskeys(scope);
  const options = await generateRegistrationOptions({
    rpName: "V+G",
    rpID,
    userName: scope === "visitor" ? "Valentina" : "Gianmaria",
    userID: USER_ID,
    attestationType: "none",
    excludeCredentials: existing
      .filter((key) => !key.revokedAt)
      .map((key) => ({ id: key.id })),
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
    },
    preferredAuthenticatorType: "localDevice",
  });
  await supabaseChallengeStore.save(
    newChallenge(options.challenge, scope, "register", Date.now()),
  );
  return options;
}

export async function registerPasskey(
  response: RegistrationResponseJSON,
  device: string,
  scope: PasskeyScope = "visitor",
): Promise<boolean> {
  const { rpID, origin } = await requestRelyingParty();
  const result = await verifyRegistrationResponse({
    response,
    expectedChallenge: burn(scope, "register", supabaseChallengeStore),
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  }).catch(() => null);
  if (!result?.verified || !result.registrationInfo) return false;
  const { credential } = result.registrationInfo;
  const { error } = await from("passkeys").insert({
    id: credential.id,
    scope,
    public_key: toHex(credential.publicKey),
    counter: credential.counter,
    transports: credential.transports ?? [],
    device: device.slice(0, 80),
  });
  check(error);
  return true;
}

export async function loginOptions(scope: PasskeyScope = "visitor") {
  const { rpID } = await requestRelyingParty();
  // Discoverable credentials: the device offers its own passkey.
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: [],
  });
  await supabaseChallengeStore.save(
    newChallenge(options.challenge, scope, "login", Date.now()),
  );
  return options;
}

/** True when the passkey proved it is Valentina's registered device. */
export async function verifyPasskeyLogin(
  response: AuthenticationResponseJSON,
  scope: PasskeyScope = "visitor",
): Promise<boolean> {
  if (typeof response?.id !== "string") return false;
  const { data, error } = await from("passkeys")
    .select("id, public_key, counter, transports, created_at, revoked_at")
    .eq("id", response.id)
    .eq("scope", scope)
    .maybeSingle();
  check(error);
  const row = data as PasskeyRow | null;
  if (
    !row ||
    !passkeyUsable(
      { id: row.id, createdAt: row.created_at, revokedAt: row.revoked_at },
      await getRevokedBefore(scope),
    )
  )
    return false;
  const { rpID, origin } = await requestRelyingParty();
  const result = await verifyAuthenticationResponse({
    response,
    expectedChallenge: burn(scope, "login", supabaseChallengeStore),
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: row.id,
      publicKey: fromHex(row.public_key),
      counter: Number(row.counter),
      transports: row.transports as AuthenticatorTransport[],
    },
  }).catch(() => null);
  if (!result?.verified) return false;
  const update = await from("passkeys")
    .update({
      counter: result.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", row.id);
  check(update.error);
  return true;
}

export interface PasskeySummary {
  readonly id: string;
  readonly device: string | null;
  readonly createdAt: string;
  readonly lastUsedAt: string | null;
  readonly revokedAt: string | null;
  /** False after a revoke, or after "log out of every device". */
  readonly usable: boolean;
}

export async function listPasskeys(
  scope: PasskeyScope = "visitor",
): Promise<PasskeySummary[]> {
  const { data, error } = await from("passkeys")
    .select("id, device, created_at, last_used_at, revoked_at")
    .eq("scope", scope)
    .order("created_at", { ascending: false });
  check(error);
  const revokedBefore = await getRevokedBefore(scope);
  return ((data ?? []) as PasskeyRow[]).map((row) => ({
    id: row.id,
    device: row.device,
    createdAt: row.created_at,
    lastUsedAt: row.last_used_at,
    revokedAt: row.revoked_at,
    usable: passkeyUsable(
      { id: row.id, createdAt: row.created_at, revokedAt: row.revoked_at },
      revokedBefore,
    ),
  }));
}

export async function revokePasskey(id: string) {
  const { error } = await from("passkeys")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id)
    .is("revoked_at", null);
  check(error);
}
