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
  /** Lifted sand for the top of the backdrop — where the light comes from. */
  sandLight: "#F6EBE0",
  /** Warm pool that blooms around the seed. */
  sandWarm: "#FAF1E7",
  /** Sunk sand for the vignette and the lower third. */
  sandDeep: "#D9C1A8",

  /**
   * The grain. Earth pigments rather than shell browns — ochre through umber,
   * matte, with almost no red. A mustard seed is a small dry thing the colour
   * of dug soil, not a polished nut.
   */
  grainLight: "#A67F52",
  grainMid: "#795433",
  grainDeep: "#3F2B18",

  /** Action. */
  clay: "#A2502B",
  clayHover: "#8B4222",

  /** Structure — rules, marks, quiet accents. */
  olive: "#4A5537",
  oliveSoft: "#6B7550",

  /** Frames 06–15, kept here so later chapters share one palette. */
  soil: "#17120C",

  ink: "#2B2117",
  inkSoft: "#6E5D4A",
} as const;
