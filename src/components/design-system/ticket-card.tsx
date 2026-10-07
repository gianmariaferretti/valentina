import { ArrowUpRight, Ticket } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Sticker } from "@/components/design-system/sticker";
import { cn } from "@/lib/cn";
import type { StickerVariant } from "@/types/design-system";

interface TicketCardProps {
  code: string;
  title: string;
  description: string;
  eyebrow?: string;
  href?: string;
  status?: string;
  statusVariant?: StickerVariant;
  tone?: "paper" | "burgundy" | "ink";
  footer?: ReactNode;
  className?: string;
}

export function TicketCard({
  code,
  title,
  description,
  eyebrow = "Admit one",
  href,
  status,
  statusVariant = "text",
  tone = "paper",
  footer,
  className,
}: TicketCardProps) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ticket-card__code">{code}</p>
          <p className="ticket-card__eyebrow">{eyebrow}</p>
        </div>
        {href ? (
          <ArrowUpRight
            aria-hidden="true"
            className="ticket-card__arrow"
            size={19}
          />
        ) : (
          <Ticket aria-hidden="true" size={19} />
        )}
      </div>
      <div className="my-auto py-10">
        <h3 className="font-display text-4xl leading-[0.95] tracking-[-0.04em] sm:text-5xl">
          {title}
        </h3>
        <p className="ticket-card__description">{description}</p>
      </div>
      <div className="ticket-card__footer">
        {footer ?? <span>Valid only for the intended recipient</span>}
        {status ? (
          <Sticker
            rotation={-3}
            size="sm"
            text={status}
            variant={statusVariant}
          />
        ) : null}
      </div>
    </>
  );

  const rootClassName = cn("ticket-card group", className);

  return href ? (
    <Link className={rootClassName} data-tone={tone} href={href}>
      {content}
    </Link>
  ) : (
    <article className={rootClassName} data-tone={tone}>
      {content}
    </article>
  );
}
