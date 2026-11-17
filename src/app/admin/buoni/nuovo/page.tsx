import type { Metadata } from "next";

import { createCoupon } from "@/features/admin/actions/coupons";
import { Card, SectionHeader } from "@/features/admin/components/admin-shell";
import { CouponForm } from "@/features/admin/components/coupon-form";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Nuovo buono" };

export default async function NewCouponPage() {
  await requireAdminSession();
  return (
    <div className="max-w-2xl">
      <SectionHeader
        subtitle="Il testo che vede Valentina resta in inglese, con il solito tono."
        title="Nuovo buono"
      />
      <Card>
        <CouponForm
          initial={{
            title: "",
            shortDescription: "",
            description: "",
            setting: "together",
            rarity: "standard",
            category: "romantic",
            unlock: "available",
            unlockCondition: "",
            terms: "",
            quantity: 1,
          }}
          isNew
          submit={createCoupon}
        />
      </Card>
    </div>
  );
}
