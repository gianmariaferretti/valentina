"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type CSSProperties,
} from "react";
import { archiveScenes } from "@/data/spicy-archive";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import {
  advanceArchive,
  closeArchive,
  completeArchive,
  decryptArchive,
  goBackInArchive,
  replayArchiveReveal,
  resumeArchive,
  solveArchiveDate,
  solveArchiveInvestigation,
  type ArchiveProgress,
} from "../actions/archive-actions";
import { accessPrivateCollection } from "../actions/private-collection-actions";
import {
  ARCHIVE_REDUCED_REVEAL_MS,
  ARCHIVE_REVEAL_MS,
  type ArchiveStage,
} from "../lib/archive-domain";
import styles from "./spicy-archive.module.css";

const subscribe = () => () => {};
const investigationDocuments = [
  {
    id: "date",
    token: "31",
    label: "Document 01 · Origin",
    clue: "The file begins on the day our Year One record starts: 31 October 2025.",
  },
  {
    id: "recipient",
    token: "V",
    label: "Document 02 · Recipient",
    clue: "Clearance belongs to Valentina, and to Valentina only.",
  },
  {
    id: "subject",
    token: "G",
    label: "Document 03 · Subject",
    clue: "The person under investigation is Gianmaria.",
  },
] as const;
const PrivateCollection = dynamic(
  () =>
    import("./private-collection").then((module) => module.PrivateCollection),
  {
    loading: () => (
      <section>
        <h1 id="archive-title" className={styles.photoTitle}>
          THE PRIVATE COLLECTION
        </h1>
        <p role="status">Opening the private collection...</p>
      </section>
    ),
  },
);

