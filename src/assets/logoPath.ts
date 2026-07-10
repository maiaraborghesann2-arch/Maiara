/**
 * Lyken "LK" ligature monogram — single source of truth.
 *
 * Consumed by:
 *  - <Logo />                (renders the strokes)
 *  - <LoadingScreen />       (stroke-dasharray draw animation)
 *  - <ParticleSphere />      (samples points along the strokes for the
 *                             hover "logo reveal" morph state)
 *
 * The mark: a tall serif L on the left — flared bracketed serif at the
 * top, bottom curving into a calligraphic flourish sweeping right — and
 * a K on the right whose two curved diagonals radiate from mid-height,
 * the upper ending in a serif flick at the top-right, the lower in a
 * pointed tail at the bottom-right (mirroring the L's flourish). A small
 * gap of negative space separates the L stem from the K strokes so the
 * ligature interlocks without merging. Near-square bounding box,
 * high-contrast strokes: thicker vertical, thin curved diagonals.
 */

export const LOGO_VIEWBOX = '0 0 150 150';
export const LOGO_VIEWBOX_SIZE = 150;

export interface LogoStroke {
  d: string;
  width: number;
}

export const LOGO_STROKES: LogoStroke[] = [
  // L — flared top serif, bracketing the stem apex from both sides
  {
    d: 'M38 38 C40 26 50 21 57 25 C64 21 74 26 76 38',
    width: 4.5,
  },
  // L — vertical stem flowing into the bottom flourish sweeping right
  {
    d: 'M57 27 L57 100 C57 117 67 126 84 122 C92 120 97 113 97.5 106',
    width: 8,
  },
  // K — upper diagonal: curves up-right from mid-height, serif flick at the top
  {
    d: 'M68 74 C84 64 98 48 106 29 C108 24.5 113.5 23 117 26.5',
    width: 4.5,
  },
  // K — lower diagonal: curves down-right, pointed calligraphic tail
  {
    d: 'M68 81 C82 93 95 107 105 120 C108.5 124.5 115 125 118 120',
    width: 4.5,
  },
];

/**
 * Sample `count` points evenly along the monogram strokes (proportional to
 * each stroke's length), jittered within the stroke width so the glyph has
 * body. Returns centered coordinates normalized to [-0.5, 0.5] on the
 * longest axis (aspect preserved, y up).
 */
export function sampleLogoPoints(count: number): Float32Array {
  const ns = 'http://www.w3.org/2000/svg';
  const paths = LOGO_STROKES.map((s) => {
    const el = document.createElementNS(ns, 'path');
    el.setAttribute('d', s.d);
    return { el, width: s.width, length: 0 };
  });

  let totalLength = 0;
  for (const p of paths) {
    p.length = p.el.getTotalLength();
    totalLength += p.length;
  }

  // measure bounds first so we can center + normalize
  const raw: number[] = [];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  let emitted = 0;
  paths.forEach((p, pi) => {
    const share =
      pi === paths.length - 1
        ? count - emitted
        : Math.max(1, Math.round((p.length / totalLength) * count));
    for (let i = 0; i < share && emitted < count; i++) {
      const t = (i + Math.random() * 0.8) / share;
      const pt = p.el.getPointAtLength(t * p.length);
      // jitter within the stroke body
      const r = (Math.random() - 0.5) * p.width;
      const a = Math.random() * Math.PI * 2;
      const x = pt.x + Math.cos(a) * r * 0.5;
      const y = pt.y + Math.sin(a) * r * 0.5;
      raw.push(x, y);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      emitted++;
    }
  });

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const extent = Math.max(maxX - minX, maxY - minY) || 1;

  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const sx = raw[(i % (raw.length / 2)) * 2];
    const sy = raw[(i % (raw.length / 2)) * 2 + 1];
    out[i * 2] = (sx - cx) / extent;
    out[i * 2 + 1] = -(sy - cy) / extent; // flip: SVG y-down → world y-up
  }
  return out;
}
