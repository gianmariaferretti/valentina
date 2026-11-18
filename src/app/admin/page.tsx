import type { Metadata } from "next";
import Link from "next/link";

import { AdminLogin } from "@/features/admin/components/admin-login";
import {
  loadActivity,
  loadAdminCoupons,
  loadAdminLetters,
  loadAuthEvents,
  loadCasinoAdmin,
  loadContractRewardRequest,
} from "@/features/admin/repositories/admin-data";
import { loadContractForAdmin } from "@/features/relationship-contract/lib/repository";
import { isAdminConfigured, readAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Scrivania" };

interface Tile {
  href: string;
  icon: string;
  title: string;
  text: string;
  badge?: string | null;
  soon?: string;
}

function cutoffs() {
  const now = Date.now();
  return {
    day: now - 24 * 60 * 60 * 1000,
    week: now - 7 * 24 * 60 * 60 * 1000,
  };
}

async function safe<T>(load: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await load();
  } catch {
    return fallback;
  }
}

export default async function AdminHome() {
  if (!(await readAdminSession()))
    return <AdminLogin configured={isAdminConfigured()} />;

  const { day, week } = cutoffs();
  const [coupons, letters, casino, events, activity, contract, reward] =
    await Promise.all([
      safe(loadAdminCoupons, []),
      safe(loadAdminLetters, []),
      safe(loadCasinoAdmin, null),
      safe(() => loadAuthEvents(100), []),
      safe(() => loadActivity(100), []),
      safe(loadContractForAdmin, null),
      safe(loadContractRewardRequest, null),
    ]);

  const owed = coupons.filter(
    (coupon) => coupon.redeemedAt && !coupon.deliveredAt,
  );
  const counts = new Map<string, number>();
  for (const coupon of owed)
    counts.set(coupon.title, (counts.get(coupon.title) ?? 0) + 1);
  const grouped = [...counts].map(([title, count]) =>
    count > 1 ? `${title} ×${count}` : title,
  );
  const debt = casino?.debt ?? 0;
  const failures = events.filter(
    (event) =>
      (event.kind === "failed" || event.kind === "blocked") &&
      new Date(event.created_at).getTime() > day,
  ).length;
  const today = activity.filter(
    (item) => new Date(item.at).getTime() > day,
  ).length;
  const openedThisWeek = letters.filter(
    (letter) => letter.openedAt && new Date(letter.openedAt).getTime() > week,
  ).length;
  const awaitingSignature =
    contract?.state.status === "awaiting_countersignature";

  const tiles: Tile[] = [
    {
      href: "/admin/oggi",
      icon: "☀️",
      title: "Oggi",
      text: "Cosa ha fatto Valentina e cosa le devi",
      badge: today ? `${today} novità` : null,
    },
    {
      href: "/admin/buoni",
      icon: "🎟️",
      title: "Buoni",
      text: "Crea, modifica, sblocca, segna consegnato",
      badge: owed.length ? `${owed.length} da consegnare` : null,
    },
    {
      href: "/admin/casino",
      icon: "🎰",
      title: "Kiss Casino",
      text: "Saldo, baci dovuti, reset, sipario",
      badge: debt ? `${debt} baci` : null,
    },
    {
      href: "/admin/lettere",
      icon: "💌",
      title: "Lettere",
      text: "Open-when: scrivi, nascondi, vedi chi è aperta",
      badge: openedThisWeek ? `${openedThisWeek} aperte` : null,
    },
    {
      href: "/admin/contratto",
      icon: "📜",
      title: "Contratto",
      text: "Controfirma e Articolo 41",
      badge: awaitingSignature
        ? "da controfirmare"
        : reward
          ? "premio richiesto"
          : null,
    },
    {
      href: "/admin/sicurezza",
      icon: "🔐",
      title: "Sicurezza",
      text: "Ultimi accessi, tentativi, esci ovunque",
      badge: failures ? `${failures} tentativi falliti` : null,
    },
    {
      href: "/admin/notifiche",
      icon: "📨",
      title: "Notifiche",
      text: "Email, prova di invio, cuori, interruttori",
    },
    {
      href: "/admin/next-time",
      icon: "✈️",
      title: "Next time",
      text: "Prossimo incontro, cose da fare, valigia",
    },
    {
      href: "/admin/bucket-list",
      icon: "🗺️",
      title: "Bucket list",
      text: "Cose da fare nella vita",
    },
    {
      href: "/admin/storia",
      icon: "📖",
      title: "La nostra storia",
      text: "I testi di Our story, capitolo per capitolo",
    },
    {
      href: "/admin/canzoni",
      icon: "🎵",
      title: "Canzoni",
      text: "Le nostre canzoni",
    },
    {
      href: "/admin/citta",
      icon: "🕰️",
      title: "Città e orologi",
      text: "Città, fusi orari, chi c'è",
    },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl">Ciao Gianmaria</h1>
      {owed.length || debt || reward ? (
        <div className="mt-4 rounded-3xl border border-[#e7c862] bg-[#fff8e3] p-4">
          <p className="text-xs font-bold tracking-[0.14em] uppercase">
            Le devi
          </p>
          <p className="mt-1 text-lg">
            {[
              ...grouped.slice(0, 4),
              ...(grouped.length > 4
                ? [`altri ${grouped.length - 4} buoni`]
                : []),
              ...(debt ? [`${debt} baci`] : []),
              ...(reward ? ["il premio del contratto"] : []),
            ].join(", ")}
          </p>
        </div>
      ) : null}
      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <li key={tile.href}>
            <Link
              className="relative flex min-h-24 items-start gap-3 rounded-3xl border border-[var(--line)] bg-[var(--paper-white)] p-4 shadow-[0_8px_24px_rgba(49,35,30,0.06)] transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[var(--ink)]"
              href={tile.href}
            >
              <span aria-hidden="true" className="text-3xl">
                {tile.icon}
              </span>
              <span className="grid gap-0.5 pr-24">
                <span className="text-lg font-semibold">{tile.title}</span>
                <span className="text-sm text-[var(--muted)]">{tile.text}</span>
                {tile.soon ? (
                  <span className="mt-1 text-xs font-semibold text-[var(--muted)]">
                    Arriva con la {tile.soon}
                  </span>
                ) : null}
              </span>
              {tile.badge ? (
                <span className="absolute top-3 right-3 rounded-full bg-[#b3261e] px-2 py-0.5 text-xs font-bold text-white">
                  {tile.badge}
                </span>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
