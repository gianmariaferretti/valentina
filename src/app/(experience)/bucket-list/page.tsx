import type { Metadata } from "next";

import { BucketList } from "@/features/life/components/bucket-list";
import { loadListItems } from "@/features/life/repositories/life";
import { requireAccessSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Bucket list" };

export default async function BucketListPage() {
  await requireAccessSession();
  const items = await loadListItems("bucket").catch(() => []);
  return (
    <div className="page-container py-6 sm:py-10">
      <header className="mb-6">
        <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[var(--rust)] uppercase">
          The scrapbook of things we haven&apos;t done yet
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.6rem,10vw,5rem)] leading-[0.9] italic">
          Bucket list
        </h1>
      </header>
      <BucketList items={items} />
    </div>
  );
}
