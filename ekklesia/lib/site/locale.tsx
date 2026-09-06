"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { COPY, HTML_LANG, type Copy, type Locale } from "./copy";

const KEY = "ekklesia.locale";

type Ctx = { locale: Locale; copy: Copy; setLocale: (next: Locale) => void };

const LocaleContext = createContext<Ctx | null>(null);

/**
 * The language, for the whole page.
 *
 * Two decisions worth stating, because both are the reason this is small.
 *
 * IT IS STATE, NOT A ROUTE. Switching languages re-renders the tree with
 * different strings and changes nothing else: the `<video>` element keeps its
 * identity, the scroll position is never touched, the ScrollTrigger is not
 * rebuilt and the film does not restart. A `/en` and `/pt` pair would have
 * navigated, and navigating is exactly what must not happen in the middle of a
 * scroll-driven opening.
 *
 * THE STORED PREFERENCE IS READ AFTER MOUNT, NOT DURING RENDER. The page is
 * prerendered as static HTML, so reading `localStorage` while rendering would
 * make the server's markup and the client's first pass disagree — which React
 * reports as a hydration mismatch. So the first paint is always English and a
 * returning Portuguese visitor is switched a frame later. That frame is hidden
 * in practice: the cinematic entrance covers the page for its first couple of
 * seconds, and the switch lands behind it.
 */
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(KEY);
    } catch {
      // Private windows and blocked site data both throw here. English stands.
    }
    if (stored === "pt" || stored === "en") setLocaleState(stored);
  }, []);

  // `<html lang>` is not decoration: it is what a screen reader picks a voice
  // from, and what a browser offers to translate against.
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[locale];
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // The choice still applies to this visit; it just will not be remembered.
    }
  }, []);

  const value = useMemo<Ctx>(
    () => ({ locale, copy: COPY[locale], setLocale }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleContext(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useCopy must be used inside <LocaleProvider>");
  return ctx;
}

/** The strings for the active language. */
export function useCopy(): Copy {
  return useLocaleContext().copy;
}

/** The active language and the way to change it. */
export function useLocale() {
  const { locale, setLocale } = useLocaleContext();
  return { locale, setLocale } as const;
}
