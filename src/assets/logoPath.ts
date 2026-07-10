/**
 * Lyken "LK" ligature monogram — single source of truth.
 *
 * Geometry extracted directly from the official brand vector asset
 * (SEM_FUNDO.pdf), normalized to a 130.8 × 150 viewBox with the original
 * aspect ratio preserved. This is a FILLED glyph (high-contrast serif),
 * not a set of strokes — three subpaths: the L, the K, and the small
 * calligraphic flick at the bottom centre.
 *
 * Consumed by:
 *  - <Logo />           (fills the path with currentColor)
 *  - <LoadingScreen />  (outline stroke-draw, then the fill fades in)
 *  - <ParticleSphere /> (samples points INSIDE the filled glyph for the
 *                        hover "logo reveal" morph state)
 */

export const LOGO_VIEWBOX = '0 0 130.8 150';
export const LOGO_WIDTH = 130.8;
export const LOGO_HEIGHT = 150;

export const LOGO_PATH =
  'M59.13 125.28 C50.19 131.9 41.25 138.79 34.51 147.74 L66.9 147.89 C67.82 147.09 63.19 146.59 62.77 146.48 C51.06 143.3 58.05 132.84 62.45 126.5 C63.04 125.65 67.4 120.55 66.9 120 L59.13 125.28 Z ' +
  'M73.8 34.8 L73.8 35.7 C87.82 36.94 88.02 44.43 80.39 54.14 C72.28 64.46 61.96 73.84 53.7 84.15 L53.14 85.58 C62.93 98.2 71.82 111.49 81.35 124.29 C86.11 130.67 93.28 141.73 100.23 145.31 C109.35 150 120.91 147.59 130.8 148.19 L130.79 147.3 C122.92 146.71 116.16 143.49 110.84 137.7 L64.23 74.29 C70.31 68.08 76.53 61.95 83.09 56.24 C95.06 45.85 108.24 36.29 124.8 35.7 L124.8 34.8 L73.8 34.8 Z ' +
  'M45.6 0 L45.6 0.9 C39.63 1.41 33.7 4.41 31.94 10.49 C31.78 11.05 31.2 13.56 31.2 13.95 L31.2 108.9 L32.24 108.58 L48.75 89.7 L49.72 91.04 L49.33 91.77 C42.66 99.1 36.75 107.58 30.15 114.9 C21.69 124.29 11.98 122.65 0.3 122.69 C0.16 121.79 0.52 122.21 1.03 122.09 C11.68 119.46 14.73 115.09 15.32 103.96 C16.84 74.93 14.13 44.6 15.32 15.43 C15.02 11.95 14.43 8.25 12.01 5.54 C9.13 2.31 4.21 1.09 0 0.9 L0 0 L45.6 0 Z';

/**
 * Sample `count` points uniformly INSIDE the filled glyph (rejection
 * sampling against the path fill). Returns centered coordinates normalized
 * to [-0.5, 0.5] on the longest axis (aspect preserved, y up).
 */
export function sampleLogoPoints(count: number): Float32Array {
  const path = new Path2D(LOGO_PATH);
  const ctx = document.createElement('canvas').getContext('2d')!;
  const extent = Math.max(LOGO_WIDTH, LOGO_HEIGHT);

  const out = new Float32Array(count * 2);
  let placed = 0;
  let guard = 0;
  const maxTries = count * 80;
  while (placed < count && guard < maxTries) {
    guard++;
    const x = Math.random() * LOGO_WIDTH;
    const y = Math.random() * LOGO_HEIGHT;
    if (ctx.isPointInPath(path, x, y, 'nonzero')) {
      out[placed * 2] = (x - LOGO_WIDTH / 2) / extent;
      out[placed * 2 + 1] = -(y - LOGO_HEIGHT / 2) / extent; // SVG y-down → world y-up
      placed++;
    }
  }
  // pathological fallback: duplicate earlier hits
  for (; placed < count; placed++) {
    const src = Math.floor(Math.random() * Math.max(1, placed));
    out[placed * 2] = out[src * 2];
    out[placed * 2 + 1] = out[src * 2 + 1];
  }
  return out;
}
