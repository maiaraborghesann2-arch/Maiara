"use client";

import { LOCALES } from "@/lib/site/copy";
import { useCopy, useLocale } from "@/lib/site/locale";

/**
 * EN / PT, in the header.
 *
 * Two buttons and a hairline between them — not a dropdown, because a dropdown
 * for two options costs a click to find out there were only two. It sits beside
 * the menu control and borrows its type, so it reads as part of the navigation
 * rather than as a widget bolted onto it.
 *
 * The active language is marked with `aria-current`, which is what tells a
 * screen reader which of the two is in force. Colour alone would not.
 */
export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  const { ui } = useCopy();

  return (
    <div className="lang" role="group" aria-label={ui.language}>
      {LOCALES.map((code, i) => (
        <span key={code} className="lang__slot">
          {i > 0 ? <span className="lang__sep" aria-hidden="true" /> : null}
          <button
            type="button"
            className="lang__option"
            aria-current={locale === code}
            aria-label={ui.languageNames[code]}
            onClick={() => setLocale(code)}
          >
            {code.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
