"use client";

import type {
  RoughAnnotation,
  RoughAnnotationConfig,
} from "rough-notation/lib/model";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { prefersReducedMotion } from "@/lib/effects/capabilities";

/**
 * Hand-drawn marks (rough-notation, MIT) around a piece of text: a circle,
 * an underline, a strike, a highlighter. The library loads only when a mark
 * is about to be drawn. Marks draw when they come into view; inside a
 * <MarkGroup> they draw one after another when the group does. With reduced
 * motion they are already drawn, without animation. rough-notation redraws
 * them by itself when the page resizes.
 */

export type MarkType = RoughAnnotationConfig["type"];

/** Our ink colours, matched to the paper theme. */
export const ink = {
  rust: "#b46258",
  wine: "#8c1c34",
  green: "#2f7d4f",
  highlighter: "rgba(242, 200, 75, 0.55)",
  ink: "#2b211d",
} as const;

const STEP_MS = 380;

const GroupContext = createContext<{ seen: boolean } | null>(null);

function useSeen(target: React.RefObject<HTMLElement | null>, skip: boolean) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (skip || seen) return;
    const host = target.current;
    if (!host) return;
    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      const timer = window.setTimeout(() => setSeen(true), 0);
      return () => window.clearTimeout(timer);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setSeen(true);
      },
      { threshold: 0.6 },
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [target, skip, seen]);
  return seen;
}

/** Marks inside draw in order (`order` prop) once the group is in view. */
export function MarkGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useSeen(ref, false);
  return (
    <GroupContext.Provider value={{ seen }}>
      <div className={className} ref={ref}>
        {children}
      </div>
    </GroupContext.Provider>
  );
}

export interface MarkProps {
  type: MarkType;
  children: ReactNode;
  /** Switch the mark on and off (a ticked item gets its strike). */
  active?: boolean;
  /** Position in its group: 0 draws first. */
  order?: number;
  color?: string;
  strokeWidth?: number;
  padding?: RoughAnnotationConfig["padding"];
  iterations?: number;
  multiline?: boolean;
  /** Draw without the pen animation (e.g. after a tap). */
  instant?: boolean;
  animationDuration?: number;
  className?: string;
  /** "div" when the mark wraps a block (a whole coupon ticket). */
  as?: "span" | "div";
}

export function Mark({
  type,
  children,
  active = true,
  order = 0,
  color = ink.rust,
  strokeWidth = 2,
  padding,
  iterations = 2,
  multiline = false,
  instant = false,
  animationDuration = 700,
  className,
  as: Tag = "span",
}: MarkProps) {
  const ref = useRef<HTMLElement>(null);
  const group = useContext(GroupContext);
  const selfSeen = useSeen(ref, group !== null);
  const seen = group ? group.seen : selfSeen;
  // Arrays are new on every render: compare the padding by value.
  const paddingKey = JSON.stringify(padding ?? null);

  useEffect(() => {
    const host = ref.current;
    if (!seen || !active || !host) return;
    let annotation: RoughAnnotation | null = null;
    let cancelled = false;
    const still = prefersReducedMotion();
    const timer = window.setTimeout(
      () => {
        void import("rough-notation").then(({ annotate }) => {
          if (cancelled || !host.isConnected) return;
          annotation = annotate(host, {
            type,
            color,
            strokeWidth,
            padding: JSON.parse(paddingKey) ?? undefined,
            iterations,
            multiline,
            animate: !still && !instant,
            animationDuration,
          });
          annotation.show();
        });
      },
      still || instant ? 0 : order * STEP_MS,
    );
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      annotation?.remove();
    };
  }, [
    seen,
    active,
    type,
    color,
    strokeWidth,
    paddingKey,
    iterations,
    multiline,
    instant,
    animationDuration,
    order,
  ]);

  return (
    <Tag
      className={className}
      ref={ref as React.RefObject<HTMLSpanElement & HTMLDivElement>}
    >
      {children}
    </Tag>
  );
}
