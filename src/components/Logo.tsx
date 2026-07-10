import { forwardRef } from 'react';
import { LOGO_HEIGHT, LOGO_PATH, LOGO_VIEWBOX, LOGO_WIDTH } from '../assets/logoPath';
import './Logo.css';

interface LogoProps {
  /** Width of the monogram in px; height follows the mark's true aspect ratio */
  size?: number;
  monogramOnly?: boolean;
  className?: string;
}

/**
 * Lyken "LK" ligature monogram + wordmark. The filled glyph geometry is
 * extracted from the official brand asset and lives in
 * src/assets/logoPath.ts (shared with the loading screen draw and the
 * ParticleSphere logo-reveal morph). The .lyken-monogram-path class is
 * the loading screen's stroke-draw hook.
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
        height={size * (LOGO_HEIGHT / LOGO_WIDTH)}
        viewBox={LOGO_VIEWBOX}
        aria-hidden="true"
      >
        <path className="lyken-monogram-path" d={LOGO_PATH} fill="currentColor" />
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
