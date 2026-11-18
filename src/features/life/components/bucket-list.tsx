"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  proposeListItem,
  toggleListItem,
  uploadBucketPhoto,
} from "../actions/lists";
import { bucketCategories } from "../lib/schemas";
import type { ListItem } from "../repositories/life";
import { RollingGroup, RollingNumber } from "@/components/ui/rolling-number";
import { requestKissCheck } from "@/features/kisses/components/kiss-listener";

const stampDate = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Resizes on the phone: WebP where supported, JPEG otherwise (Safari). */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const encode = (type: string, quality: number) =>
    new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, quality),
    );
  const webp = await encode("image/webp", 0.82);
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await encode("image/jpeg", 0.85);
  if (!jpeg) throw new Error("encode");
  return jpeg;
}

function BucketCard({ item, index }: { item: ListItem; index: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoVersion, setPhotoVersion] = useState(0);
  const tilt = ((index * 37) % 7) - 3;

  return (
    <li
      className="relative rounded-[0.4rem] bg-[#fffdf8] p-3 pb-4 shadow-[0_10px_24px_rgba(49,35,30,0.12)]"
      style={{ transform: `rotate(${tilt * 0.6}deg)` }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-3deg] bg-[rgba(242,200,75,0.55)]"
      />
      {item.hasPhoto ? (
        // A private photo served only with Valentina's session.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt={`Photo: ${item.title}`}
          className="mb-3 aspect-[4/3] w-full rounded-[0.2rem] object-cover"
          loading="lazy"
          src={`/api/bucket-photo/${item.id}?v=${photoVersion}`}
        />
      ) : null}
      <p className="text-[0.6rem] font-bold tracking-[0.16em] text-[var(--rust)] uppercase">
        {item.category ?? "someday"}
        {item.reward && !item.doneAt ? (
          <span className="ml-2 tracking-normal text-[var(--muted)] normal-case">
            🎁{" "}
            {"kisses" in item.reward
              ? `+${item.reward.kisses} 💋 when done`
              : "unlocks a coupon"}
          </span>
        ) : null}
      </p>
      <p
        className={`mt-1 font-display text-2xl leading-tight ${item.doneAt ? "pr-24 text-[var(--muted)]" : ""}`}
      >
        {item.title}
      </p>
      {item.notes ? (
        <p className="mt-1 text-sm text-[var(--muted)]">{item.notes}</p>
      ) : null}
      {item.doneAt ? (
        <span
          aria-label={`Done on ${stampDate.format(new Date(item.doneAt))}`}
          className="absolute top-3 right-3 rotate-[-12deg] rounded-md border-[3px] border-double border-[#2f7d4f] bg-[rgba(255,253,248,0.85)] px-2 py-1 text-center font-mono text-xs font-black tracking-[0.14em] text-[#2f7d4f]"
        >
          DONE
          <span className="block text-[0.55rem] tracking-[0.06em]">
            {stampDate.format(new Date(item.doneAt))}
          </span>
        </span>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className={`min-h-11 rounded-full px-4 text-sm font-semibold ${item.doneAt ? "border border-[var(--line-strong)]" : "bg-[var(--ink)] text-[var(--paper-white)]"}`}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await toggleListItem(item.id, !item.doneAt);
              requestKissCheck();
              toast(result.message, {
                icon: result.ok && !item.doneAt ? "✅" : undefined,
              });
              router.refresh();
            })
          }
          type="button"
        >
          {item.doneAt ? "Undo" : "✓ Done"}
        </button>
        {item.doneAt ? (
          <>
            <button
              className="min-h-11 rounded-full border border-[var(--line-strong)] px-4 text-sm"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
              type="button"
            >
              📸 {item.hasPhoto ? "Change photo" : "Add a photo"}
            </button>
            <input
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                startTransition(async () => {
                  try {
                    const form = new FormData();
                    form.set("photo", await shrink(file));
                    const result = await uploadBucketPhoto(item.id, form);
                    toast(result.message);
                    if (result.ok) {
                      setPhotoVersion((v) => v + 1);
                      router.refresh();
                    }
                  } catch {
                    toast("That photo couldn't be read. Try another one.");
                  }
                });
              }}
              ref={fileRef}
              tabIndex={-1}
              type="file"
            />
          </>
        ) : null}
      </div>
    </li>
  );
}

