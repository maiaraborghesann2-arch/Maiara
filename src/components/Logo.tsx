import { forwardRef } from 'react';
import './Logo.css';

interface LogoProps {
  /** Width of the monogram in px; the wordmark scales proportionally */
  size?: number;
  monogramOnly?: boolean;
  className?: string;
}

/**
 * Lyken "LK" ligature monogram + wordmark.
 * Paths are stroke-based so the loading screen can draw them in
 * with a stroke-dasharray animation (class: .lyken-monogram-path).
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
        height={size * 1.07}
        viewBox="0 0 140 150"
        fill="none"
        aria-hidden="true"
      >
        {/* L — curved serif sweeping left at the top, long stem,
            baseline flowing right into a soft upward curl */}
        <path
          className="lyken-monogram-path"
          d="M27 42 C25 25 35 14 46 17.5 C51.5 19.5 54 25 54 33 L54 106 C54 121 62 129.5 77 128 C84 127.2 89 122.5 90.5 116"
          stroke="currentColor"
          strokeWidth="6.5"
          strokeLinecap="round"
        />
        {/* K upper diagonal — sweeps from the top right down toward the
            L stem, stopping short to leave a deliberate gap */}
        <path
          className="lyken-monogram-path"
          d="M116 16 C102 40 84 57 66 66"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* K lower diagonal — small flick/tail at the bottom terminal */}
        <path
          className="lyken-monogram-path"
          d="M69.5 71 C82 87 94 102 103.5 115 C107 119.5 112.5 120.5 115 116"
          stroke="currentColor"
          strokeWidth="5.5"
          strokeLinecap="round"
        />
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
