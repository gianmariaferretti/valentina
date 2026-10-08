import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "maplibre-gl/dist/maplibre-gl.css";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    default: "V&G — Year One",
    template: "%s · V&G",
  },
  description: "A private interactive archive for two people.",
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  referrer: "no-referrer",
  robots: {
    follow: false,
    googleBot: {
      follow: false,
      index: false,
      noimageindex: true,
      nosnippet: true,
    },
    index: false,
    noarchive: true,
    nocache: true,
    noimageindex: true,
    nosnippet: true,
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
    <html data-scroll-behavior="smooth" lang="en">
      <body className="paper-noise antialiased">{children}</body>
    </html>
  );
}
