import type { Metadata } from "next";
import Link from "next/link";

import {
  lockCoupon,
  markDelivered,
  resetAllRedemptions,
  resetRedemption,
  restoreRedemption,
  setCouponHidden,
  unlockCoupon,
  unmarkDelivered,
} from "@/features/admin/actions/coupons";
import { ActionButton } from "@/features/admin/components/admin-ui";
import { buttonClass } from "@/features/admin/components/styles";
import {
  Card,
  formatWhen,
  Pill,
  SectionHeader,
  Unavailable,
} from "@/features/admin/components/admin-shell";
import {
  loadAdminCoupons,
  type AdminCoupon,
} from "@/features/admin/repositories/admin-data";
import { couponRarities } from "@/features/coupons/types";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Buoni" };

const states = {
  tutti: "Tutti",
  disponibili: "Disponibili",
  "da-consegnare": "Da consegnare",
  usati: "Usati",
  bloccati: "Bloccati",
  segreti: "Segreti",
  nascosti: "Nascosti",
} as const;
type StateFilter = keyof typeof states;

function editKey(coupon: AdminCoupon) {
  return coupon.custom && coupon.series
    ? coupon.id.replace(/-\d+$/, "")
    : coupon.id;
}

function statusPill(coupon: AdminCoupon) {
  if (coupon.retired) return <Pill tone="bad">Nascosto</Pill>;
  if (coupon.redeemedAt)
    return coupon.deliveredAt ? (
      <Pill tone="good">Consegnato</Pill>
    ) : (
      <Pill tone="warn">Da consegnare</Pill>
    );
  if (coupon.status === "available")
    return <Pill tone="good">Disponibile</Pill>;
  if (coupon.status === "undiscovered") return <Pill>Segreto</Pill>;
  return <Pill>Bloccato</Pill>;
}

function matches(coupon: AdminCoupon, state: StateFilter) {
  switch (state) {
    case "disponibili":
      return !coupon.retired && coupon.status === "available";
    case "da-consegnare":
      return Boolean(coupon.redeemedAt && !coupon.deliveredAt);
    case "usati":
      return Boolean(coupon.redeemedAt);
    case "bloccati":
      return !coupon.retired && coupon.status === "locked";
    case "segreti":
      return !coupon.retired && coupon.status === "undiscovered";
    case "nascosti":
      return Boolean(coupon.retired);
    default:
      return true;
  }
}

function CouponActions({ coupon }: { coupon: AdminCoupon }) {
  const fromCasino = coupon.source === "casino";
  return (
    <div className="flex flex-wrap gap-2">
      {coupon.redeemedAt && !coupon.deliveredAt ? (
        <ActionButton
          action={markDelivered.bind(null, coupon.id)}
          tone="primary"
          undo={unmarkDelivered.bind(null, coupon.id)}
        >
          ✅ Consegnato
        </ActionButton>
      ) : null}
      {coupon.deliveredAt ? (
        <ActionButton action={unmarkDelivered.bind(null, coupon.id)}>
          Annulla consegna
        </ActionButton>
      ) : null}
      {!fromCasino ? (
        <Link
          className={buttonClass("ghost")}
          href={`/admin/buoni/${editKey(coupon)}`}
        >
          Modifica
        </Link>
      ) : null}
      {!coupon.redeemedAt &&
      coupon.status !== "available" &&
      !coupon.retired ? (
        <ActionButton
          action={unlockCoupon.bind(null, coupon.id)}
          undo={lockCoupon.bind(null, coupon.id)}
        >
          🔓 Sblocca
        </ActionButton>
      ) : null}
      {coupon.redeemedAt ? (
        <ActionButton
          action={resetRedemption.bind(null, coupon.id)}
          confirm={{
            title: "Azzerare il riscatto?",
            body: `“${coupon.title}” tornerà usabile, come se non fosse mai stato riscattato.`,
            confirmLabel: "Azzera riscatto",
          }}
          undo={restoreRedemption.bind(null, coupon.id, coupon.redeemedAt)}
        >
          Azzera riscatto
        </ActionButton>
      ) : null}
      {!fromCasino ? (
        <ActionButton
          action={setCouponHidden.bind(null, editKey(coupon), !coupon.retired)}
          undo={setCouponHidden.bind(
            null,
            editKey(coupon),
            Boolean(coupon.retired),
          )}
        >
          {coupon.retired ? "👀 Mostra" : "🙈 Nascondi"}
        </ActionButton>
      ) : null}
    </div>
  );
}

function filterLink(
  params: Record<string, string>,
  key: string,
  value: string,
): string {
  const next = new URLSearchParams({ ...params, [key]: value });
  if (value === "tutti" || value === "") next.delete(key);
  const query = next.toString();
  return query ? `/admin/buoni?${query}` : "/admin/buoni";
}

