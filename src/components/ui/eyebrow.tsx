import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
}

export function Eyebrow({ children, className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "text-[0.65rem] font-semibold tracking-[0.2em] text-[var(--muted)] uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}
