"use client";

import { Toaster as SonnerToaster } from "sonner";

/** One notification layer for the private site (sonner, MIT). */
export function Toaster() {
  return (
    <SonnerToaster
      closeButton={false}
      gap={10}
      offset={{ bottom: "calc(var(--tabbar, 0px) + 16px)" }}
      position="bottom-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-[min(25rem,calc(100vw-2rem))] items-start gap-3 rounded-[1.1rem] bg-[rgba(36,30,28,0.95)] px-4 py-3.5 text-[var(--paper-white)] shadow-[0_18px_40px_rgba(0,0,0,0.3)]",
          title: "text-sm leading-5",
          description: "mt-0.5 text-xs text-white/70",
          icon: "grid size-9 shrink-0 place-items-center rounded-[0.6rem] bg-[var(--rust)] text-lg",
        },
      }}
      visibleToasts={3}
    />
  );
}