export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminSession();
  const raw = await searchParams;
  const params = Object.fromEntries(
    Object.entries(raw).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  const mode =
    params.modo === "together" || params.modo === "apart"
      ? params.modo
      : "tutti";
  const rarity = (couponRarities as readonly string[]).includes(
    params.rarita ?? "",
  )
    ? params.rarita
    : "tutte";
  const state: StateFilter =
    params.stato && params.stato in states
      ? (params.stato as StateFilter)
      : "tutti";

  let coupons: AdminCoupon[];
  try {
    coupons = await loadAdminCoupons();
  } catch {
    return (
      <>
        <SectionHeader title="Buoni" />
        <Unavailable />
      </>
    );
  }
  const shown = coupons
    .filter((coupon) => mode === "tutti" || coupon.setting === mode)
    .filter((coupon) => rarity === "tutte" || coupon.rarity === rarity)
    .filter((coupon) => matches(coupon, state))
    .sort(
      (a, b) =>
        (b.redeemedAt ?? "").localeCompare(a.redeemedAt ?? "") ||
        a.code.localeCompare(b.code),
    );

  const chip = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-full px-3 text-sm ${active ? "bg-[var(--ink)] text-white" : "bg-white/70 border border-[var(--line)]"}`;

  return (
    <div>
      <SectionHeader
        actions={
          <>
            <Link className={buttonClass("primary")} href="/admin/buoni/nuovo">
              + Nuovo buono
            </Link>
            <ActionButton
              action={resetAllRedemptions}
              confirm={{
                title: "Azzerare TUTTI i riscatti?",
                body: "Tutti i buoni usati torneranno usabili e le consegne verranno cancellate. Non si può annullare.",
                confirmLabel: "Sì, azzera tutto",
              }}
              tone="danger"
            >
              Azzera tutti i riscatti
            </ActionButton>
          </>
        }
        subtitle={`${shown.length} di ${coupons.length} buoni`}
        title="Buoni"
      />

      <nav aria-label="Filtri" className="mb-4 grid gap-2">
        <div className="flex flex-wrap gap-2">
          {(["tutti", "together", "apart"] as const).map((value) => (
            <Link
              className={chip(mode === value)}
              href={filterLink(params, "modo", value)}
              key={value}
            >
              {value === "tutti"
                ? "Tutti"
                : value === "together"
                  ? "Together"
                  : "Apart"}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {["tutte", ...couponRarities].map((value) => (
            <Link
              className={chip(rarity === value)}
              href={filterLink(
                params,
                "rarita",
                value === "tutte" ? "" : value,
              )}
              key={value}
            >
              {value === "tutte" ? "Ogni rarità" : value}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(states) as StateFilter[]).map((value) => (
            <Link
              className={chip(state === value)}
              href={filterLink(params, "stato", value)}
              key={value}
            >
              {states[value]}
            </Link>
          ))}
        </div>
      </nav>

      {/* Phone: cards with big actions */}
      <ul className="grid gap-3 md:hidden">
        {shown.map((coupon) => (
          <li key={coupon.id}>
            <Card className="grid gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-xs text-[var(--muted)]">
                    {coupon.code}
                    {coupon.series
                      ? ` · ${coupon.series.index}/${coupon.series.total}`
                      : ""}
                  </p>
                  <p className="font-semibold">{coupon.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {coupon.setting === "apart" ? "Apart" : "Together"} ·{" "}
                    {coupon.rarity} · {coupon.category}
                    {coupon.source === "casino" ? " · casinò" : ""}
                    {coupon.custom
                      ? " · creato da te"
                      : coupon.edited
                        ? " · modificato"
                        : ""}
                  </p>
                  {coupon.redeemedAt ? (
                    <p className="text-xs">
                      Usato il {formatWhen(coupon.redeemedAt)}
                    </p>
                  ) : null}
                </div>
                {statusPill(coupon)}
              </div>
              <CouponActions coupon={coupon} />
            </Card>
          </li>
        ))}
      </ul>

      {/* Computer: a table */}
      <div className="hidden overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--paper-white)] md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--paper-deep)] text-xs tracking-[0.08em] uppercase">
            <tr>
              <th className="p-3">Buono</th>
              <th className="p-3">Sezione</th>
              <th className="p-3">Rarità</th>
              <th className="p-3">Stato</th>
              <th className="p-3">Usato</th>
              <th className="p-3">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--line)]">
            {shown.map((coupon) => (
              <tr className="align-top" key={coupon.id}>
                <td className="p-3">
                  <p className="font-semibold">{coupon.title}</p>
                  <p className="font-mono text-xs text-[var(--muted)]">
                    {coupon.code}
                    {coupon.source === "casino" ? " · casinò" : ""}
                    {coupon.custom
                      ? " · creato da te"
                      : coupon.edited
                        ? " · modificato"
                        : ""}
                  </p>
                </td>
                <td className="p-3">
                  {coupon.setting === "apart" ? "Apart" : "Together"}
                </td>
                <td className="p-3">{coupon.rarity}</td>
                <td className="p-3">{statusPill(coupon)}</td>
                <td className="p-3 whitespace-nowrap">
                  {formatWhen(coupon.redeemedAt)}
                </td>
                <td className="p-3">
                  <CouponActions coupon={coupon} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown.length === 0 ? (
        <Card>
          <p className="text-sm">Nessun buono con questi filtri.</p>
        </Card>
      ) : null}
    </div>
  );
}
