import { Heart, Orbit, Sparkles, Star } from "lucide-react";
import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

type NoteStyle = CSSProperties & { "--note-rotation": string };

interface HandwrittenNoteProps {
  children: string;
  rotation?: number;
  tone?: "ink" | "burgundy" | "blue" | "paper";
  className?: string;
}

export function HandwrittenNote({
  children,
  rotation = -3,
  tone = "burgundy",
  className,
}: HandwrittenNoteProps) {
  const style: NoteStyle = { "--note-rotation": `${rotation}deg` };

  return (
    <span
      className={cn("handwritten-note", className)}
      data-tone={tone}
      style={style}
    >
      {children}
    </span>
  );
}

interface DoodleArrowProps {
  direction?: "right" | "left" | "down";
  label?: string;
  tone?: "burgundy" | "ink" | "sand";
  className?: string;
}

export function DoodleArrow({
  direction = "right",
  label,
  tone = "burgundy",
  className,
}: DoodleArrowProps) {
  return (
    <span
      className={cn("doodle-arrow", className)}
      data-direction={direction}
      data-tone={tone}
    >
      {label ? <span>{label}</span> : null}
      <svg aria-hidden="true" viewBox="0 0 128 54">
        <path d="M4 35c24-23 56-26 93-11" />
        <path d="m89 8 20 21-27 8" />
      </svg>
    </span>
  );
}

type DoodleVariant = "star" | "heart" | "spark" | "orbit";

const doodles = {
  star: Star,
  heart: Heart,
  spark: Sparkles,
  orbit: Orbit,
} as const;

interface DoodleProps {
  variant?: DoodleVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Doodle({
  variant = "spark",
  size = "md",
  className,
}: DoodleProps) {
  const Icon = doodles[variant];
  const pixelSize = size === "sm" ? 18 : size === "lg" ? 38 : 26;

  return (
    <span className={cn("doodle", className)} data-variant={variant}>
      <Icon aria-hidden="true" size={pixelSize} strokeWidth={1.35} />
    </span>
  );
}

interface SectionLabelProps {
  index?: string;
  children: string;
  className?: string;
  inverse?: boolean;
}

export function SectionLabel({
  index,
  children,
  className,
  inverse = false,
}: SectionLabelProps) {
  return (
    <div
      className={cn(
        "section-label",
        inverse && "section-label--inverse",
        className,
      )}
    >
      {index ? <span>{index}</span> : null}
      <p>{children}</p>
      <i aria-hidden="true" />
    </div>
  );
}
