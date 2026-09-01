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
  title: "Ekklesia Connect — Consultoria de tecnologia para igrejas",
  description:
    "Consultoria e desenvolvimento de tecnologia sob medida para igrejas e ministérios. Diagnosticamos, integramos e desenvolvemos soluções adaptadas à identidade, aos processos e à missão da sua igreja.",
};

export const viewport: Viewport = {
  themeColor: "#ECDACB",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cormorant.variable} ${inter.variable}`}>
      <head>
        {/*
          Reveals are switched on by an IntersectionObserver writing one
          attribute. With scripting off nothing would ever write it, so hand the
          page back as static, readable content instead of a blank cream screen.
          The opening collapses to its first frame, which is the honest thing to
          show when the scrub cannot run.
        */}
        <noscript>
          <style>{`
            [data-reveal], .mask__line { opacity: 1 !important; transform: none !important; }
            .cinematic { height: 100vh !important; }
            .intro { display: none !important; }
            .site-header__menu { display: none !important; }
          `}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  );
}
