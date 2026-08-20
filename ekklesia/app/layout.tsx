import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";

import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ekklesia Connect — Pequenos começos. Grandes frutos.",
  description:
    "Conteúdo que transforma vidas e gera crescimento real. Uma jornada de fé e conhecimento.",
};

export const viewport: Viewport = {
  themeColor: "#ECDACB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${inter.variable}`}>
      <head>
        {/*
          The narrative beats are revealed by JavaScript writing opacity. With
          scripting off nothing would ever reveal them, so hand the page back as
          static, readable content instead of a blank cream screen.
        */}
        <noscript>
          <style>{`
            .beat, .hero__line, .hero__kicker, .hero__lede, .hero__actions, .hero__descender, .contemplation__lead, .contemplation__note { opacity: 1 !important; visibility: visible !important; transform: none !important; }
            .hero__mask { overflow: visible; }
            .caption { position: static; margin: 2rem auto; }
            .hero { position: static; min-height: 60vh; }
            .contemplation { position: static; padding: 4rem 2rem; background: var(--soil); }
            .contemplation::before { display: none; }
            .site-header { position: static; }
            .scroll-indicator { display: none; }
            .overlay { position: static; pointer-events: auto; background: var(--sand); }
            .stage { display: none; }
          `}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
