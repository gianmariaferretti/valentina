"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import styles from "./access-ad-chaos.module.css";

type Advertisement = {
  id: number;
  x: number;
  y: number;
  rotation: number;
  campaign: number;
  closeTrick: "honest" | "trap" | "dodges";
};

const CAMPAIGNS = [
  {
    headline: "YOU WON AN IPHONE!",
    copy: "A cardboard one. Assembly and emotional support sold separately.",
    offer: "100% POSSIBLY FREE",
    action: "CLAIM MY PHONE",
    theme: "sunshine",
  },
  {
    headline: "HOT SINGLES IN YOUR AREA!",
    copy: "It's just Gianmaria, standing too close to the radiator.",
    offer: "LOCAL LEGEND",
    action: "MEET THIS SINGLE",
    theme: "pink",
  },
  {
    headline: "CLAIM YOUR FREE VACATION!",
    copy: "Includes an imaginary upgrade and one real argument about packing.",
    offer: "€0* (*IN YOUR DREAMS)",
    action: "BOOK THE CHAOS",
    theme: "aqua",
  },
  {
    headline: "YOUR BOYFRIEND HATES THIS ONE TRICK!",
    copy: "Ask where he wants to eat. Watch the entire day disappear.",
    offer: "SECRET METHOD",
    action: "REVEAL THE TRICK",
    theme: "orange",
  },
  {
    headline: "URGENT: YOU'VE BEEN SELECTED!",
    copy: "By the International Committee of Absolutely Nobody.",
    offer: "LIMITED NON-OFFER",
    action: "ACCEPT MY DESTINY",
    theme: "violet",
  },
  {
    headline: "BUY ONE APOLOGY, GET TWO FREE!",
    copy: "Terms and conditions may be revised after dinner.",
    offer: "300% MORE SORRY",
    action: "APOLOGIZE NOW",
    theme: "lime",
  },
  {
    headline: "CONGRATULATIONS, VALENTINA!",
    copy: "You are our 1,000,000th visitor. We have had one visitor.",
    offer: "EXCLUSIVE WINNER",
    action: "COLLECT NOTHING",
    theme: "red",
  },
] as const;

const MAX_VISIBLE_ADS = 48;
const CARD_WIDTH = 256;
const CARD_HEIGHT = 264;

function randomInteger(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeAdvertisement(id: number): Advertisement {
  // Cycling through the viewport makes the takeover reliable on narrow screens.
  const column = id % 4;
  const row = Math.floor(id / 4) % 4;

  return {
    id,
    x: Math.min(1, Math.max(0, (column + Math.random() * 0.8) / 4)),
    y: Math.min(1, Math.max(0, (row + Math.random() * 0.8) / 4)),
    rotation: randomInteger(-7, 7),
    campaign: id % CAMPAIGNS.length,
    closeTrick: id % 5 === 0 ? "dodges" : id % 3 === 0 ? "trap" : "honest",
  };
}

export function AccessAdChaos({ children }: { children: ReactNode }) {
  const [bypassed, setBypassed] = useState(false);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [viewport, setViewport] = useState({ width: 320, height: 640 });
  const nextId = useRef(0);
  const touchSequence = useRef({ count: 0, lastAt: 0 });
  const contentRef = useRef<HTMLDivElement>(null);

  const addAdvertisements = useCallback(
    (count: number, dismissedId?: number) => {
      const arrivals = Array.from({ length: count }, () =>
        makeAdvertisement(nextId.current++),
      );

      setAds((current) => {
        const remaining =
          dismissedId === undefined
            ? current
            : current.filter(
                (advertisement) => advertisement.id !== dismissedId,
              );

        return [...remaining, ...arrivals].slice(-MAX_VISIBLE_ADS);
      });
    },
    [],
  );

  useEffect(() => {
    if (bypassed) {
      const frame = window.requestAnimationFrame(() => {
        contentRef.current
          ?.querySelector<HTMLInputElement>("#access-code")
          ?.focus();
      });

      return () => window.cancelAnimationFrame(frame);
    }

    function updateViewport() {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    }

    function handleShortcut(event: KeyboardEvent) {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setBypassed(true);
        setAds([]);
      }
    }

    let timer: number | undefined;
    let active = true;

    function scheduleNextAd() {
      timer = window.setTimeout(
        () => {
          if (!active) return;
          addAdvertisements(1);
          scheduleNextAd();
        },
        randomInteger(300, 700),
      );
    }

    updateViewport();
    addAdvertisements(7);
    scheduleNextAd();
    window.addEventListener("resize", updateViewport);
    window.addEventListener("keydown", handleShortcut);

    return () => {
      active = false;
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("keydown", handleShortcut);
    };
  }, [addAdvertisements, bypassed]);

  function handleClose(advertisement: Advertisement) {
    if (advertisement.closeTrick === "trap") {
      addAdvertisements(3);
      return;
    }

    addAdvertisements(randomInteger(2, 3), advertisement.id);
  }

  function handleMobileBypass() {
    const now = Date.now();
    const previous = touchSequence.current;
    const count = now - previous.lastAt < 1800 ? previous.count + 1 : 1;
    touchSequence.current = { count, lastAt: now };

    if (count >= 5) {
      setBypassed(true);
      setAds([]);
    }
  }

  return (
    <>
      <div aria-hidden={!bypassed} inert={!bypassed} ref={contentRef}>
        {children}
      </div>

      {!bypassed ? (
        <div
          aria-label="Fictional advertising interruption"
          className={styles.takeover}
          role="dialog"
          aria-modal="true"
        >
          <div aria-hidden="true" className={styles.wallpaper}>
            <span>
              WELCOME TO THE INTERNET · PLEASE PANIC · WELCOME TO THE INTERNET ·
              PLEASE PANIC
            </span>
          </div>

          {ads.map((advertisement) => {
            const campaign = CAMPAIGNS[advertisement.campaign];
            const left = Math.round(
              advertisement.x * Math.max(0, viewport.width - CARD_WIDTH),
            );
            const top = Math.round(
              advertisement.y * Math.max(0, viewport.height - CARD_HEIGHT),
            );

            return (
              <article
                className={`${styles.popup} ${styles[campaign.theme]}`}
                key={advertisement.id}
                style={{
                  left,
                  top,
                  transform: `rotate(${advertisement.rotation}deg)`,
                  zIndex: advertisement.id + 1,
                }}
              >
                <div className={styles.titleBar}>
                  <span>V&G AD NETWORK™</span>
                  <button
                    aria-label={`Close ad: ${campaign.headline}. This may create more ads.`}
                    className={`${styles.close} ${advertisement.closeTrick === "dodges" ? styles.dodges : ""}`}
                    onClick={() => handleClose(advertisement)}
                    type="button"
                  >
                    ×
                  </button>
                </div>
                <div className={styles.body}>
                  <p className={styles.offer}>{campaign.offer}</p>
                  <h2 className={styles.headline}>{campaign.headline}</h2>
                  <p className={styles.copy}>{campaign.copy}</p>
                  <button
                    className={styles.action}
                    onClick={() => addAdvertisements(2)}
                    type="button"
                  >
                    {campaign.action} ↗
                  </button>
                </div>
              </article>
            );
          })}

          <button
            aria-label="Tap five times to stop the advertisements"
            className={styles.mobileEscape}
            onClick={handleMobileBypass}
            type="button"
          >
            V+G
          </button>
        </div>
      ) : null}
    </>
  );
}
