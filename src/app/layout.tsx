import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "maplibre-gl/dist/maplibre-gl.css";
import "@/app/globals.css";

import { Pwa } from "@/features/pwa/components/pwa";

export const metadata: Metadata = {
  title: {
    default: "V&G — Year One",
    template: "%s · V&G",
  },
  description: "A private interactive archive for two people.",
  applicationName: "V+G",
  // Installed on an iPhone: full screen, named V+G.
  appleWebApp: { capable: true, title: "V+G", statusBarStyle: "default" },
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
  // Lets the phone tab bar sit above the iPhone home indicator.
  viewportFit: "cover",
  themeColor: "#f2ebe0",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html data-scroll-behavior="smooth" lang="en">
      <body className="paper-noise antialiased">
        <Pwa>{children}</Pwa>
      </body>
    </html>
  );
}
