import type { CSSProperties, ReactNode } from "react";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  /** Seconds, as before. */
  delay?: number;
}

/**
 * A short entrance (CSS only, see `.fade-in` in globals.css). It needs no
 * JavaScript, so the content shows as soon as the HTML arrives instead of
 * after hydration, and the `motion` library is not loaded just for this.
 * Switched off with reduced motion.
 */
export function FadeIn({ children, className, delay = 0 }: FadeInProps) {
  return (
    <div
      className={className ? `fade-in ${className}` : "fade-in"}
      style={
        delay ? ({ "--fade-delay": `${delay}s` } as CSSProperties) : undefined
      }
    >
      {children}
    </div>
  );
}
