"use client";

import {
  ArrowDown,
  Check,
  Eye,
  RotateCcw,
  Sparkles,
  Trophy,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useId, useState } from "react";

import { Sticker } from "@/components/design-system";
import type { Award } from "@/features/awards/types";

import styles from "./awards.module.css";

type RevealStage = "closed" | "nominees" | "winner";

interface AwardRevealCardProps {
  readonly award: Award;
  readonly index: number;
}

export function AwardRevealCard({ award, index }: AwardRevealCardProps) {
  const panelId = useId();
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<RevealStage>("closed");
  const winner = award.nominees.find(
    (nominee) => nominee.id === award.winnerId,
  );

  if (!winner) return null;

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <article
      className={styles.card}
      data-presentation={award.presentation}
      data-stage={stage}
    >
      <button
        aria-label={`${stage === "closed" ? "View nominees" : "Close nominees"} for ${award.category}`}
        aria-controls={panelId}
        aria-expanded={stage !== "closed"}
        className={styles.cardTrigger}
        onClick={() => setStage(stage === "closed" ? "nominees" : "closed")}
        type="button"
      >
        <span className={styles.cardMedia}>
          <Image
            alt={award.photo.alt}
            fill
            sizes={
              award.presentation === "wide" || award.presentation === "finale"
                ? "(max-width: 768px) 100vw, 92vw"
                : "(max-width: 768px) 100vw, 46vw"
            }
            src={award.photo.src}
            style={{ objectPosition: award.photo.position }}
          />
          <span aria-hidden="true" className={styles.cardScrim} />
          <span className={styles.cardIndex}>
            {String(index + 1).padStart(2, "0")} / 15
          </span>
          <span className={styles.cardSticker}>
            <Sticker
              rotation={award.sticker.rotation}
              size="sm"
              text={award.sticker.text}
              variant={award.sticker.variant}
            />
          </span>
        </span>

        <span className={styles.cardIntro}>
          <span className={styles.cardEyebrow}>
            {award.presentation === "finale"
              ? "Highest honour"
              : "Official category"}
          </span>
          <strong>{award.category}</strong>
          <span className={styles.cardDescription}>{award.description}</span>
          <span className={styles.cardAction}>
            {stage === "closed" ? (
              <>
                <Eye aria-hidden="true" size={15} /> View nominees
              </>
            ) : (
              <>
                Close envelope <ArrowDown aria-hidden="true" size={15} />
              </>
            )}
          </span>
        </span>
      </button>

      <AnimatePresence initial={false} mode="wait">
        {stage === "nominees" ? (
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            aria-label={`${award.category} nominees`}
            className={styles.nomineePanel}
            exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
            id={panelId}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            key="nominees"
            transition={transition}
          >
            <div className={styles.panelHeading}>
              <div>
                <span>Envelope opened</span>
                <h3>The nominees</h3>
              </div>
              <span className={styles.juryMark}>V+G jury</span>
            </div>

            <ol className={styles.nomineeList}>
              {award.nominees.map((nominee, nomineeIndex) => (
                <motion.li
                  animate={{ opacity: 1, x: 0 }}
                  initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                  key={nominee.id}
                  transition={{
                    delay: reduceMotion ? 0 : nomineeIndex * 0.055,
                    duration: reduceMotion ? 0 : 0.3,
                  }}
                >
                  <span>{String(nomineeIndex + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{nominee.name}</strong>
                    <p>{nominee.citation}</p>
                  </div>
                </motion.li>
              ))}
            </ol>

            <button
              className={styles.revealButton}
              onClick={() => setStage("winner")}
              type="button"
            >
              <Trophy aria-hidden="true" size={17} />
              Reveal the winner
            </button>
          </motion.section>
        ) : null}

        {stage === "winner" ? (
          <motion.section
            animate={{ opacity: 1 }}
            aria-label={`${award.category} winner`}
            aria-live="polite"
            className={styles.winnerPanel}
            id={panelId}
            initial={reduceMotion ? false : { opacity: 0 }}
            key="winner"
            transition={{ duration: reduceMotion ? 0 : 0.28 }}
          >
            <Sparkles aria-hidden="true" className={styles.winnerSparkOne} />
            <Sparkles aria-hidden="true" className={styles.winnerSparkTwo} />
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              initial={
                reduceMotion ? false : { opacity: 0, scale: 0.97, y: 12 }
              }
              transition={{
                delay: reduceMotion ? 0 : 0.12,
                duration: reduceMotion ? 0 : 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <p className={styles.winnerPrelude}>And the winner is…</p>
              <Trophy aria-hidden="true" className={styles.winnerTrophy} />
              <h3>{winner.name}</h3>
              <p className={styles.winnerCitation}>{winner.citation}</p>

              {award.prize ? (
                <p className={styles.winnerPrize}>{award.prize}</p>
              ) : null}

              {award.evidence ? (
                <div className={styles.evidence}>
                  <span>
                    <Check aria-hidden="true" size={13} />{" "}
                    {award.evidence.label}
                  </span>
                  <p>{award.evidence.value}</p>
                </div>
              ) : null}

              <button
                className={styles.replayButton}
                onClick={() => setStage("nominees")}
                type="button"
              >
                <RotateCcw aria-hidden="true" size={14} /> Show nominees again
              </button>
            </motion.div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </article>
  );
}
