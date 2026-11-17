import { NextResponse, type NextRequest } from "next/server.js";

import { getRevokedBefore } from "./lib/auth/revocation.ts";
import {
  ACCESS_COOKIE,
  ADMIN_COOKIE,
  accessCookieOptions,
  adminCookieOptions,
  createAccessToken,
  createAdminToken,
  parseAccessToken,
  parseAdminToken,
  shouldRenew,
  shouldRenewAdmin,
} from "./lib/auth/token.ts";

/**
 * First line of defence: every route needs Valentina's session except the
 * cover, the entrance, static/PWA files and the pages that have their own
 * check (the admin panel, signed email-action links, the cron job with
 * CRON_SECRET). Pages and data loaders
 * check again on the server (src/lib/auth/session.ts): this check is
 * optimistic, never the only one.
 */

const PUBLIC_PATHS = new Set(["/", "/access", "/robots.txt", "/offline"]);
const PUBLIC_PREFIXES = ["/admin", "/action", "/api/cron"];

const noStore = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
};

export function isPublicPath(pathname: string): boolean {
  return (
    PUBLIC_PATHS.has(pathname) ||
    PUBLIC_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
    )
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retired: personal photographs used to live here.
  if (pathname.startsWith("/images/travel/"))
    return new Response(
      "Personal photographs are no longer served at this address.",
      { status: 410, headers: noStore },
    );

  // Design reference: development only.
  if (
    process.env.NODE_ENV === "production" &&
    (pathname === "/design-system" || pathname.startsWith("/design-system/"))
  )
    return new Response("Not found", { status: 404, headers: noStore });

  // The control panel checks its own session on every page and action;
  // here it only gets its daily renewal.
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    const admin = parseAdminToken(request.cookies.get(ADMIN_COOKIE)?.value);
    if (admin && shouldRenewAdmin(admin))
      response.cookies.set(
        ADMIN_COOKIE,
        createAdminToken(admin.issuedAt),
        adminCookieOptions(),
      );
    return response;
  }

  if (isPublicPath(pathname)) return NextResponse.next();

  const session = parseAccessToken(request.cookies.get(ACCESS_COOKIE)?.value);
  const valid =
    session !== null && session.issuedAt >= (await getRevokedBefore("visitor"));

  if (!valid) {
    if (pathname.startsWith("/api/"))
      return Response.json(
        { error: "Private session required." },
        { status: 401, headers: noStore },
      );
    // Redirect with no body: an RSC request gets nothing of the page.
    const response = NextResponse.redirect(new URL("/access", request.url));
    for (const [key, value] of Object.entries(noStore))
      response.headers.set(key, value);
    return response;
  }

  const response = NextResponse.next();
  if (shouldRenew(session)) {
    // Keep using the site, stay logged in: a fresh 30 days, same login time.
    response.cookies.set(
      ACCESS_COOKIE,
      createAccessToken(session.issuedAt),
      accessCookieOptions(),
    );
  }
  return response;
}

export const config = {
  matcher: [
    // Everything except Next's static files and public files with an
    // extension (icons, images, fonts, manifest, sounds).
    "/((?!_next/static|_next/image|.*\\.[a-zA-Z0-9]{2,8}$).*)",
    "/images/travel/:path*",
  ],
};
