import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { translations } from './translations';
import type { Dict, HeadlineSegment, Lang } from './translations';

/**
 * Minimal sitewide i18n: React context + static dictionaries (translations.ts).
 * English is the first-load default; the visitor's choice persists in
 * localStorage ('lyken:lang'). <html lang> tracks the active language.
 */

const STORAGE_KEY = 'lyken:lang';

interface LanguageContextValue {
  lang: Lang;
  dict: Dict;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  dict: translations.en,
  setLang: () => {},
});

function readStoredLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'pt' ? 'pt' : 'en';
  } catch {
    return 'en';
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable (private mode) — session-only choice */
    }
  }, []);

  const value = useMemo(() => ({ lang, dict: translations[lang], setLang }), [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Active language + dictionary. `dict` is fully typed — use `dict.nav.about` etc. */
export function useLang(): LanguageContextValue {
  return useContext(LanguageContext);
}

/** Renders an emphasis-headline segment array (gold segments in italic gold). */
export function Segments({ parts, goldClass }: { parts: HeadlineSegment[]; goldClass: string }) {
  return (
    <>
      {parts.map((p, i) =>
        p.gold ? (
          <em key={i} className={goldClass}>
            {p.text}
          </em>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}
