"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { CountUp } from "@/components/ui/rolling-number";

import { collectKisses } from "../actions";
import { toastLines } from "../lib/rewards";

/** Other components ask for a check right after an action. */
export const KISS_CHECK_EVENT = "vg:kisses";

export function requestKissCheck() {
  window.dispatchEvent(new Event(KISS_CHECK_EVENT));
}

const INTERVAL_MS = 20_000;

/** The visible casino tab or menu item, where the kisses fly to. */
function target(): HTMLElement | null {
  for (const element of document.querySelectorAll<HTMLElement>(
    "[data-kiss-target]",
  )) {
    const box = element.getBoundingClientRect();
    if (box.width > 0 && box.height > 0) return element;
  }
  return null;
}

function fly(amount: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const to = target();
  if (!to) return;
  const end = to.getBoundingClientRect();
  const startX = window.innerWidth / 2;
  const startY = window.innerHeight - 110;
  const count = Math.min(8, 3 + Math.floor(amount / 20));
  for (let i = 0; i < count; i++) {
    const kiss = document.createElement("span");
    kiss.textContent = "💋";
    kiss.setAttribute("aria-hidden", "true");
    kiss.style.cssText =
      "position:fixed;left:0;top:0;z-index:120;font-size:1.4rem;pointer-events:none;will-change:transform,opacity";
    document.body.appendChild(kiss);
    const x0 = startX + (Math.random() - 0.5) * 120;
    const y0 = startY + (Math.random() - 0.5) * 30;
    const x1 = end.left + end.width / 2 - 10;
    const y1 = end.top + end.height / 2 - 12;
    const midX = (x0 + x1) / 2 + (Math.random() - 0.5) * 160;
    const midY = Math.min(y0, y1) - 60 - Math.random() * 80;
    kiss
      .animate(
        [
          { transform: `translate(${x0}px, ${y0}px) scale(0.6)`, opacity: 0 },
          {
            transform: `translate(${midX}px, ${midY}px) scale(1.15)`,
            opacity: 1,
            offset: 0.45,
          },
          { transform: `translate(${x1}px, ${y1}px) scale(0.5)`, opacity: 0.2 },
        ],
        {
          duration: 900 + i * 60,
          delay: i * 70,
          easing: "cubic-bezier(.45,0,.3,1)",
          fill: "both",
        },
      )
      .finished.then(
        () => kiss.remove(),
        () => kiss.remove(),
      );
  }
  window.setTimeout(
    () =>
      to.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.25)" },
          { transform: "scale(1)" },
        ],
        { duration: 380, easing: "ease-out" },
      ),
    900 + count * 70,
  );
}

/**
 * Collects the 💋 the site owes (paid server-side, once per event) and
 * announces them: a toast, and kisses flying to the casino tab.
 */
export function KissListener() {
  const pathname = usePathname();
  const router = useRouter();
  const busy = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (busy.current || document.visibilityState !== "visible") return;
      busy.current = true;
      try {
        const credits = await collectKisses();
        if (cancelled || credits.length === 0) return;
        for (const line of toastLines(credits)) {
          toast(line.title, {
            icon: "💋",
            description: (
              <>
                <CountUp prefix="+" value={line.amount} /> 💋 for the Kiss
                Casino
              </>
            ),
          });
          fly(line.amount);
        }
        router.refresh();
      } catch {
        // Offline or a deploy in progress: the next check catches up.
      } finally {
        busy.current = false;
      }
    };
    const first = window.setTimeout(check, 600);
    const timer = window.setInterval(check, INTERVAL_MS);
    const onVisible = () => void check();
    window.addEventListener(KISS_CHECK_EVENT, onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.clearTimeout(first);
      window.clearInterval(timer);
      window.removeEventListener(KISS_CHECK_EVENT, onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pathname, router]);

  return null;
}
