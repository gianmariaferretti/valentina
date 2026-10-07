"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useState, useTransition } from "react";

import { openLetter } from "@/features/open-when/actions/open-letter";
import { Envelope } from "@/features/open-when/components/envelope";
import { Letter } from "@/features/open-when/components/letter";
import type { OpenWhenLetter } from "@/features/open-when/types";
import { RewardReveal } from "@/features/rewards/components/reward-reveal";
import type { GrantedExperienceReward } from "@/features/rewards/types";

interface LetterExperienceProps {
  readonly letter: OpenWhenLetter;
  readonly sequence: number;
  readonly initialOpened: boolean;
  readonly initialOpenedCount: number;
  readonly initialReward: GrantedExperienceReward | null;
}

export function LetterExperience({
  letter,
  sequence,
  initialOpened,
  initialOpenedCount,
  initialReward,
}: LetterExperienceProps) {
  const reduceMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const [opened, setOpened] = useState(initialOpened);
  const [openedCount, setOpenedCount] = useState(initialOpenedCount);
  const [reward, setReward] = useState(initialReward);
  const [error, setError] = useState<string | null>(null);

  function handleOpen() {
    setError(null);
    startTransition(async () => {
      const result = await openLetter(letter.slug);
      if (result.status === "error") {
        setError(result.message);
        return;
      }

      setOpened(true);
      setOpenedCount(result.openedCount ?? openedCount);
      setReward(result.reward ?? initialReward);
    });
  }

  return (
    <div className="letter-experience">
      <div className="letter-experience__progress" role="status">
        <span>{openedCount} / 11 opened</span>
        <span>{opened ? "Filed: opened" : "Filed: sealed"}</span>
      </div>

      <AnimatePresence initial={false} mode="wait">
        {opened ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="letter-experience__opened"
            initial={reduceMotion ? false : { opacity: 0, y: 26 }}
            key="letter"
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <Letter letter={letter} sequence={sequence} />
            {reward ? <RewardReveal reward={reward} /> : null}
          </motion.div>
        ) : (
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="letter-experience__sealed"
            exit={
              reduceMotion ? undefined : { opacity: 0, scale: 0.96, y: -16 }
            }
            initial={false}
            key="envelope"
            transition={{ duration: 0.38 }}
          >
            <p className="letter-experience__instruction">
              This one is still sealed. Open only when the label is true — or
              when patience has become administratively inconvenient.
            </p>
            <Envelope
              disabled={isPending}
              index={sequence}
              letter={letter}
              mode="detail"
              onOpen={handleOpen}
              opened={false}
            />
            <p aria-live="polite" className="letter-experience__feedback">
              {isPending ? "Breaking the seal…" : error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
