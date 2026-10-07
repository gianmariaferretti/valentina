import type { ReactNode } from "react";

import { cn } from "@/lib/cn";
import type { PaperTexture, PaperTone } from "@/types/design-system";

interface PaperCardProps {
  children: ReactNode;
  className?: string;
  tone?: PaperTone;
  texture?: PaperTexture;
  elevated?: boolean;
  element?: "article" | "div" | "section";
}

export function PaperCard({
  children,
  className,
  tone = "white",
  texture = "plain",
  elevated = false,
  element = "article",
}: PaperCardProps) {
  const Component = element;

  return (
    <Component
      className={cn(
        "paper-card",
        elevated && "paper-card--elevated",
        className,
      )}
      data-texture={texture}
      data-tone={tone}
    >
      {children}
    </Component>
  );
}
