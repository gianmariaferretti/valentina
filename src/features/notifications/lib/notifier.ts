import "server-only";

import { appendFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

/**
 * One channel for Gianmaria's notifications. Today: email via Resend.
 * Another channel (Telegram, push…) only needs another Notifier.
 */
export interface EmailMessage {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export interface Notifier {
  readonly name: string;
  /** Sends one message; `key` makes retries idempotent. Returns a provider id. */
  send(message: EmailMessage, key: string): Promise<string>;
}

export const DEFAULT_FROM = "V+G <onboarding@resend.dev>";

class ResendNotifier implements Notifier {
  readonly name = "resend";
  constructor(
    private readonly apiKey: string,
    private readonly to: string,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage, key: string): Promise<string> {
    const { Resend } = await import("resend");
    const resend = new Resend(this.apiKey);
    const { data, error } = await resend.emails.send(
      {
        from: this.from,
        to: this.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      },
      { idempotencyKey: key },
    );
    if (error) throw new Error(`Resend: ${error.name}: ${error.message}`);
    return data.id;
  }
}

/** Local testing only (never on Vercel): writes the email to a file. */
class LogNotifier implements Notifier {
  readonly name = "log";
  async send(message: EmailMessage, key: string): Promise<string> {
    const file = process.env.NOTIFY_LOG_FILE || join(tmpdir(), "vg-emails.log");
    await appendFile(
      file,
      `${JSON.stringify({ key, at: new Date().toISOString(), ...message })}\n`,
    );
    return `log-${key}`;
  }
}

export function notifierStatus():
  | { configured: true; name: string; to: string }
  | { configured: false; missing: string[] } {
  // Local testing only: never on Vercel.
  if (process.env.NOTIFY_TRANSPORT === "log" && !process.env.VERCEL)
    return { configured: true, name: "log", to: "file" };
  const missing = [
    "RESEND_API_KEY",
    "NOTIFY_EMAIL_TO",
    "EMAIL_ACTION_SECRET",
  ].filter((name) => !process.env[name]);
  if (
    (process.env.EMAIL_ACTION_SECRET ?? "").length < 32 &&
    !missing.includes("EMAIL_ACTION_SECRET")
  )
    missing.push("EMAIL_ACTION_SECRET (almeno 32 caratteri)");
  if (missing.length) return { configured: false, missing };
  return { configured: true, name: "resend", to: process.env.NOTIFY_EMAIL_TO! };
}

export function getNotifier(): Notifier | null {
  const status = notifierStatus();
  if (!status.configured) return null;
  if (status.name === "log") return new LogNotifier();
  return new ResendNotifier(
    process.env.RESEND_API_KEY!,
    process.env.NOTIFY_EMAIL_TO!,
    process.env.NOTIFY_EMAIL_FROM || DEFAULT_FROM,
  );
}
