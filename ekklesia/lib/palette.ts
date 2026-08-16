/**
 * Palette lifted from the Fase 1 storyboard swatches.
 *
 * These values are mirrored as CSS custom properties in `styles/tokens.css`.
 * The 3D layer cannot read CSS variables cheaply per frame, so the source of
 * truth for colours that both layers need lives here in TypeScript.
 */
export const palette = {
  /** Cream of frames 01–03. */
  bone: "#F2EAE0",
  /** Warmer cream the Home settles into (frame 04). */
  sand: "#E9DCC8",
  /** Intermediate wash used while the seed is falling. */
  dusk: "#EDE2D2",

  /** Button and accent — the terracotta of "EXPLORAR RECURSOS". */
  clay: "#A2502B",

  /** Seed body, lit and shadowed. */
  bark: "#96633B",
  barkDeep: "#4A3018",

  /** Frames 06–10, kept here so later chapters share one palette. */
  soil: "#17120C",
  olive: "#3E4A2E",

  ink: "#2B2117",
  inkSoft: "#6E5D4A",
} as const;
