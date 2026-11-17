import type { Metadata } from "next";

import {
  approveListItem,
  createListItem,
  deleteListItem,
  moveListItem,
  tickListItem,
  updateListItem,
} from "@/features/admin/actions/life";
import {
  Card,
  SectionHeader,
  Unavailable,
} from "@/features/admin/components/admin-shell";
import { ListManager } from "@/features/admin/components/list-manager";
import { loadCouponCatalogue } from "@/features/admin/repositories/content";
import { bucketCategories } from "@/features/life/lib/schemas";
import { loadListItems } from "@/features/life/repositories/life";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Bucket list" };

export default async function AdminBucketListPage() {
  await requireAdminSession();
  let data;
  try {
    data = await Promise.all([loadListItems("bucket"), loadCouponCatalogue()]);
  } catch {
    return (
      <>
        <SectionHeader title="Bucket list" />
        <Unavailable />
      </>
    );
  }
  const [items, catalogue] = data;
  const coupons = catalogue
    .filter((coupon) => !coupon.retired && coupon.type === "standard")
    .map((coupon) => ({
      id: coupon.id,
      title: `${coupon.title} (${coupon.code})`,
    }));
  const done = items.filter(
    (item) => item.status === "active" && item.doneAt,
  ).length;
  const active = items.filter((item) => item.status === "active").length;
  return (
    <div className="max-w-3xl">
      <SectionHeader
        subtitle={`${done} / ${active} fatte · una spunta può dare 💋 o sbloccare un buono (una volta sola)`}
        title="Bucket list"
      />
      <Card>
        <ListManager
          actions={{
            create: createListItem,
            update: updateListItem,
            remove: deleteListItem,
            approve: approveListItem,
            tick: tickListItem,
            move: moveListItem,
          }}
          categories={bucketCategories}
          coupons={coupons}
          items={items}
          list="bucket"
          withReward
        />
      </Card>
    </div>
  );
}
