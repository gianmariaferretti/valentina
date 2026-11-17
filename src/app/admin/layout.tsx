import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/toaster";
import { adminLogout } from "@/features/admin/actions/auth";
import { readAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = {
  title: { default: "Scrivania", template: "%s · Scrivania" },
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = { themeColor: "#241e1c" };

export default async function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await readAdminSession();
  return (
    <div className="min-h-svh bg-[var(--paper)]" lang="it">
      {session ? (
        <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--ink)] text-[var(--paper-white)]">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
            <Link className="font-display text-xl" href="/admin">
              V&amp;G · Scrivania
            </Link>
            <form action={adminLogout}>
              <button
                className="min-h-11 rounded-full px-3 text-sm text-white/80 hover:text-white"
                type="submit"
              >
                Esci
              </button>
            </form>
          </div>
        </header>
      ) : null}
      <main className="mx-auto max-w-6xl px-4 pt-5 pb-16">{children}</main>
      <Toaster />
    </div>
  );
}
