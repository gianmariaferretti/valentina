/** Retain unmigrated source files without exposing them on a new deployment.
 * This is a deny-only retirement rule, not the application's authentication layer.
 */
export function proxy() {
  return new Response(
    "Personal photographs are no longer served at this address.",
    {
      status: 410,
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    },
  );
}
export const config = { matcher: "/images/travel/:path*" };
