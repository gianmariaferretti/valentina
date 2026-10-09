"use client";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Expand,
  Heart,
  MapPin,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import type { CSSProperties, KeyboardEvent, MouseEvent } from "react";
import { useCallback, useMemo, useRef, useState } from "react";

import { Tape } from "@/components/design-system";
import type { GalleryFilter, GalleryMediaAsset } from "@/features/media/types";
import { useModalDialog } from "@/hooks/use-modal-dialog";

import styles from "./gallery.module.css";

const filters = [
  { id: "all", label: "All" },
  { id: "us", label: "Us" },
  { id: "trips", label: "Trips" },
  { id: "random", label: "Random" },
  { id: "food", label: "Food" },
  { id: "favourites", label: "Favourites" },
] as const satisfies readonly { id: GalleryFilter; label: string }[];

type GalleryCardStyle = CSSProperties & { "--card-rotation": string };

function tapeTone(tape: GalleryMediaAsset["gallery"]["tape"]) {
  return tape === "none" ? null : tape;
}

function GalleryCard({
  asset,
  index,
  onOpen,
  reduceMotion,
}: {
  readonly asset: GalleryMediaAsset;
  readonly index: number;
  readonly onOpen: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly reduceMotion: boolean;
}) {
  const resolvedTape = tapeTone(asset.gallery.tape);
  const style: GalleryCardStyle = {
    "--card-rotation": `${asset.gallery.rotation}deg`,
  };
  const location = asset.location?.label ?? "Somewhere between us";

  return (
    <motion.article
      animate={{ opacity: 1, scale: 1 }}
      className={styles.card}
      data-format={asset.gallery.format}
      data-size={asset.gallery.size}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
      layout
      style={style}
      transition={{
        duration: reduceMotion ? 0 : 0.35,
        delay: reduceMotion ? 0 : Math.min(index * 0.025, 0.18),
      }}
    >
      {resolvedTape ? (
        <Tape
          className={styles.cardTape}
          position="top"
          rotation={asset.gallery.rotation * -0.6}
          size="sm"
          tone={resolvedTape}
        />
      ) : null}

      <button
        aria-label={`Open photograph: ${asset.caption}`}
        className={styles.cardButton}
        onClick={onOpen}
        type="button"
      >
        {asset.gallery.format === "photo-strip" ? (
          <span className={styles.photoStrip}>
            {["34%", "50%", "66%"].map((position, frameIndex) => (
              <span className={styles.stripFrame} key={position}>
                <Image
                  alt={frameIndex === 0 ? asset.alt : ""}
                  className={styles.image}
                  fill
                  loading="lazy"
                  sizes="(max-width: 767px) 29vw, 12vw"
                  src={asset.src}
                  style={{ objectPosition: `${position} 50%` }}
                />
              </span>
            ))}
          </span>
        ) : (
          <span className={styles.imageFrame}>
            <Image
              alt={asset.alt}
              className={styles.image}
              fill
              loading={index < 2 ? "eager" : "lazy"}
              sizes={
                asset.gallery.size === "hero"
                  ? "(max-width: 767px) 94vw, 58vw"
                  : asset.gallery.size === "wide"
                    ? "(max-width: 767px) 94vw, 46vw"
                    : "(max-width: 767px) 94vw, 30vw"
              }
              src={asset.src}
              style={{ objectPosition: asset.position ?? "50% 50%" }}
            />
            {asset.featured ? (
              <span className={styles.favouriteMark}>
                <Heart aria-hidden="true" fill="currentColor" size={12} />
                Favourite
              </span>
            ) : null}
          </span>
        )}

        <span className={styles.cardCaption}>
          <span>
            <strong>{asset.caption}</strong>
            <small>
              {location} · {asset.dateLabel}
            </small>
          </span>
          <Expand aria-hidden="true" size={16} />
        </span>
      </button>

      {asset.gallery.note ? (
        <span className={styles.handwrittenNote}>{asset.gallery.note}</span>
      ) : null}
    </motion.article>
  );
}

