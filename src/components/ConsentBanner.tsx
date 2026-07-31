import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../i18n/LanguageContext';
import './ConsentBanner.css';

/**
 * Storage notice — shown once, then remembered.
 *
 * SCOPE: this site currently writes only FUNCTIONAL values to localStorage —
 * the language choice ('lyken:lang'), the ambient audio preference, and this
 * acknowledgement itself. Nothing is shared with a third party, and there is
 * no tracking, no advertising, and no analytics. A single "Accept" notice is
 * an adequate transparency measure for that.
 *
 * ⚠️ IF ANALYTICS OR ANY THIRD-PARTY TRACKING IS EVER ADDED (Google Analytics,
 * Meta Pixel, Hotjar, a heatmap tool, an A/B testing script…), this component
 * is NO LONGER SUFFICIENT and must be replaced by a granular consent
 * mechanism:
 *   • functional vs. analytics (vs. marketing) categories, listed separately;
 *   • non-essential categories OFF by default — opt-IN, not opt-out, and no
 *     pre-ticked boxes (ePrivacy Directive + GDPR Art. 7);
 *   • "Reject all" must be as easy to reach as "Accept all";
 *   • the tracking scripts must not load at all until consent is given;
 *   • the choice must be recorded per category, and withdrawable later from a
 *     persistent link ("Cookie settings") — not just once at first visit.
 * Until then, keep this banner honest about what it actually covers.
 */

const STORAGE_KEY = 'lyken:consent';

export function ConsentBanner() {
  const { dict } = useLang();
  const t = dict.consent;
  // Undecided until we have read localStorage — never render on the server
  // path or flash the banner at someone who already dismissed it.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== '1') setVisible(true);
    } catch {
      // Private mode / storage blocked: nothing is being stored, so there is
      // nothing to notify about.
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* dismissal simply will not persist */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="consent" role="region" aria-label={t.ariaLabel}>
      <p className="consent-text">
        {t.text}{' '}
        <Link to="/privacy" className="consent-link">
          {t.learnMore}
        </Link>
      </p>
      <button type="button" className="consent-accept" onClick={accept}>
        {t.accept}
      </button>
    </aside>
  );
}