export function SpicyArchive({
  imageAlt,
  initialStage,
  progress: initialProgress,
}: {
  readonly imageAlt: string;
  readonly initialStage: ArchiveStage;
  readonly progress: ArchiveProgress;
}) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const reducedMotion = useReducedMotion();
  const [stage, setStage] = useState<ArchiveStage>(initialStage);
  const [progress, setProgress] = useState(initialProgress);
  const [dateParts, setDateParts] = useState({ day: "", month: "", year: "" });
  const [inspected, setInspected] = useState<readonly string[]>([]);
  const [fragments, setFragments] = useState<readonly string[]>([]);
  const [authorizationStep, setAuthorizationStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageVersion, setImageVersion] = useState(0);
  const [saved, setSaved] = useState(false);
  const [breakingSeal, setBreakingSeal] = useState(false);
  const [revealDuration, setRevealDuration] = useState(ARCHIVE_REVEAL_MS);
  const [collectionOpen, setCollectionOpen] = useState(false);
  const [collectionReady, setCollectionReady] = useState(false);
  const [openingCollection, startCollectionTransition] = useTransition();
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

  useEffect(() => {
    if (stage !== "final-reveal") return;
    const timer = setTimeout(() => setCollectionReady(true), 2000);
    return () => clearTimeout(timer);
  }, [stage]);

  function openCollection() {
    if (openingCollection || busy) return;
    setMessage("");
    startCollectionTransition(async () => {
      try {
        const result = await accessPrivateCollection("browse");
        if (!activeRef.current || exitingRef.current) return;
        if (result.ok) setCollectionOpen(true);
        else setMessage(result.message);
      } catch {
        if (activeRef.current)
          setMessage(
            "The private collection could not be opened. Please retry.",
          );
      }
    });
  }

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
        setCollectionReady(false);
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
  async function resume() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await resumeArchive();
      if (!activeRef.current) return;
      if (result.ok) setStage(result.stage);
      else setMessage(result.message);
    } catch {
      if (activeRef.current) setMessage("The saved file could not be opened.");
    } finally {
      if (activeRef.current) setBusy(false);
    }
  }
  async function submitDate() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await solveArchiveDate(dateParts);
      if (!activeRef.current) return;
      if (result.ok) {
        setProgress((current) => ({ ...current, classifiedAccess: true }));
        setStage(result.stage);
      } else setMessage(result.message);
    } catch {
      if (activeRef.current) setMessage("The dossier could not be verified.");
    } finally {
      if (activeRef.current) setBusy(false);
    }
  }
  async function submitInvestigation() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await solveArchiveInvestigation(fragments);
      if (!activeRef.current) return;
      if (result.ok) {
        setProgress((current) => ({ ...current, investigation: true }));
        setStage(result.stage);
      } else setMessage(result.message);
    } catch {
      if (activeRef.current) setMessage("The evidence could not be archived.");
    } finally {
      if (activeRef.current) setBusy(false);
    }
  }
  async function submitDecryption() {
    if (busy || authorizationStep !== 3) return;
    setBusy(true);
    setBreakingSeal(true);
    setMessage("");
    try {
      const result = await decryptArchive(
        ["inspect", "unseal", "authorize"],
        Boolean(reducedMotion),
      );
      if (!activeRef.current) return;
      if (result.ok) {
        setRevealDuration(
          reducedMotion ? ARCHIVE_REDUCED_REVEAL_MS : ARCHIVE_REVEAL_MS,
        );
        setStage(result.stage);
      } else setMessage(result.message);
    } catch {
      if (activeRef.current) setMessage("The seal could not be opened.");
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
        setProgress((current) => ({ ...current, completed: true }));
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
    if (busy || openingCollection) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await replayArchiveReveal(Boolean(reducedMotion));
      if (!activeRef.current) return;
      if (result.ok) {
        setCollectionReady(false);
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
      <div
        className={`${styles.stageContainer} ${collectionOpen ? styles.collectionContainer : ""}`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {collectionOpen ? (
            <motion.div
              key="private-collection"
              initial={reducedMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.3 }}
            >
              <PrivateCollection
                titleRef={titleRef}
                onBack={() => {
                  setCollectionOpen(false);
                  setMessage("");
                }}
              />
            </motion.div>
          ) : !photoVisible ? (
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
              {stage === "curiosity" ? (
                <fieldset className={styles.dossierPuzzle}>
                  <legend>
                    Reconstruct the date recorded on the Year One cover.
                  </legend>
                  <p>
                    Use day, month and year. The answer is already in this
                    website; no private knowledge is required.
                  </p>
                  <div className={styles.dateControls}>
                    {(
                      [
                        ["day", "Day", ["30", "31", "01"]],
                        ["month", "Month", ["09", "10", "11"]],
                        ["year", "Year", ["2024", "2025", "2026"]],
                      ] as const
                    ).map(([key, label, options]) => (
                      <label key={key}>
                        {label}
                        <select
                          value={dateParts[key]}
                          onChange={(event) =>
                            setDateParts((current) => ({
                              ...current,
                              [key]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Select</option>
                          {options.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ) : null}
              {stage === "point-of-no-return" ? (
                <div className={styles.investigation}>
                  <p>
                    Open all three records. Then assemble the file reference in
                    this order: starting day · recipient initial · subject
                    initial.
                  </p>
                  <div className={styles.investigationDocuments}>
                    {investigationDocuments.map((document) => (
                      <div className={styles.evidence} key={document.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setInspected((current) =>
                              current.includes(document.id)
                                ? current
                                : [...current, document.id],
                            )
                          }
                        >
                          {document.label} <span aria-hidden="true">↗</span>
                        </button>
                        {inspected.includes(document.id) ? (
                          <div>
                            <p>{document.clue}</p>
                            <button
                              type="button"
                              disabled={
                                fragments.includes(document.token) ||
                                fragments.length >= 3
                              }
                              onClick={() =>
                                setFragments((current) => [
                                  ...current,
                                  document.token,
                                ])
                              }
                            >
                              Add fragment {document.token}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div className={styles.selectedFragments} aria-live="polite">
                    <span>File reference</span>
                    <strong>
                      {fragments.length ? fragments.join(" — ") : "_ — _ — _"}
                    </strong>
                    <button
                      type="button"
                      disabled={!fragments.length}
                      onClick={() => setFragments([])}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              ) : null}
              {stage === "sealed-file" ? (
                <div className={styles.decryption}>
                  <p>
                    The evidence is accepted. Authorize this private file in
                    three deliberate steps. The photograph is not requested
                    until the seal opens.
                  </p>
                  {(
                    [
                      "Inspect the seal",
                      "Break the seal",
                      "Authorize private view",
                    ] as const
                  ).map((label, index) => (
                    <button
                      type="button"
                      key={label}
                      disabled={authorizationStep !== index || busy}
                      onClick={() => setAuthorizationStep(index + 1)}
                    >
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      {label}
                      <span aria-hidden="true">
                        {authorizationStep > index ? "✓" : "→"}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}
              <div className={styles.actions}>
                <motion.button
                  className={
                    stage === "sealed-file" ? styles.seal : styles.primary
                  }
                  type="button"
                  disabled={
                    busy ||
                    (stage === "curiosity" &&
                      (!dateParts.day ||
                        !dateParts.month ||
                        !dateParts.year)) ||
                    (stage === "point-of-no-return" &&
                      (inspected.length !== 3 || fragments.length !== 3)) ||
                    (stage === "sealed-file" && authorizationStep !== 3)
                  }
                  onClick={() => {
                    if (stage === "curiosity") void submitDate();
                    else if (stage === "point-of-no-return")
                      void submitInvestigation();
                    else if (stage === "sealed-file") void submitDecryption();
                    else if (stage === "discovery" && progress.classifiedAccess)
                      void resume();
                    else void advance();
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
                    : stage === "discovery" && progress.classifiedAccess
                      ? "RESUME YOUR FILE"
                      : stage === "curiosity"
                        ? "VERIFY DATE"
                        : stage === "point-of-no-return"
                          ? "SUBMIT EVIDENCE"
                          : stage === "sealed-file"
                            ? "OPEN THE FILE"
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
                      disabled={busy || openingCollection}
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
                        disabled={busy || openingCollection}
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
              {stage === "final-reveal" && collectionReady ? (
                <div className={styles.collectionInvitation}>
                  <button
                    className={styles.secondary}
                    type="button"
                    disabled={busy || openingCollection}
                    onClick={openCollection}
                  >
                    {openingCollection
                      ? "OPENING THE PRIVATE COLLECTION..."
                      : "WANTED SOMETHING ACTUALLY SPICY?"}
                  </button>
                  <p>Careful what you wish for.</p>
                </div>
              ) : null}
            </motion.section>
          )}
        </AnimatePresence>
        {message ? (
          <p className={styles.error} role="alert">
            {message}
            <button
              type="button"
              disabled={busy || openingCollection}
              onClick={() => {
                setStage("discovery");
                setMessage("");
                setImageLoaded(false);
                setImageFailed(false);
                setSaved(false);
                setCollectionOpen(false);
                setCollectionReady(false);
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
