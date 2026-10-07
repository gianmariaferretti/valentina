import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  MapPin,
  NotebookPen,
} from "lucide-react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  BoardingPass,
  HandwrittenNote,
  PaperCard,
  PassportStamp,
  PostageStamp,
  SectionLabel,
  Sticker,
  Tape,
} from "@/components/design-system";
import { getAdjacentPlaces, getPlace, places } from "@/data/places";
import { PlaceMiniMap } from "@/features/map/components/place-mini-map";
import type { Destination, DestinationSticker } from "@/features/map/types";

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
  return {
    title: place?.city ?? "Place",
    description: place?.shortDescription,
  };
}

function Coordinates({ place }: { place: Destination }) {
  const [longitude, latitude] = place.coordinates;
  return (
    <span>
      {Math.abs(latitude).toFixed(4)}° {latitude >= 0 ? "N" : "S"} ·{" "}
      {Math.abs(longitude).toFixed(4)}° {longitude >= 0 ? "E" : "W"}
    </span>
  );
}

function MemorySticker({ sticker }: { sticker: DestinationSticker }) {
  if (sticker.kind === "annotation") {
    return (
      <HandwrittenNote rotation={sticker.rotation} tone="paper">
        {sticker.text}
      </HandwrittenNote>
    );
  }

  return (
    <Sticker
      rotation={sticker.rotation}
      size="sm"
      text={sticker.text}
      variant={
        sticker.kind === "date"
          ? "date"
          : sticker.kind === "coordinates"
            ? "location"
            : "text"
      }
    />
  );
}

