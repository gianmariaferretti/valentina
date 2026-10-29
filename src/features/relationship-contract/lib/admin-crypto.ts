import { createHmac, timingSafeEqual } from "node:crypto";

export type AdminConfigurationIssue =
  | "missing_access_secret"
  | "missing_or_short_passphrase"
  | "reused_site_code"
  | null;

export function adminConfigurationIssue(
  accessSecret: string | null,
  passphrase: string | undefined,
  siteCode: string | undefined,
): AdminConfigurationIssue {
  if (!accessSecret) return "missing_access_secret";
  if (!passphrase || passphrase.length < 4)
    return "missing_or_short_passphrase";
  if (siteCode && passphrase === siteCode) return "reused_site_code";
  return null;
}

export function adminSessionSignature(
  accessSecret: string,
  passphrase: string,
  accessToken: string,
  expires: string,
): string {
  // The separate administrator passphrase is combined with the site access secret to derive the session signing key.
  // The site's access secret and cookie bind it to this private site session.
  const key = createHmac("sha256", passphrase)
    .update(`vg-contract-admin:${accessSecret}`)
    .digest();
  return createHmac("sha256", key)
    .update(`relationship-contract:${accessToken}:${expires}`)
    .digest("base64url");
}

export function matchesAdminPassphrase(
  candidate: string,
  configured: string,
): boolean {
  const actual = createHmac("sha256", "vg-contract-passphrase")
    .update(candidate.length <= 256 ? candidate : "")
    .digest();
  const expected = createHmac("sha256", "vg-contract-passphrase")
    .update(configured)
    .digest();
  return timingSafeEqual(actual, expected);
}
