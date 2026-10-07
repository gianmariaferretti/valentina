import { ArrowLeft, Camera, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Eyebrow } from "@/components/ui/eyebrow";
import { getPlace, places } from "@/data/places";

interface PlacePageProps {
  params: Promise<{ place: string }>;
}

export function generateStaticParams() {
  return places.map((place) => ({ place: place.slug }));
}

export async function generateMetadata({
  params,
}: PlacePageProps): Promise<Metadata> {
  const place = getPlace((await params).place);
  return { title: place?.city ?? "Place" };
}

export default async function PlacePage({ params }: PlacePageProps) {
  const place = getPlace((await params).place);
  if (!place) notFound();

  return (
    <div className="page-container py-10 sm:py-14 lg:py-20">
      <Link
        className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.12em] text-[var(--muted)] uppercase"
        href="/map"
      >
        <ArrowLeft aria-hidden="true" size={15} />
        Our map
      </Link>
      <section className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.7fr)]">
        <div className="grid min-h-[34rem] place-items-center rounded-[2rem] border border-[var(--line)] bg-[var(--paper-deep)] p-8 text-center">
          <div>
            <span className="mx-auto grid size-16 place-items-center rounded-full border border-[var(--line-strong)]">
              <Camera aria-hidden="true" size={23} />
            </span>
            <p className="mt-5 text-sm text-[var(--muted)]">
              Reserved for the right photograph
            </p>
          </div>
        </div>
        <div className="flex flex-col rounded-[2rem] bg-[var(--ink)] p-7 text-[var(--paper)] sm:p-10">
          <div className="flex items-center justify-between">
            <Eyebrow className="text-white/50">Pinned memory</Eyebrow>
            <MapPin
              aria-hidden="true"
              className="text-[var(--sand)]"
              size={19}
            />
          </div>
          <div className="my-auto py-16">
            <p className="text-sm text-white/50">{place.country}</p>
            <h1 className="mt-2 font-display text-6xl tracking-[-0.055em] sm:text-7xl">
              {place.city}.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-white/65">
              {place.summary}
            </p>
          </div>
          <p className="font-mono text-[0.65rem] tracking-[0.08em] text-white/45">
            {place.coordinates[0].toFixed(4)}, {place.coordinates[1].toFixed(4)}
          </p>
        </div>
      </section>
    </div>
  );
}
