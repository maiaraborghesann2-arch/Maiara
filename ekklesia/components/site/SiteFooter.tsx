"use client";

import { Mark } from "@/components/brand/Mark";
import { BRAND, FOOTER } from "@/lib/site/content";

/**
 * The close.
 *
 * The film ends on a tree standing in open country, so the page ends on the
 * same soil the roots were shot against — the one place the mark is set in
 * light on dark, which is how the storyboard's own closing panel treats it.
 *
 * No newsletter, no social row, no sitemap in four columns. The visitor has
 * just been given a single next step by the section above; the footer's job is
 * to close the brand, not to offer eleven more places to go.
 */
export function SiteFooter() {
  return (
    <footer className="footer" data-ink="light">
      <div className="footer__top">
        <div className="footer__brand">
          <Mark size={30} />
          <span className="site-header__word">
            <strong>{BRAND.name}</strong>
            <em>{BRAND.suffix}</em>
          </span>
        </div>

        <p className="footer__note">{FOOTER.note}</p>
      </div>

      <div className="footer__columns">
        {FOOTER.columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="footer__heading">{column.title}</h2>
            <ul>
              {column.links.map((link) => (
                <li key={link.label}>
                  <a href={link.href}>{link.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <p className="footer__legal">{FOOTER.legal}</p>
    </footer>
  );
}
