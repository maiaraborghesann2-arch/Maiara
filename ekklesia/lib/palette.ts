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
  /** Light itself — the value the shafts carry. Brighter than any surface. */
  shaft: "#FFFBF3",
  /** Sunk sand for the vignette and the lower third. */
  sandDeep: "#D9C1A8",
  /** The earth the grain lands on — deeper and warmer than the air above it. */
  earth: "#C6A585",
  /** Soil seen close up. Far less saturated than the earth read from above:
   *  under a warm key, anything more chromatic than this reads as Mars. */
  soilLight: "#8E7960",
  soilDark: "#3E2F22",
  /**
   * The ground the grain is actually pressed into, seen from a hand's breadth
   * away. Deliberately greyer than `earth`: albedo is not the colour you get on
   * screen, and under a warm key anything as chromatic as the painted earth
   * renders as Martian regolith once it is a lit surface rather than a wash.
   */
  tilth: "#9C8B77",
  tilthDeep: "#5C4C3C",

  /**
   * The grain. Earth pigments rather than shell browns — ochre through umber,
   * matte, with almost no red. A mustard seed is a small dry thing the colour
   * of dug soil, not a polished nut.
   */
  grainLight: "#A67F52",
  grainMid: "#795433",
  grainDeep: "#3F2B18",

  /**
   * Roots: pale and damp against the dark earth, the way new growth is — but
   * only just. Any brighter and the taproot reads as a plastic straw laid over
   * the soil rather than as something growing inside it.
   */
  rootLight: "#8A7350",

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