export function BucketList({ items }: { items: ListItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<string>("all");
  const active = items.filter((item) => item.status === "active");
  const proposed = items.filter((item) => item.status === "proposed");
  const done = active.filter((item) => item.doneAt).length;
  const categories = [
    ...new Set(active.map((item) => item.category ?? "someday")),
  ];
  const shown = active.filter(
    (item) => filter === "all" || (item.category ?? "someday") === filter,
  );
  const percent = active.length ? Math.round((done / active.length) * 100) : 0;

  return (
    <div>
      <div className="rounded-[1.4rem] bg-[var(--paper-white)] p-4">
        <RollingGroup>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl">
              <RollingNumber rollIn value={done} /> /{" "}
              <RollingNumber value={active.length} /> done
            </span>
            <RollingNumber
              className="text-xs text-[var(--muted)]"
              rollIn
              suffix="%"
              value={percent}
            />
          </div>
        </RollingGroup>
        <div
          aria-label={`${done} of ${active.length} done`}
          aria-valuemax={active.length}
          aria-valuemin={0}
          aria-valuenow={done}
          className="mt-2 h-3 overflow-hidden rounded-full bg-[var(--paper-deep)]"
          role="progressbar"
        >
          <div
            className="h-full rounded-full bg-[var(--rust)] transition-[width]"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {categories.length > 1 ? (
        <div
          aria-label="Categories"
          className="mt-4 flex flex-wrap gap-2"
          role="group"
        >
          {["all", ...categories].map((category) => (
            <button
              aria-pressed={filter === category}
              className={`min-h-11 rounded-full px-4 text-sm capitalize ${filter === category ? "bg-[var(--ink)] text-[var(--paper-white)]" : "border border-[var(--line-strong)] bg-white/60"}`}
              key={category}
              onClick={() => setFilter(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>
      ) : null}

      {shown.length === 0 ? (
        <p className="mt-6 text-[var(--muted)]">
          Nothing here yet. The bucket is suspiciously empty.
        </p>
      ) : (
        <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((item, index) => (
            <BucketCard index={index} item={item} key={item.id} />
          ))}
        </ul>
      )}

      <section
        aria-labelledby="propose-title"
        className="mt-10 rounded-[1.4rem] border border-dashed border-[var(--line-strong)] p-5"
      >
        <h2 className="font-display text-2xl" id="propose-title">
          Propose something new
        </h2>
        <p className="text-sm text-[var(--muted)]">
          Gianmaria approves it (he will).
        </p>
        <form
          className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const element = event.currentTarget;
            startTransition(async () => {
              const result = await proposeListItem("bucket", form);
              toast(result.message);
              if (result.ok) {
                element.reset();
                router.refresh();
              }
            });
          }}
        >
          <input
            aria-label="What should we do?"
            className="min-h-11 rounded-full border border-[var(--line-strong)] bg-white px-4 text-base"
            maxLength={140}
            name="title"
            placeholder="Swim with whale sharks…"
            required
          />
          <select
            aria-label="Category"
            className="min-h-11 rounded-full border border-[var(--line-strong)] bg-white px-3 text-base"
            defaultValue="adventures"
            name="category"
          >
            {bucketCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <button
            className="min-h-11 rounded-full bg-[var(--ink)] px-5 text-sm font-semibold text-[var(--paper-white)]"
            disabled={pending}
            type="submit"
          >
            Propose
          </button>
        </form>
        {proposed.length ? (
          <ul className="mt-3 grid gap-1 text-sm text-[var(--muted)]">
            {proposed.map((item) => (
              <li key={item.id}>💡 {item.title} · waiting for approval</li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
