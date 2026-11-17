"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { notificationSettingsSchema } from "@/features/notifications/lib/settings";
import { sendHeart, sendTestEmail } from "@/features/notifications/notify";
import { deliverPending } from "@/features/notifications/repositories/outbox";

import { upsertOverride } from "../repositories/content";
import { done, failed, withAdmin, type AdminResult } from "./guard";

const statusText = {
  sent: "Email di prova inviata ✅ Controlla la posta.",
  failed: "Invio fallito: guarda l'errore nello storico.",
  pending: "Resend non è configurato: l'email resta in coda.",
  capped: "Limite giornaliero raggiunto: riparte domani.",
  disabled: "Notifiche disattivate.",
} as const;

export async function sendTestEmailFromPanel(): Promise<AdminResult> {
  return withAdmin("test email", async () => {
    const status = await sendTestEmail();
    revalidatePath("/admin", "layout");
    return status === "sent"
      ? done(statusText.sent)
      : failed(statusText[status]);
  });
}

export async function saveNotificationSettings(
  form: FormData,
): Promise<AdminResult> {
  return withAdmin("notification settings", async () => {
    const parsed = notificationSettingsSchema.safeParse({
      couponRedeemed: form.get("couponRedeemed") === "on",
      missYou: form.get("missYou") === "on",
      digest: form.get("digest") === "on",
      callLink: String(form.get("callLink") ?? ""),
    });
    if (!parsed.success)
      return failed(parsed.error.issues[0]?.message ?? "Controlla i campi.");
    await upsertOverride("setting", "notifications", parsed.data);
    return done("Impostazioni salvate ✅");
  });
}

export async function sendHeartFromPanel(form: FormData): Promise<AdminResult> {
  return withAdmin("send heart", async () => {
    const message = z
      .string()
      .trim()
      .max(140, "Al massimo 140 caratteri.")
      .safeParse(String(form.get("message") ?? ""));
    if (!message.success) return failed(message.error.issues[0].message);
    await sendHeart(message.data || null, "panel");
    revalidatePath("/admin", "layout");
    return done(
      "Cuore inviato ❤️ Lo vedrà entro 30 secondi se il sito è aperto.",
    );
  });
}

export async function retryEmails(): Promise<AdminResult> {
  return withAdmin("retry emails", async () => {
    const sent = await deliverPending(20);
    revalidatePath("/admin", "layout");
    return done(
      sent
        ? `Inviate ${sent} email in sospeso`
        : "Niente da reinviare (o limite raggiunto)",
    );
  });
}
