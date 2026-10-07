import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "maplibre-gl/dist/maplibre-gl.css";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "V&G — Year One",
    template: "%s · V&G",
  },
  description:
    "A private interactive archive of Valentina and Gianmaria’s first year.",
  robots: {
    follow: false,
    index: false,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#f2ebe0",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="paper-noise antialiased">{children}</body>
    </html>
  );
}
