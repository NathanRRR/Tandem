import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";

// Auto-hébergées (plutôt que next/font/google) pour ne pas dépendre du réseau au build —
// un fichier variable par famille couvre les poids 500-700 (Lora) / 400-800 (Manrope).
const lora = localFont({
  variable: "--font-lora",
  src: [{ path: "./fonts/lora-latin-variable.woff2", weight: "500 700", style: "normal" }],
});

const manrope = localFont({
  variable: "--font-manrope",
  src: [{ path: "./fonts/manrope-latin-variable.woff2", weight: "400 800", style: "normal" }],
});

export const metadata: Metadata = {
  title: "Tandem",
  description: "Le budget à deux, sans calculs qui grincent.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tandem",
  },
};

export const viewport: Viewport = {
  themeColor: "#f6f1ea",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="fr"
      className={`${lora.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink font-sans">
        {children}
      </body>
    </html>
  );
}
