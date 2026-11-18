"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { requestKissCheck } from "@/features/kisses/components/kiss-listener";

import type { SendResult } from "./doodle-canvas";
import styles from "./doodles.module.css";

declare global {
  interface Window {
    EXCALIDRAW_ASSET_PATH?: string | string[];
  }
}

function loadCanvas() {
  // Fonts from this site only (copied by scripts/sync-excalidraw-assets.mjs).
  window.EXCALIDRAW_ASSET_PATH = "/excalidraw/";
  return import("./doodle-canvas");
}

const DoodleCanvas = dynamic(loadCanvas, {
  ssr: false,
  loading: () => (
    <div aria-busy="true" className={styles.skeleton} role="status">
      <span>Sharpening the pencils…</span>
    </div>
  ),
});

/**
 * "New doodle" (or "Draw back"): opens the Excalidraw board full screen.
 * Excalidraw itself loads only when the board opens (or when the finger
 * touches the button), never with the page.
 */
export function DoodleStudio({
  label,
  uploadUrl,
  sendLabel,
  replyTo = null,
  className,
}: {
  label: string;
  uploadUrl: string;
  sendLabel: string;
  replyTo?: string | null;
  className?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sent = (result: SendResult) => {
    setOpen(false);
    toast(sendLabel.includes("Gianmaria") ? "Sent! 🎨" : "Inviato! 🎨");
    // The first doodle pays 💋: the listener shows its own toast.
    if (result.kisses) requestKissCheck();
    router.refresh();
  };

  return (
    <>
      <button
        className={className}
        onClick={() => setOpen(true)}
        onPointerEnter={() => void loadCanvas()}
        onTouchStart={() => void loadCanvas()}
        type="button"
      >
        {label}
      </button>
      {open ? (
        <div
          aria-label="Drawing board"
          aria-modal="true"
          className={styles.overlay}
          role="dialog"
        >
          <DoodleCanvas
            onClose={() => setOpen(false)}
            onSent={sent}
            replyTo={replyTo}
            sendLabel={sendLabel}
            uploadUrl={uploadUrl}
          />
        </div>
      ) : null}
    </>
  );
}
