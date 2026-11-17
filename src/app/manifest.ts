import type { MetadataRoute } from "next";

/** Installable app: "Add to Home Screen" opens V+G full screen. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "V+G",
    short_name: "V+G",
    description: "A private place for two people.",
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f2ebe0",
    theme_color: "#f2ebe0",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
