/**
 * Palette for the Ekklesia Connect experience.
 *
 * Mirrored as CSS custom properties in `styles/tokens.css`. This file is the
 * source of truth because the WebGL layer needs the same colours and cannot
 * read CSS variables cheaply per frame.
 */
export const palette = {
  /** The Act I ground colour, specified by art direction. */
  sand: "#ECDACB",
  /** Lifted sand for the top of the backdrop gradient — where the light is. */
  sandLight: "#F4E7DA",
  /** Warm pool that blooms behind the seed. */
  sandWarm: "#F7ECE0",
  /** Sunk sand for the vignette and the lower third. */
  sandDeep: "#DFCAB4",

  /** Seed body, lit and shadowed. */
  bark: "#B98B5E",
  barkMid: "#96683F",
  barkDeep: "#5A3A1E",

  /** Button and accent. */
  clay: "#A2502B",
  clayHover: "#8D4223",

  /** Frames 06–15, kept here so later chapters share one palette. */
  soil: "#17120C",
  olive: "#3E4A2E",

  ink: "#2B2117",
  inkSoft: "#6E5D4A",
} as const;
