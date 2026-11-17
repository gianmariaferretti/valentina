/**
 * Audit A4: in production the site refuses to start with weak secrets.
 * Pure function so it can be tested; called from src/instrumentation.ts.
 */

export const MINIMUM_SECRET_LENGTH = 32;
export const MINIMUM_PASSPHRASE_LENGTH = 24;

type Env = Record<string, string | undefined>;

export function configurationProblems(env: Env): string[] {
  const problems: string[] = [];
  const authSecret = env.AUTH_SECRET ?? "";
  if (authSecret.length < MINIMUM_SECRET_LENGTH)
    problems.push(
      `AUTH_SECRET must be at least ${MINIMUM_SECRET_LENGTH} characters (now ${authSecret.length}). Generate one with: openssl rand -base64 48`,
    );
  if (!env.SITE_ACCESS_CODE)
    problems.push("SITE_ACCESS_CODE is not set: nobody could get in.");
  for (const name of ["CONTRACT_ADMIN_PASSPHRASE", "ADMIN_PASSPHRASE"]) {
    const value = env[name];
    if (
      value !== undefined &&
      value !== "" &&
      value.length < MINIMUM_PASSPHRASE_LENGTH
    )
      problems.push(
        `${name} must be at least ${MINIMUM_PASSPHRASE_LENGTH} characters (now ${value.length}).`,
      );
    if (value && value === env.SITE_ACCESS_CODE)
      problems.push(`${name} must be different from SITE_ACCESS_CODE.`);
  }
  if (authSecret && authSecret === env.SITE_ACCESS_CODE)
    problems.push("AUTH_SECRET must be different from SITE_ACCESS_CODE.");
  return problems;
}

export function assertProductionConfiguration(env: Env): void {
  const problems = configurationProblems(env);
  if (problems.length === 0) return;
  throw new Error(
    [
      "V&G refuses to start: the server secrets are missing or too weak.",
      ...problems.map((problem) => `  • ${problem}`),
      "Fix them in the Vercel project settings (Environment Variables) and redeploy.",
    ].join("\n"),
  );
}
