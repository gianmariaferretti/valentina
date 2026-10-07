import type { ReactNode } from "react";

import { Icon } from "@/components/ui/icon";
import { PageIntro } from "@/components/ui/page-intro";
import type { IconName } from "@/types/navigation";

interface RouteScaffoldProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: IconName;
  note: string;
  children?: ReactNode;
}

export function RouteScaffold({
  eyebrow,
  title,
  description,
  icon,
  note,
  children,
}: RouteScaffoldProps) {
  return (
    <div className="page-container py-10 sm:py-14 lg:py-20">
      <PageIntro description={description} eyebrow={eyebrow} title={title} />
      {children ?? (
        <section className="mt-8 grid min-h-80 place-items-center rounded-[2rem] border border-dashed border-[var(--line-strong)] bg-white/25 p-8 text-center sm:mt-12">
          <div className="max-w-md">
            <span className="mx-auto grid size-14 place-items-center rounded-full border border-[var(--line)] bg-[var(--paper)]">
              <Icon name={icon} size={22} />
            </span>
            <h2 className="mt-6 font-display text-3xl tracking-[-0.025em]">
              Foundation ready.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{note}</p>
          </div>
        </section>
      )}
    </div>
  );
}
