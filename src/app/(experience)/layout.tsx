import type { ReactNode } from "react";

import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { hasValidAccessSession } from "@/lib/auth/session";

export default async function ExperienceLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const isAuthorized = await hasValidAccessSession();

  if (!isAuthorized) redirect("/access");

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
