import { forwardRef } from 'react';
import { LOGO_STROKES, LOGO_VIEWBOX } from '../assets/logoPath';
import './Logo.css';

interface LogoProps {
  /** Width of the monogram in px; the wordmark scales proportionally */
  size?: number;
  monogramOnly?: boolean;
  className?: string;
}

/**
 * Lyken "LK" ligature monogram + wordmark. Stroke geometry lives in
 * src/assets/logoPath.ts (shared with the loading screen draw animation
 * and the ParticleSphere logo-reveal morph). The .lyken-monogram-path
 * class is the loading screen's stroke-draw hook.
 */
export const Logo = forwardRef<HTMLDivElement, LogoProps>(function Logo(
  { size = 96, monogramOnly = false, className = '' },
  ref,
) {
  return (
    <div ref={ref} className={`lyken-logo ${className}`} role="img" aria-label="Lyken Agency">
      <svg
        className="lyken-monogram"
        width={size}
        height={size}
        viewBox={LOGO_VIEWBOX}
        fill="none"
        aria-hidden="true"
      >
        {LOGO_STROKES.map((s, i) => (
          <path
            key={i}
            className="lyken-monogram-path"
            d={s.d}
            stroke="currentColor"
            strokeWidth={s.width}
            strokeLinecap="round"
          />
        ))}
      </svg>

      {!monogramOnly && (
        <div className="lyken-wordmark" style={{ fontSize: size * 0.34 }}>
          <span className="lyken-wordmark-name">LYKEN</span>
          <span className="lyken-wordmark-sub u-label">
            <span className="lyken-wordmark-dash" aria-hidden="true" />
            AGENCY
            <span className="lyken-wordmark-dash" aria-hidden="true" />
          </span>
        </div>
      )}
    </div>
  );
});
