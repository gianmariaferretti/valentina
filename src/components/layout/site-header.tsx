"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { primaryNavigation, secondaryNavigation } from "@/data/navigation";
import { cn } from "@/lib/cn";

function isCurrentPath(pathname: string, href: string) {
  return (
    pathname === href || (href !== "/home" && pathname.startsWith(`${href}/`))
  );
}

export function SiteHeader({ progress }: { progress: ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color:rgba(242,235,224,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-[92rem] items-center gap-8 px-5 sm:px-8">
        <Link
          aria-label="V and G home"
          className="font-display text-2xl tracking-[-0.04em]"
          href="/home"
        >
          V<span className="text-[var(--rust)]">&</span>G
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
          {primaryNavigation.map((item) => (
            <Link
              className={cn(
                "rounded-full px-3.5 py-2 text-xs font-medium tracking-[0.04em] transition",
                isCurrentPath(pathname, item.href)
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--muted)] hover:bg-white/45 hover:text-[var(--ink)]",
              )}
              href={item.href}
              key={item.href}
            >
              {item.shortTitle}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <span className="text-[0.6rem] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
            Private archive · 01
          </span>
          <Link
            aria-label="Open secret section"
            className="grid size-10 place-items-center rounded-full border border-[var(--line-strong)] transition hover:bg-white/50"
            href="/secret"
          >
            <Icon name="secret" size={16} />
          </Link>
        </div>

        <button
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          className="ml-auto grid size-11 place-items-center rounded-full border border-[var(--line-strong)] lg:hidden"
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          {isOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {progress}

      {isOpen ? (
        <nav className="absolute inset-x-0 top-full max-h-[calc(100svh-7.25rem)] overflow-y-auto border-b border-[var(--line)] bg-[var(--paper)] px-5 py-6 shadow-2xl shadow-black/10 lg:hidden">
          <p className="mb-3 text-[0.6rem] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
            The essentials
          </p>
          <div className="grid gap-1">
            {primaryNavigation.map((item) => (
              <MobileLink
                href={item.href}
                item={item}
                key={item.href}
                onNavigate={() => setIsOpen(false)}
              />
            ))}
          </div>
          <p className="mt-7 mb-3 text-[0.6rem] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
            More questionable decisions
          </p>
          <div className="grid gap-1 sm:grid-cols-2">
            {secondaryNavigation.map((item) => (
              <MobileLink
                href={item.href}
                item={item}
                key={item.href}
                onNavigate={() => setIsOpen(false)}
              />
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function MobileLink({
  href,
  item,
  onNavigate,
}: {
  href: string;
  item:
    (typeof primaryNavigation)[number] | (typeof secondaryNavigation)[number];
  onNavigate: () => void;
}) {
  return (
    <Link
      className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/60"
      href={href}
      onClick={onNavigate}
    >
      <span className="grid size-9 place-items-center rounded-full border border-[var(--line)]">
        <Icon name={item.icon} size={16} />
      </span>
      <span>
        <span className="block text-sm font-semibold">{item.shortTitle}</span>
        <span className="block text-xs text-[var(--muted)]">
          {item.description}
        </span>
      </span>
    </Link>
  );
}
