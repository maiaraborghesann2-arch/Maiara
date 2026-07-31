import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';
import { LiquidText } from '../components/LiquidText';
import { useLang } from '../i18n/LanguageContext';
import { LAST_UPDATED, PRIVACY_POLICY, TERMS_OF_SERVICE } from '../content/legal';
import type { LegalDoc } from '../content/legal';
import './Legal.css';

/**
 * Long-form legal documents (/privacy, /terms) — one renderer, two documents.
 *
 * Reading layout, in the same measure as an Insights article: a single narrow
 * column, no marketing hero, no motion beyond the shared scroll reveal. The
 * content itself lives in src/content/legal.ts.
 */

function LegalDocument({ doc }: { doc: LegalDoc }) {
  const { dict } = useLang();
  const t = dict.legal;

  return (
    <PageShell className="page legal">
      <Seo title={`${doc.title} — Lyken Agency`} description={doc.intro} path={doc.path} />

      <article className="legal-wrap">
        <header className="legal-head">
          <span className="section-label">{t.label}</span>
          <LiquidText as="h1" className="legal-headline">
            {doc.title}
          </LiquidText>
          <p className="legal-updated u-label">
            {t.lastUpdated}: {LAST_UPDATED}
          </p>
        </header>

        {/* Deliberately loud and above the content — this is a draft template.
            Remove this block (and `legal.disclaimer` from the dictionaries)
            once the documents have been through legal review. */}
        <aside className="legal-disclaimer" role="note">
          <span className="legal-disclaimer-label u-label">{t.disclaimerLabel}</span>
          <p>{t.disclaimer}</p>
        </aside>

        {t.langNote && <p className="legal-langnote">{t.langNote}</p>}

        <p className="legal-intro">{doc.intro}</p>

        {/* No <Reveal /> here, deliberately. Scroll-triggered reveals set
            visibility:hidden until they fire — acceptable for marketing
            sections, wrong for a legal document, which must stay readable,
            printable and crawlable whether or not the animation ever runs. */}
        <div className="legal-body">
          {doc.sections.map((section) => (
            <section className="legal-section" key={section.heading}>
              <h2 className="legal-h2">{section.heading}</h2>
              {section.blocks.map((block, i) =>
                Array.isArray(block) ? (
                  <ul className="legal-list" key={i}>
                    {block.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p key={i}>{block}</p>
                ),
              )}
            </section>
          ))}
        </div>

        <nav className="legal-crosslinks" aria-label={t.label}>
          <Link to={doc.path === '/privacy' ? '/terms' : '/privacy'} data-magnetic>
            {doc.path === '/privacy' ? t.terms : t.privacy} →
          </Link>
          <Link to="/contact" data-magnetic>
            {dict.nav.contact} →
          </Link>
        </nav>
      </article>
    </PageShell>
  );
}

export function Privacy() {
  return <LegalDocument doc={PRIVACY_POLICY} />;
}

export function Terms() {
  return <LegalDocument doc={TERMS_OF_SERVICE} />;
}
