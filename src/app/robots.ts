import type { MetadataRoute } from "next";

/** Audit A13: a private site. Nothing to index, anywhere. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
