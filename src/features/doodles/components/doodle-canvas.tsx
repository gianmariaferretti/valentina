"use client";

import "@excalidraw/excalidraw/index.css";

import {
  Excalidraw,
  exportToBlob,
  FONT_FAMILY,
  MainMenu,
  serializeAsJSON,
} from "@excalidraw/excalidraw";
import type {
  AppState,
  BinaryFiles,
  ExcalidrawImperativeAPI,
} from "@excalidraw/excalidraw/types";
import { useState } from "react";

import styles from "./doodles.module.css";

/** Paper and ink: the site's colours as Excalidraw's starting state. */
const paper: Partial<AppState> = {
  viewBackgroundColor: "#fbf8f3",
  currentItemStrokeColor: "#8c1c34",
  currentItemRoughness: 1,
  currentItemStrokeWidth: 2,
  // Virgil: hand-drawn and self-hosted (Excalifont is not, see
  // scripts/sync-excalidraw-assets.mjs).
  currentItemFontFamily: FONT_FAMILY.Virgil,
};

export interface SendResult {
  ok: boolean;
  message?: string;
  kisses?: number;
}

/**
 * The Excalidraw board (MIT). Only this file imports Excalidraw, and it is
 * loaded with next/dynamic (ssr: false) on /doodles and in the panel only.
 * Fonts come from /excalidraw/ on this site (EXCALIDRAW_ASSET_PATH is set
 * before the import), never from a CDN.
 */
export default function DoodleCanvas({
  uploadUrl,
  replyTo,
  sendLabel,
  onSent,
  onClose,
}: {
  uploadUrl: string;
  replyTo: string | null;
  sendLabel: string;
  onSent: (result: SendResult) => void;
  onClose: () => void;
}) {
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    if (!api || sending) return;
    const elements = api.getSceneElements();
    if (elements.length === 0) {
      setError("Draw something first.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const appState = api.getAppState();
      const files: BinaryFiles = {};
      const scene = serializeAsJSON(elements, appState, files, "local");
      const preview = await exportToBlob({
        elements,
        appState: { ...appState, exportBackground: true },
        files,
        mimeType: "image/png",
        maxWidthOrHeight: 1200,
        exportPadding: 24,
      });
      const form = new FormData();
      form.set("scene", scene);
      form.set("preview", preview, "doodle.png");
      if (replyTo) form.set("replyTo", replyTo);
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: form,
        credentials: "same-origin",
      });
      const result = (await response.json().catch(() => ({
        ok: false,
        message: "Couldn't send it. Try again?",
      }))) as SendResult;
      if (!result.ok) {
        setError(result.message ?? "Couldn't send it. Try again?");
        return;
      }
      onSent(result);
    } catch {
      setError("Couldn't send it. Try again?");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.frame}>
      {/* Our own bar above the board: on a phone Excalidraw's toolbar takes
          the whole top row. */}
      <div className={styles.bar}>
        <button className={styles.close} onClick={onClose} type="button">
          Close
        </button>
        <span className={styles.barTitle}>✏️ Doodle</span>
        <button
          className={styles.send}
          disabled={sending}
          onClick={send}
          type="button"
        >
          {sending ? "Sending…" : sendLabel}
        </button>
      </div>
      <div className={styles.board}>
        <Excalidraw
          excalidrawAPI={setApi}
          initialData={{ appState: paper }}
          theme="light"
          UIOptions={{
            canvasActions: {
              changeViewBackgroundColor: false,
              export: false,
              loadScene: false,
              saveAsImage: false,
              saveToActiveFile: false,
              toggleTheme: false,
            },
            tools: { image: false },
          }}
        >
          <MainMenu>
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.DefaultItems.Help />
          </MainMenu>
        </Excalidraw>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
