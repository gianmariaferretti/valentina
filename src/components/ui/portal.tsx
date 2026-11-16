"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

const subscribe = () => () => {};

/**
 * Renders full-screen layers (dialogs, toasts, celebrations) directly in
 * <body>, so no transformed or animated ancestor can resize or clip them.
 */
export function Portal({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return mounted ? createPortal(children, document.body) : null;
}
