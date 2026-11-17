"use server";

import { setTimeout as delay } from "node:timers/promises";

import { redirect } from "next/navigation";
import { z } from "zod";

import { clearAdminSession, tryAdminLogin } from "@/lib/auth/admin-session";

export interface AdminLoginState {
  readonly message: string | null;
}

export async function adminLogin(
  _previous: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  const parsed = z
    .string()
    .max(256)
    .safeParse(formData.get("passphrase") ?? "");
  const result = parsed.success ? await tryAdminLogin(parsed.data) : "denied";
  if (result === "ok") redirect("/admin");
  await delay(500);
  return {
    message:
      result === "blocked"
        ? "Troppi tentativi. Riprova tra 15 minuti."
        : result === "unconfigured"
          ? "Pannello non configurato: imposta ADMIN_PASSPHRASE (almeno 24 caratteri) su Vercel."
          : "Passphrase sbagliata.",
  };
}

export async function adminLogout(): Promise<never> {
  await clearAdminSession();
  redirect("/admin");
}
