import type { Metadata } from "next";

import {
  createSong,
  deleteSong,
  moveSong,
  updateSong,
} from "@/features/admin/actions/life";
import {
  Card,
  SectionHeader,
  Unavailable,
} from "@/features/admin/components/admin-shell";
import { SongManager } from "@/features/admin/components/life-forms";
import { loadSongs } from "@/features/life/repositories/life";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Canzoni" };

export default async function AdminSongsPage() {
  await requireAdminSession();
  let songs;
  try {
    songs = await loadSongs();
  } catch {
    return (
      <>
        <SectionHeader title="Canzoni" />
        <Unavailable />
      </>
    );
  }
  return (
    <div className="max-w-3xl">
      <SectionHeader
        subtitle="Niente testi delle canzoni: solo titolo, data, posto, il perché e il link Spotify."
        title="Canzoni"
      />
      <Card>
        <SongManager
          actions={{
            create: createSong,
            update: updateSong,
            remove: deleteSong,
            move: moveSong,
          }}
          songs={songs}
        />
      </Card>
    </div>
  );
}
