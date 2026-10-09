"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { archiveScenes } from "@/data/spicy-archive";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import {
  advanceArchive,
  closeArchive,
  completeArchive,
  goBackInArchive,
  replayArchiveReveal,
} from "../actions/archive-actions";
import {
  ARCHIVE_REDUCED_REVEAL_MS,
  ARCHIVE_REVEAL_MS,
  type ArchiveStage,
} from "../lib/archive-domain";
import styles from "./spicy-archive.module.css";

const subscribe = () => () => {};

export function SpicyArchive({ imageAlt }: { readonly imageAlt: string }) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState<ArchiveStage>("discovery");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);
  const [saved, setSaved] = useState(false);
  const [breakingSeal, setBreakingSeal] = useState(false);
  const [revealDuration, setRevealDuration] = useState(ARCHIVE_REVEAL_MS);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const activeRef = useRef(true);
  const exitingRef = useRef(false);
  const sealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const close = useCallback(async () => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    try {
      await closeArchive();
    } finally {
      router.push("/home");
    }
  }, [router]);
  const { dialogRef, onKeyDown } = useModalDialog({
    isOpen: true,
    onClose: () => {
      void close();
    },
    initialFocusRef: titleRef,
  });

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      if (sealTimer.current) clearTimeout(sealTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const background = Array.from(document.body.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        element !== dialogRef.current &&
        !["SCRIPT", "STYLE", "LINK"].includes(element.tagName),
    );
    const previous = background.map((element) => element.inert);
    background.forEach((element) => {
      element.inert = true;
    });
    return () => {
      background.forEach((element, index) => {
        element.inert = previous[index];
      });
    };
  }, [hydrated, dialogRef]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => titleRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [stage]);

  function focusStage() {
    titleRef.current?.focus();
    dialogRef.current?.scrollTo({ top: 0 });
  }
  async function advance() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    if (stage === "sealed-file") setBreakingSeal(true);
    try {
      const result = await advanceArchive(
        stage,
        stage === "age-confirmation",
        Boolean(reducedMotion),
      );
      if (stage === "sealed-file" && !reducedMotion && result.ok)
        await new Promise<void>((resolve) => {
          sealTimer.current = setTimeout(resolve, 900);
        });
      if (!activeRef.current) return;
      if (result.ok) {
        if (stage === "sealed-file")
          setRevealDuration(
            reducedMotion ? ARCHIVE_REDUCED_REVEAL_MS : ARCHIVE_REVEAL_MS,
          );
        setStage(result.stage);
      } else setMessage(result.message);
    } catch {
      if (activeRef.current)
        setMessage("The file could not be opened. Please try again.");
    } finally {
      if (activeRef.current) {
        setBusy(false);
        setBreakingSeal(false);
      }
    }
  }
  async function back() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await goBackInArchive();
      if (!activeRef.current) return;
      if (result.ok) setStage(result.stage);
      else setMessage(result.message);
    } catch {
      if (activeRef.current) setMessage("Could not return. Please try again.");
    } finally {
      if (activeRef.current) setBusy(false);
    }
  }
  async function saveCompletion() {
    setBusy(true);
    setMessage("");
    try {
      const result = await completeArchive();
      if (!activeRef.current) return;
      if (result.ok) {
        setSaved(true);
        router.refresh();
      } else setMessage(result.message);
    } catch {
      if (activeRef.current)
        setMessage("Your reward could not be saved. Please retry.");
    } finally {
      if (activeRef.current) setBusy(false);
    }
  }
  function finishReveal() {
    if (stage !== "photo-reveal" || !imageLoaded) return;
    setStage("final-reveal");
    titleRef.current?.focus();
    void saveCompletion();
  }
  async function replay() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await replayArchiveReveal(Boolean(reducedMotion));
      if (!activeRef.current) return;
      if (result.ok) {
        setImageLoaded(false);
        setRevealDuration(
          reducedMotion ? ARCHIVE_REDUCED_REVEAL_MS : ARCHIVE_REVEAL_MS,
        );
        setImageFailed(false);
        setImageVersion((v) => v + 1);
        setStage(result.stage);
      } else setMessage(result.message);
    } catch {
      if (activeRef.current)
        setMessage("The reveal could not restart. Please try again.");
    } finally {
      if (activeRef.current) setBusy(false);
    }
  }
  const photoVisible = stage === "photo-reveal" || stage === "final-reveal";
  const scene = archiveScenes[stage];
  const content = (
    <div
      ref={dialogRef}
      className={styles.archive}
      role="dialog"
      aria-modal="true"
      aria-labelledby="archive-title"
      tabIndex={-1}
      onKeyDown={(event) => {
        if (
          event.key === "Tab" &&
          document.activeElement === titleRef.current
        ) {
          event.preventDefault();
          const controls = Array.from(
            dialogRef.current?.querySelectorAll<HTMLButtonElement>(
              "button:not(:disabled)",
            ) ?? [],
          );
          (event.shiftKey ? controls.at(-1) : controls[0])?.focus();
        } else onKeyDown(event);
      }}
      data-stage={stage}
    >
      <header className={styles.topline}>
        <span>V&amp;G PRIVATE ARCHIVE</span>
        <button
          type="button"
          onClick={() => {
            void close();
          }}
        >
          Close archive <span aria-hidden="true">×</span>
        </button>
      </header>
      <div className={styles.stageContainer}>
        <AnimatePresence mode="wait" initial={false}>
          {!photoVisible ? (
            <motion.section
              className={`${styles.scene} ${stage === "sealed-file" ? styles.envelope : ""}`}
              key={stage}
              initial={
                reducedMotion
                  ? false
                  : {
                      opacity: 0,
                      y: stage === "age-confirmation" ? 22 : 0,
                      scale: stage === "sealed-file" ? 0.96 : 1,
                    }
              }
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.5 }}
              onAnimationComplete={focusStage}
            >
              {stage === "age-confirmation" ? (
                <span className={styles.ageStamp}>18+</span>
              ) : null}
              {stage === "point-of-no-return" ? (
                <span className={styles.warning}>FINAL WARNING</span>
              ) : null}
              {stage === "sealed-file" ? (
                <>
                  <motion.div
                    className={styles.flap}
                    aria-hidden="true"
                    animate={{
                      rotateX: breakingSeal && !reducedMotion ? 160 : 0,
                    }}
                    transition={{ duration: 0.6 }}
                  />
                  <motion.div
                    aria-hidden="true"
                    className={styles.emergingFrame}
                    initial={{ opacity: 0 }}
                    animate={{
                      y: breakingSeal && !reducedMotion ? -45 : 0,
                      opacity: breakingSeal ? 1 : 0,
                    }}
                  />
                </>
              ) : null}
              <h1 id="archive-title" tabIndex={-1} ref={titleRef}>
                {scene.title}
              </h1>
              <div
                className={
                  stage === "sealed-file" ? styles.fileDetails : undefined
                }
              >
                {scene.paragraphs.map((paragraph, index) => (
                  <motion.p
                    key={paragraph}
                    initial={
                      reducedMotion ||
                      (stage !== "discovery" && stage !== "point-of-no-return")
                        ? false
                        : { opacity: 0 }
                    }
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: reducedMotion ? 0 : 0.6 + index * 0.18,
                    }}
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>
              {stage === "curiosity" ? (
                <span className={styles.annotation}>
                  Curiosity level: suspicious.
                </span>
              ) : null}
              {stage === "age-confirmation" ? (
                <small>
                  This is an age self-declaration, not a verified age check.
                </small>
              ) : null}
              <div className={styles.actions}>
                <motion.button
                  className={
                    stage === "sealed-file" ? styles.seal : styles.primary
                  }
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    void advance();
                  }}
                  animate={{
                    rotate: breakingSeal && !reducedMotion ? -12 : 0,
                    scale: breakingSeal && !reducedMotion ? 0.9 : 1,
                  }}
                >
                  {busy
                    ? stage === "sealed-file"
                      ? "SEAL BROKEN"
                      : "Opening..."
                    : scene.action}
                </motion.button>
                {stage === "age-confirmation" ||
                stage === "point-of-no-return" ? (
                  <button
                    className={styles.secondary}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      void back();
                    }}
                  >
                    {stage === "age-confirmation"
                      ? "TAKE ME BACK"
                      : "I CHANGED MY MIND"}
                  </button>
                ) : null}
              </div>
            </motion.section>
          ) : (
            <motion.section
              className={styles.photographScene}
              key="photograph"
              initial={reducedMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.5 }}
              onAnimationComplete={focusStage}
            >
              <h1
                id="archive-title"
                className={styles.photoTitle}
                tabIndex={-1}
                ref={titleRef}
              >
                {scene.title}
              </h1>
              <div className={styles.photoFrame}>
                <div className={styles.concealed} aria-hidden="true">
                  V+G <small>PRIVATE FILE</small>
                </div>
                <div
                  className={`${styles.imageMask} ${imageLoaded ? (stage === "final-reveal" ? styles.revealed : styles.revealing) : ""}`}
                  style={
                    {
                      "--reveal-duration": `${revealDuration}ms`,
                    } as CSSProperties
                  }
                  onAnimationEnd={finishReveal}
                >
                  <Image
                    key={imageVersion}
                    src={`/api/secret-image?v=${imageVersion}`}
                    alt={imageAlt}
                    fill
                    unoptimized
                    loading="eager"
                    sizes="(max-width: 768px) 88vw, 480px"
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageFailed(true)}
                  />
                </div>
              </div>
              {stage === "photo-reveal" ? (
                <p className={styles.decoding} role="status">
                  {imageFailed
                    ? "The private image is unavailable. No reward has been granted."
                    : imageLoaded
                      ? "AUTHORIZATION VERIFIED... REVEALING CLASSIFIED MATERIAL..."
                      : "Opening the private file..."}
                </p>
              ) : (
                <>
                  <span className={styles.warning}>TOP SECRET</span>
                  <p>{scene.paragraphs[0]}</p>
                </>
              )}
              <div className={styles.actions}>
                {imageFailed ? (
                  <button
                    className={styles.primary}
                    disabled={busy}
                    onClick={() => {
                      void replay();
                    }}
                    type="button"
                  >
                    RETRY IMAGE
                  </button>
                ) : null}
                {stage === "final-reveal" ? (
                  <>
                    <button
                      className={styles.secondary}
                      disabled={busy}
                      onClick={() => {
                        void replay();
                      }}
                      type="button"
                    >
                      REPLAY REVEAL
                    </button>
                    {!saved ? (
                      <button
                        className={styles.primary}
                        disabled={busy}
                        onClick={() => {
                          void saveCompletion();
                        }}
                        type="button"
                      >
                        {busy ? "Saving reward..." : "RETRY SAVING REWARD"}
                      </button>
                    ) : (
                      <p className={styles.reward} role="status">
                        GV-032 · YOU FOUND ME
                        <br />
                        Coupon saved. Not redeemed.
                      </p>
                    )}
                  </>
                ) : null}
              </div>
            </motion.section>
          )}
        </AnimatePresence>
        {message ? (
          <p className={styles.error} role="alert">
            {message}
            <button
              type="button"
              onClick={() => {
                setStage("discovery");
                setMessage("");
                setImageLoaded(false);
                setImageFailed(false);
                setSaved(false);
              }}
            >
              Restart archive
            </button>
          </p>
        ) : null}
      </div>
      <footer className={styles.footer}>
        THE SPICY ARCHIVE <span>Strictly between us.</span>
      </footer>
    </div>
  );
  return hydrated ? createPortal(content, document.body) : null;
}