export default async function PlacePage({ params }: PlacePageProps) {
  const place = getPlace((await params).place);
  if (!place) notFound();

  const { previous, next } = getAdjacentPlaces(place);
  const [longitude, latitude] = place.coordinates;
  const openStreetMapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=11/${latitude}/${longitude}`;

  return (
    <article className="place-memory-page pb-16 sm:pb-20 lg:pb-28">
      <div className="page-container pt-8 sm:pt-10">
        <Link
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[var(--line-strong)] px-4 text-[0.62rem] font-bold tracking-[0.13em] text-[var(--muted)] uppercase transition hover:bg-white/50 hover:text-[var(--ink)]"
          href="/map"
        >
          <ArrowLeft aria-hidden="true" size={15} />
          Our map
        </Link>

        <header className="place-memory-hero mt-6">
          <Image
            alt={place.coverImage.alt}
            className="object-cover"
            fill
            priority
            sizes="(max-width: 640px) 100vw, 92rem"
            src={place.coverImage.src}
          />
          <div className="place-memory-hero__shade" />
          <div className="place-memory-hero__topline">
            <span>Destination {String(place.atlasOrder).padStart(2, "0")}</span>
            <span>V+G private atlas</span>
          </div>
          <div className="place-memory-hero__title">
            <p>{place.country}</p>
            <h1>{place.city}</h1>
            <div>
              <time>{place.dateRange.label}</time>
              <span aria-hidden="true">·</span>
              <Coordinates place={place} />
            </div>
          </div>
          <PassportStamp
            className="place-memory-hero__stamp"
            code={place.travelCode}
            date="YEAR ONE"
            location={place.city}
            rotation={-8}
          />
          <Tape
            className="place-memory-hero__tape"
            rotation={-4}
            tone="clear"
          />
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
          {place.stickers.map((sticker) => (
            <MemorySticker key={sticker.id} sticker={sticker} />
          ))}
        </div>

        <section className="mt-16 grid gap-10 lg:mt-24 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-16">
          <div>
            <SectionLabel index="01">The story</SectionLabel>
            <p className="mt-8 max-w-3xl font-display text-4xl leading-[1.03] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              {place.shortDescription}
            </p>
            <div className="mt-9 grid max-w-3xl gap-5 text-base leading-8 text-[var(--ink-soft)] sm:grid-cols-2">
              {place.longDescription.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>

          <aside>
            <BoardingPass
              city={place.city}
              code={place.travelCode}
              country={place.country}
              date={place.dateRange.label}
            />
            <div className="mt-8 flex items-end justify-between gap-4">
              <PostageStamp
                country={place.country}
                tone={place.stampTone}
                value={String(place.atlasOrder).padStart(2, "0")}
                year="Y1"
              />
              <HandwrittenNote className="pb-2 text-right" rotation={3}>
                photograph pending, memory reserved
              </HandwrittenNote>
            </div>
          </aside>
        </section>

        <section className="mt-16 grid gap-6 sm:mt-24 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div>
            <SectionLabel index="02">At these coordinates</SectionLabel>
            <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-[var(--paper-deep)] p-2">
              <PlaceMiniMap place={place} />
            </div>
          </div>
          <div className="flex flex-col justify-between rounded-[1.75rem] bg-[var(--ink)] p-7 text-[var(--paper)] sm:p-8 lg:mt-12">
            <MapPin
              aria-hidden="true"
              className="text-[var(--sand)]"
              size={22}
            />
            <div className="my-12">
              <p className="text-[0.58rem] font-bold tracking-[0.16em] text-white/40 uppercase">
                Exact pin
              </p>
              <p className="mt-3 font-mono text-sm tracking-[0.04em] text-white/78">
                <Coordinates place={place} />
              </p>
              <p className="mt-5 text-sm leading-6 text-white/50">
                The map is interactive. On touch screens, use two fingers to
                move it without trapping page scroll.
              </p>
            </div>
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 px-4 text-[0.62rem] font-bold tracking-[0.12em] uppercase transition hover:bg-white/10"
              href={openStreetMapUrl}
              rel="noreferrer"
              target="_blank"
            >
              Open accessible map
              <ExternalLink aria-hidden="true" size={14} />
            </a>
          </div>
        </section>

        <section className="mt-16 sm:mt-24">
          <SectionLabel index="03">Selected evidence</SectionLabel>
          <div className="place-gallery mt-8">
            {place.galleryImages.map((image, index) => (
              <figure
                className="place-gallery__item"
                key={`${image.src}-${index}`}
              >
                <div>
                  <Image
                    alt={image.alt}
                    className="object-cover"
                    fill
                    sizes="(max-width: 767px) 100vw, 40vw"
                    src={image.src}
                  />
                </div>
                <figcaption>
                  <span>{image.caption}</span>
                  <small>Frame {String(index + 1).padStart(2, "0")}</small>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="mt-16 sm:mt-24">
          <SectionLabel index="04">Notes from the margins</SectionLabel>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {place.memories.map((memory, index) => (
              <PaperCard
                className={
                  index === 1
                    ? "md:-rotate-1"
                    : index === 2
                      ? "md:rotate-1"
                      : undefined
                }
                key={memory.id}
                texture={index === 1 ? "ruled" : "plain"}
                tone={index === 2 ? "taupe" : "white"}
              >
                <NotebookPen aria-hidden="true" size={18} strokeWidth={1.5} />
                <p className="mt-10 text-[0.56rem] font-bold tracking-[0.15em] text-[var(--muted)] uppercase">
                  Note {String(index + 1).padStart(2, "0")}
                </p>
                <h2 className="mt-2 font-display text-3xl tracking-[-0.035em]">
                  {memory.title}
                </h2>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">
                  {memory.note}
                </p>
              </PaperCard>
            ))}
          </div>
        </section>

        <nav
          aria-label="Adjacent destinations"
          className="mt-16 grid overflow-hidden rounded-[1.75rem] border border-[var(--line)] sm:mt-24 sm:grid-cols-2"
        >
          <Link
            className="group flex min-h-40 items-center gap-5 bg-white/35 p-6 transition hover:bg-white/65 sm:p-8"
            href={`/map/${previous.slug}`}
          >
            <ArrowLeft
              aria-hidden="true"
              className="transition-transform group-hover:-translate-x-1"
              size={20}
            />
            <span>
              <small className="text-[0.56rem] font-bold tracking-[0.15em] text-[var(--muted)] uppercase">
                Previous pin
              </small>
              <strong className="mt-2 block font-display text-3xl font-normal tracking-[-0.035em]">
                {previous.city}
              </strong>
              <span className="mt-1 block text-xs text-[var(--muted)]">
                {previous.country}
              </span>
            </span>
          </Link>
          <Link
            className="group flex min-h-40 items-center justify-end gap-5 border-t border-[var(--line)] bg-[var(--ink)] p-6 text-right text-[var(--paper)] transition hover:bg-[var(--oxblood)] sm:border-t-0 sm:border-l sm:p-8"
            href={`/map/${next.slug}`}
          >
            <span>
              <small className="text-[0.56rem] font-bold tracking-[0.15em] text-white/45 uppercase">
                Next pin
              </small>
              <strong className="mt-2 block font-display text-3xl font-normal tracking-[-0.035em]">
                {next.city}
              </strong>
              <span className="mt-1 block text-xs text-white/50">
                {next.country}
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="transition-transform group-hover:translate-x-1"
              size={20}
            />
          </Link>
        </nav>
      </div>
    </article>
  );
}
