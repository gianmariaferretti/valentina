import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { coupons as codeCoupons } from "@/data/coupons";
import {
  restoreOriginalCoupon,
  saveCoupon,
} from "@/features/admin/actions/coupons";
import { ActionButton } from "@/features/admin/components/admin-ui";
import { Card, SectionHeader } from "@/features/admin/components/admin-shell";
import { CouponForm } from "@/features/admin/components/coupon-form";
import { statusToUnlock } from "@/features/admin/lib/merge-content";
import { loadCouponCatalogue } from "@/features/admin/repositories/content";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Modifica buono" };

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminSession();
  const { id } = await params;
  if (!/^[a-z0-9-]{1,100}$/.test(id)) notFound();
  const catalogue = await loadCouponCatalogue();
  const coupon =
    catalogue.find((item) => item.id === id) ??
    catalogue.find((item) => item.series && item.id.startsWith(`${id}-`));
  if (!coupon) notFound();
  const fromCode = codeCoupons.some((item) => item.id === id);

  return (
    <div className="max-w-2xl">
      <SectionHeader
        actions={
          fromCode ? (
            <ActionButton
              action={restoreOriginalCoupon.bind(null, id)}
              confirm={{
                title: "Tornare all'originale?",
                body: "Le modifiche fatte qui vengono cancellate e torna il testo del codice.",
                confirmLabel: "Ripristina",
              }}
            >
              Ripristina originale
            </ActionButton>
          ) : null
        }
        subtitle={`${coupon.code}${fromCode ? " · dal codice" : " · creato da te"}`}
        title={coupon.title}
      />
      <Card>
        <CouponForm
          initial={{
            title: coupon.title,
            shortDescription: coupon.shortDescription,
            description: coupon.description,
            setting: coupon.setting,
            rarity: coupon.rarity,
            category: coupon.category,
            unlock: statusToUnlock(coupon.status),
            unlockCondition: coupon.unlockCondition ?? "",
            terms: coupon.terms.join("\n"),
            quantity: coupon.series?.total ?? 1,
          }}
          isNew={false}
          submit={saveCoupon.bind(null, id)}
        />
      </Card>
    </div>
  );
}
