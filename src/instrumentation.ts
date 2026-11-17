import { assertProductionConfiguration } from "./lib/auth/config-check";

/** Runs once when a server instance starts. */
export function register() {
  if (process.env.NODE_ENV === "production")
    assertProductionConfiguration(process.env);
}
