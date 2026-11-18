import type { Metadata } from "next";

import { DoodleAlbum } from "@/features/doodles/components/doodle-album";
import { DoodleStudio } from "@/features/doodles/components/doodle-studio";
import type { Doodle } from "@/features/doodles/lib/doodles";
import {
  DoodlesNotReady,
  listDoodles,
} from "@/features/doodles/repositories/doodles";
import { requireAccessSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Doodles" };

const button =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--ink)] px-6 text-xs font-bold tracking-[0.14em] text-[var(--paper-white)] uppercase transition hover:bg-[var(--oxblood)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]";
const small =
  "min-h-11 rounded-full border border-[var(--line-strong)] bg-[var(--paper-white)] px-4 text-xs font-semibold";

export default async function DoodlesPage() {
  await requireAccessSession();
  let doodles: Doodle[] = [];
  let ready = true;
  try {
    doodles = await listDoodles();
  } catch (error) {
    if (!(error instanceof DoodlesNotReady)) throw error;
    ready = false;
  }

  return (
    <div className="page-container py-6 sm:py-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[var(--rust)] uppercase">
            The fridge door
          </p>
          <h1 className="mt-2 font-display text-[clamp(2.8rem,11vw,5.5rem)] leading-[0.9] italic">
            Doodles
          </h1>
          <p className="mt-3 max-w-md text-[var(--muted)]">
            Draw something, send it to Gianmaria. He has to draw back. Those are
            the rules.
          </p>
        </div>
        <DoodleStudio
          className={button}
          label="✏️ New doodle"
          sendLabel="Send to Gianmaria"
          uploadUrl="/api/doodles"
        />
      </header>

      <section aria-label="Album" className="mt-10">
        {!ready ? (
          <p className="rounded-[1.4rem] border border-dashed border-[var(--line-strong)] p-6 text-center text-[var(--muted)]">
            The album is still being glued together. You can draw already — it
            will be here soon.
          </p>
        ) : doodles.length === 0 ? (
          <p className="rounded-[1.4rem] border border-dashed border-[var(--line-strong)] p-10 text-center font-display text-2xl italic">
            The fridge is empty. Fix that.
          </p>
        ) : (
          <DoodleAlbum
            doodles={doodles}
            fileBase="/api/doodles"
            renderActions={(doodle) =>
              doodle.author === "gianmaria" ? (
                <DoodleStudio
                  className={small}
                  label="Draw back"
                  replyTo={doodle.id}
                  sendLabel="Send to Gianmaria"
                  uploadUrl="/api/doodles"
                />
              ) : null
            }
            viewer="valentina"
          />
        )}
      </section>
    </div>
  );
}