export function GalleryScrapbook({
  media,
}: {
  readonly media: readonly GalleryMediaAsset[];
}) {
  const reduceMotion = useReducedMotion();
  const [filter, setFilter] = useState<GalleryFilter>("all");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  const visibleMedia = useMemo(
    () =>
      media.filter((asset) => {
        if (filter === "all") return true;
        if (filter === "favourites") return asset.featured;
        return asset.category === filter;
      }),
    [filter, media],
  );
  const activeAsset = activeIndex === null ? null : visibleMedia[activeIndex];

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const { dialogRef, onKeyDown: handleModalKeyDown } = useModalDialog({
    initialFocusRef: closeButtonRef,
    isOpen: Boolean(activeAsset),
    onClose: closeLightbox,
    returnFocusRef: lastTriggerRef,
  });

  const showPrevious = useCallback(() => {
    setActiveIndex((current) =>
      current === null
        ? null
        : (current - 1 + visibleMedia.length) % visibleMedia.length,
    );
  }, [visibleMedia.length]);

  const showNext = useCallback(() => {
    setActiveIndex((current) =>
      current === null ? null : (current + 1) % visibleMedia.length,
    );
  }, [visibleMedia.length]);

  function handleLightboxKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      showPrevious();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      showNext();
      return;
    }

    handleModalKeyDown(event);
  }

  function selectFilter(nextFilter: GalleryFilter) {
    setFilter(nextFilter);
    setActiveIndex(null);
  }

  return (
    <section aria-labelledby="gallery-collection" className={styles.collection}>
      <div className={styles.collectionHeader}>
        <div>
          <p>Selected evidence · Year One</p>
          <h2 id="gallery-collection">
            {visibleMedia.length}{" "}
            {visibleMedia.length === 1 ? "frame" : "frames"}, carefully
            over-curated.
          </h2>
        </div>
        <nav aria-label="Filter photographs" className={styles.filters}>
          {filters.map((item) => (
            <button
              aria-pressed={filter === item.id}
              data-active={filter === item.id}
              key={item.id}
              onClick={() => selectFilter(item.id)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <motion.div className={styles.grid} layout>
        {visibleMedia.length === 0 ? (
          <p
            className="col-span-full py-14 text-center text-sm text-[var(--muted)]"
            role="status"
          >
            No photographs filed in this category yet.
          </p>
        ) : null}
        {visibleMedia.map((asset, index) => (
          <GalleryCard
            asset={asset}
            index={index}
            key={asset.id}
            onOpen={(event) => {
              lastTriggerRef.current = event.currentTarget;
              setActiveIndex(index);
            }}
            reduceMotion={Boolean(reduceMotion)}
          />
        ))}
      </motion.div>

      <AnimatePresence>
        {activeAsset ? (
          <motion.div
            animate={{ opacity: 1 }}
            aria-label={`${activeAsset.caption} photograph viewer`}
            aria-modal="true"
            className={styles.lightbox}
            exit={{ opacity: 0 }}
            initial={reduceMotion ? false : { opacity: 0 }}
            onKeyDown={handleLightboxKeyDown}
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) closeLightbox();
            }}
            ref={dialogRef}
            role="dialog"
            tabIndex={-1}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
          >
            <button
              aria-label="Close photograph viewer"
              className={styles.lightboxClose}
              onClick={closeLightbox}
              ref={closeButtonRef}
              type="button"
            >
              <X aria-hidden="true" size={21} />
            </button>

            <button
              aria-label="Previous photograph"
              className={`${styles.lightboxNavigation} ${styles.lightboxPrevious}`}
              onClick={showPrevious}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={20} />
            </button>

            <motion.figure
              animate={{ opacity: 1, scale: 1 }}
              className={styles.lightboxFigure}
              initial={reduceMotion ? false : { opacity: 0, scale: 0.975 }}
              key={activeAsset.id}
              transition={{ duration: reduceMotion ? 0 : 0.32 }}
            >
              <div className={styles.lightboxImage}>
                <Image
                  alt={activeAsset.alt}
                  className="object-contain"
                  fill
                  fetchPriority="high"
                  sizes="100vw"
                  src={activeAsset.src}
                />
              </div>
              <figcaption>
                <div>
                  <span>
                    {String((activeIndex ?? 0) + 1).padStart(2, "0")} /{" "}
                    {String(visibleMedia.length).padStart(2, "0")}
                  </span>
                  <h2>{activeAsset.caption}</h2>
                </div>
                <div className={styles.lightboxMeta}>
                  <span>
                    <CalendarDays aria-hidden="true" size={14} />
                    {activeAsset.dateLabel}
                  </span>
                  <span>
                    <MapPin aria-hidden="true" size={14} />
                    {activeAsset.location?.label ?? "Private archive"}
                  </span>
                </div>
              </figcaption>
            </motion.figure>

            <button
              aria-label="Next photograph"
              className={`${styles.lightboxNavigation} ${styles.lightboxNext}`}
              onClick={showNext}
              type="button"
            >
              <ArrowRight aria-hidden="true" size={20} />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
