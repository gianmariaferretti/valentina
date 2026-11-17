/**
 * Short emails for Gianmaria, readable on a phone, in the site's style.
 * Plain HTML (tables, inline styles) plus a text version. Pure functions.
 * No private text beyond a coupon title ever goes in an email.
 */

export interface RenderedEmail {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export interface EmailButton {
  readonly label: string;
  readonly href: string;
}

const escape = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const romeTime = new Intl.DateTimeFormat("it-IT", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Rome",
});

/** "17/11 09:15" in Rome time. */
export function formatRome(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : romeTime.format(date).replace(",", "");
}

function layout(
  heading: string,
  lines: readonly string[],
  buttons: readonly EmailButton[],
  footer: string,
): string {
  const buttonHtml = buttons
    .map(
      (button, index) =>
        `<a href="${escape(button.href)}" style="display:inline-block;margin:6px 6px 0 0;padding:14px 22px;border-radius:999px;background:${index === 0 ? "#241e1c" : "#93463e"};color:#fbf8f3;font:600 16px -apple-system,Segoe UI,Roboto,sans-serif;text-decoration:none">${escape(button.label)}</a>`,
    )
    .join("");
  return `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escape(heading)}</title></head>
<body style="margin:0;background:#f2ebe0;padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="100%" style="max-width:480px;background:#fbf8f3;border-radius:20px;border:1px solid rgba(36,30,28,.14)" cellpadding="0" cellspacing="0">
<tr><td style="padding:24px 24px 8px;font:700 11px -apple-system,Segoe UI,Roboto,sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#93463e">V + G</td></tr>
<tr><td style="padding:0 24px;font:400 28px/1.15 Georgia,'Times New Roman',serif;color:#241e1c">${escape(heading)}</td></tr>
<tr><td style="padding:12px 24px 0;font:400 16px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;color:#403735">${lines.map((line) => `<p style="margin:0 0 8px">${escape(line)}</p>`).join("")}</td></tr>
<tr><td style="padding:8px 24px 24px">${buttonHtml}</td></tr>
</table>
<p style="margin:16px 0 0;font:400 12px -apple-system,Segoe UI,Roboto,sans-serif;color:#756a64">${escape(footer)}</p>
</td></tr></table>
</body></html>`;
}

function textVersion(
  heading: string,
  lines: readonly string[],
  buttons: readonly EmailButton[],
  footer: string,
): string {
  return [
    heading,
    "",
    ...lines,
    "",
    ...buttons.map((button) => `${button.label}: ${button.href}`),
    "",
    footer,
  ].join("\n");
}

const LINK_NOTE =
  "I pulsanti aprono una pagina di conferma: valgono una volta sola e scadono dopo 7 giorni.";

function render(
  subject: string,
  heading: string,
  lines: readonly string[],
  buttons: readonly EmailButton[],
  footer = LINK_NOTE,
): RenderedEmail {
  return {
    subject,
    html: layout(heading, lines, buttons, footer),
    text: textVersion(heading, lines, buttons, footer),
  };
}

const settingLabel = { together: "Together", apart: "Apart" } as const;

export function couponRedeemedEmail(input: {
  title: string;
  setting: "together" | "apart";
  rarity: string;
  redeemedAt: string;
  deliverUrl: string | null;
}): RenderedEmail {
  const detail = `${settingLabel[input.setting]} · ${input.rarity} — ${formatRome(input.redeemedAt)}`;
  return render(
    `🎟️ Valentina ha usato: ${input.title}`,
    `Valentina ha usato: ${input.title}`,
    [`(${detail})`, "Quando l'hai consegnato, segnalo qui sotto."],
    input.deliverUrl
      ? [{ label: "✅ Consegnato", href: input.deliverUrl }]
      : [],
  );
}

export function missYouEmail(input: {
  taps: number;
  heartUrl: string | null;
  callUrl: string | null;
}): RenderedEmail {
  const times = input.taps > 1 ? ` ×${input.taps}` : "";
  const buttons: EmailButton[] = [];
  if (input.heartUrl)
    buttons.push({ label: "❤️ Send a heart back", href: input.heartUrl });
  if (input.callUrl)
    buttons.push({ label: "📞 Call her", href: input.callUrl });
  return render(
    `💌 Valentina misses you${times}`,
    `Valentina misses you${times}`,
    [
      input.taps > 1
        ? `Ha premuto il cuore ${input.taps} volte.`
        : "Ha appena premuto il cuore.",
    ],
    buttons,
  );
}

export function digestEmail(input: {
  date: string;
  lines: readonly string[];
}): RenderedEmail {
  return render(
    `🌙 La giornata di Valentina · ${input.date}`,
    "La giornata di Valentina",
    input.lines.length ? input.lines : ["Oggi niente di nuovo sul sito."],
    [],
    "Riepilogo serale: lo spegni dal pannello, sezione Notifiche.",
  );
}

export function testEmail(panelUrl: string): RenderedEmail {
  return render(
    "✅ Email di prova da V+G",
    "Funziona!",
    [
      "Le notifiche del sito arrivano qui.",
      "Imposta questo mittente come VIP (iPhone) o importante (Gmail) per farle suonare.",
    ],
    [{ label: "Apri il pannello", href: panelUrl }],
    "Email di prova inviata dal pannello.",
  );
}
