"use client";

import { Share, X } from "lucide-react";
import { useEffect, useState } from "react";

const SEEN_KEY = "vg.ios-install-banner";

function isIos() {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isInstalled() {
  return (
    (navigator as Navigator & { standalone?: boolean }).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

/**
 * On iPhone, once: how to add V+G to the Home Screen (Safari has no install
 * prompt). Never shown again after "Got it", nor inside the installed app.
 */
export function IosInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let seen = false;
    try {
      seen = window.localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = true; // No storage: better never than every time.
    }
    if (seen || !isIos() || isInstalled()) return;
    const timer = window.setTimeout(() => setShow(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Fine: it simply won't be remembered.
    }
  };

  return (
    <aside
      aria-labelledby="ios-install-title"
      className="fixed inset-x-3 bottom-[calc(var(--tabbar,0px)+0.75rem)] z-[65] mx-auto max-w-md rounded-[1.4rem] bg-[var(--ink)] p-4 text-[var(--paper-white)] shadow-[0_18px_40px_rgba(0,0,0,0.3)]"
    >
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="size-12 shrink-0 rounded-xl"
          height={48}
          src="/icons/icon-192.png"
          width={48}
        />
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold" id="ios-install-title">
            Put V+G on your Home Screen
          </h2>
          <p className="mt-1 text-sm leading-5 text-white/75">
            Tap{" "}
            <Share
              aria-label="Share"
              className="inline -translate-y-0.5"
              size={15}
            />{" "}
            in Safari, then <strong>Add to Home Screen</strong>. It opens like
            an app, full screen, no browser bars.
          </p>
        </div>
        <button
          aria-label="Close"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10"
          onClick={dismiss}
          type="button"
        >
          <X aria-hidden="true" size={16} />
        </button>
      </div>
      <button
        className="mt-3 min-h-11 w-full rounded-full bg-[var(--paper-white)] text-sm font-semibold text-[var(--ink)]"
        onClick={dismiss}
        type="button"
      >
        Got it
      </button>
    </aside>
  );
}
