import type { Metadata } from "next";

import { SongList } from "@/features/life/components/song-list";
import { loadSongs } from "@/features/life/repositories/life";
import { requireAccessSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Our songs" };

export default async function SongsPage() {
  await requireAccessSession();
  const songs = await loadSongs().catch(() => []);
  return (
    <div className="page-container py-6 sm:py-10">
      <header className="mb-6">
        <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[var(--rust)] uppercase">
          Side A · Side B · Repeat
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.6rem,10vw,5rem)] leading-[0.9] italic">
          Our songs
        </h1>
        <p className="mt-3 max-w-md text-sm text-[var(--muted)]">
          The soundtrack so far. Tap play — the record spins while it&apos;s on.
        </p>
      </header>
      <SongList songs={songs} />
    </div>
  );
}
