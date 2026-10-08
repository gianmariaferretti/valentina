import Link from "next/link";
import type { CSSProperties, MouseEventHandler } from "react";

import type { OpenWhenLetter } from "@/features/open-when/types";
import { cn } from "@/lib/cn";

type EnvelopeStyle = CSSProperties & { "--envelope-rotation": string };

interface EnvelopeProps {
  readonly letter: OpenWhenLetter;
  readonly index: number;
  readonly opened: boolean;
  readonly href?: string;
  readonly onOpen?: MouseEventHandler<HTMLButtonElement>;
  readonly disabled?: boolean;
  readonly mode?: "collection" | "detail";
  readonly className?: string;
}

function EnvelopeFace({
  letter,
  index,
  opened,
  mode,
}: Pick<EnvelopeProps, "letter" | "index" | "opened" | "mode">) {
  return (
    <span
      className="envelope"
      data-mark={letter.envelope.mark}
      data-mode={mode}
      data-opened={opened}
      data-tone={letter.envelope.tone}
    >
      <span aria-hidden="true" className="envelope__back" />
      <span aria-hidden="true" className="envelope__paper-peek" />
      <span aria-hidden="true" className="envelope__flap" />
      <span
        aria-hidden="true"
        className="envelope__fold envelope__fold--left"
      />
      <span
        aria-hidden="true"
        className="envelope__fold envelope__fold--right"
      />

      <span className="envelope__address">
        <span>Open when</span>
        <strong>{letter.title}</strong>
      </span>

      <span className="envelope__number">
        V+G / {String(index + 1).padStart(2, "0")}
      </span>
      <span aria-hidden="true" className="envelope__stamp">
        <small>YEAR</small>
        <strong>ONE</strong>
        <i>31·10</i>
      </span>
      <span aria-hidden="true" className="envelope__postmark" />
      <span aria-hidden="true" className="envelope__seal">
        VG
      </span>
      <span className="envelope__status">
        {opened ? "Opened" : mode === "detail" ? "Tap to open" : "Sealed"}
      </span>
    </span>
  );
}

export function Envelope({
  letter,
  index,
  opened,
  href,
  onOpen,
  disabled = false,
  mode = "collection",
  className,
}: EnvelopeProps) {
  const style: EnvelopeStyle = {
    "--envelope-rotation": `${mode === "detail" ? 0 : letter.envelope.rotation}deg`,
  };
  const sharedClassName = cn("envelope-action", className);
  const face = (
    <EnvelopeFace index={index} letter={letter} mode={mode} opened={opened} />
  );

  if (href) {
    return (
      <Link
        aria-label={`${opened ? "Reopen" : "Open"} when ${letter.title.toLowerCase()}`}
        className={sharedClassName}
        href={href}
        style={style}
      >
        {face}
      </Link>
    );
  }

  return (
    <button
      aria-label={`Open envelope: ${letter.title}`}
      className={sharedClassName}
      disabled={disabled}
      onClick={onOpen}
      style={style}
      type="button"
    >
      {face}
    </button>
  );
}
