import type { Metadata } from "next";
import Link from "next/link";

import {
  markDelivered,
  unmarkDelivered,
} from "@/features/admin/actions/coupons";
import { ActionButton } from "@/features/admin/components/admin-ui";
import {
  Card,
  formatWhen,
  SectionHeader,
  Unavailable,
} from "@/features/admin/components/admin-shell";
import {
  loadActivity,
  loadAdminCoupons,
  loadCasinoAdmin,
} from "@/features/admin/repositories/admin-data";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Oggi" };

export default async function TodayPage() {
  await requireAdminSession();
  let data;
  try {
    data = await Promise.all([
      loadActivity(60),
      loadAdminCoupons(),
      loadCasinoAdmin().catch(() => null),
    ]);
  } catch {
    return (
      <>
        <SectionHeader title="Oggi" />
        <Unavailable />
      </>
    );
  }
  const [activity, coupons, casino] = data;
  const owed = coupons.filter(
    (coupon) => coupon.redeemedAt && !coupon.deliveredAt,
  );

  return (
    <div>
      <SectionHeader
        subtitle="Le ultime cose che ha fatto Valentina e cosa le devi."
        title="Oggi"
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <section aria-labelledby="owed">
          <h2 className="mb-2 text-lg font-semibold" id="owed">
            Cose da fare
          </h2>
          <div className="grid gap-3">
            {owed.length === 0 && !casino?.debt ? (
              <Card>
                <p className="text-sm">
                  Niente in sospeso. Sei in regola. Per ora.
                </p>
              </Card>
            ) : null}
            {casino?.debt ? (
              <Card className="flex items-center justify-between gap-3">
                <p>
                  <span aria-hidden="true">💋 </span>Le devi{" "}
                  <strong>{casino.debt} baci</strong>
                </p>
                <Link className="text-sm underline" href="/admin/casino">
                  Segna pagati
                </Link>
              </Card>
            ) : null}
            {owed.map((coupon) => (
              <Card className="grid gap-3" key={coupon.id}>
                <div>
                  <p className="font-semibold">🎟️ {coupon.title}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {coupon.setting === "apart" ? "Apart" : "Together"} ·{" "}
                    {coupon.rarity} · usato il {formatWhen(coupon.redeemedAt)}
                  </p>
                </div>
                <ActionButton
                  action={markDelivered.bind(null, coupon.id)}
                  className="w-full sm:w-auto"
                  tone="primary"
                  undo={unmarkDelivered.bind(null, coupon.id)}
                >
                  ✅ Consegnato
                </ActionButton>
              </Card>
            ))}
          </div>
        </section>
        <section aria-labelledby="activity">
          <h2 className="mb-2 text-lg font-semibold" id="activity">
            Ultime attività
          </h2>
          <Card className="p-0">
            {activity.length === 0 ? (
              <p className="p-4 text-sm">Ancora nessuna attività.</p>
            ) : (
              <ol className="divide-y divide-[var(--line)]">
                {activity.map((item, index) => (
                  <li
                    className="flex items-start gap-3 p-3"
                    key={`${item.at}-${index}`}
                  >
                    <span aria-hidden="true" className="text-xl">
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      {item.href ? (
                        <Link className="hover:underline" href={item.href}>
                          {item.text}
                        </Link>
                      ) : (
                        item.text
                      )}
                      <p className="text-xs text-[var(--muted)]">
                        {formatWhen(item.at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
          <p className="mt-2 text-xs text-[var(--muted)]">
            &quot;Miss you&quot; e spunte della bucket list compariranno qui con
            le Fasi 2 e 3.
          </p>
        </section>
      </div>
    </div>
  );
}
