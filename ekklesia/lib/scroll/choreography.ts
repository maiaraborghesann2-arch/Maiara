import { easing, type Keyframe } from "@/lib/math";

/**
 * The shot list for Act I, expressed as keyframe tracks over the Act I track
 * progress (0 = top of the scroll track, 1 = bottom).
 *
 * Every animated quantity in the chapter lives here, in one file, so the timing
 * of the whole sequence can be read and retuned without opening a single
 * component. Components stay dumb: they sample a track and write the result to
 * a `ref`.
 */

/** The ledge the grain begins on. */
export const GROUND_Y = -0.3;
/** The earth it comes to rest on. */
export const LANDING_Y = -1.85;
/** How far it falls. */
export const DROP = LANDING_Y - GROUND_Y;

/**
 * How far left the camera dollies to open the Home's text column. `CameraRig`
 * scales this down in portrait, where the visible width is narrower than the
 * pan itself and the full move would carry the grain clean out of frame.
 */
export const HERO_PAN_X = -1.25;

export const seed = {
  /**
   * Constant. A real object does not change size — apparent scale is the
   * camera's job, and letting the lens do that work is most of why the sequence
   * reads as photographed rather than animated.
   */
  scale: [{ at: 0, value: 0.095 }] satisfies Keyframe[],

  /**
   * Vertical *offset from resting contact*, not absolute height. `Seed` adds
   * this to `GROUND_Y + halfHeight × scale`, so the grain stays welded to the
   * ledge through Acts 01–02 no matter how anything else is retuned.
   *
   * The tail is the point: contact, a rebound of four per cent of the drop, and
   * a settle. Nothing else in the sequence communicates mass as cheaply as a
   * bounce too small to consciously notice.
   */
  fall: [
    { at: 0.0, value: 0 },
    { at: 0.46, value: 0 },
    // Breaks contact.
    { at: 0.53, value: 0.035, ease: easing.outCubic },
    { at: 0.6, value: 0.012 },
    { at: 0.745, value: DROP, ease: easing.gravity },
    { at: 0.762, value: DROP + 0.06, ease: easing.outCubic },
    { at: 0.782, value: DROP, ease: easing.inQuad },
    { at: 1.0, value: DROP },
  ] satisfies Keyframe[],

  /**
   * Half a turn across Act 02 on a sine ease, so it has no visible start or
   * stop; then a tumble under gravity that *stops* on impact. A landed object
   * does not keep rotating, and letting it would undo the weight the bounce
   * just bought.
   */
  rotationY: [
    { at: 0.0, value: 0.15 },
    { at: 0.18, value: 0.24 },
    { at: 0.48, value: Math.PI * 0.92, ease: easing.inOutSine },
    { at: 0.745, value: Math.PI * 1.28 },
    { at: 0.79, value: Math.PI * 1.33, ease: easing.outCubic },
    { at: 1.0, value: Math.PI * 1.34 },
  ] satisfies Keyframe[],

  rotationX: [
    { at: 0.0, value: 0.06 },
    { at: 0.48, value: -0.1, ease: easing.inOutSine },
    { at: 0.745, value: -0.34 },
    { at: 0.79, value: -0.3, ease: easing.outCubic },
    { at: 1.0, value: -0.3 },
  ] satisfies Keyframe[],

  rotationZ: [
    { at: 0.0, value: -0.04 },
    { at: 0.46, value: -0.03 },
    { at: 0.62, value: 0.1 },
    { at: 0.745, value: 0.22 },
    { at: 0.79, value: 0.19, ease: easing.outCubic },
    { at: 1.0, value: 0.19 },
  ] satisfies Keyframe[],

  /** Idle drift authority — silenced at release and never restored: the grain
   *  is resting on earth by the end, not floating in a hero. */
  idle: [
    { at: 0.0, value: 1 },
    { at: 0.44, value: 1 },
    { at: 0.52, value: 0 },
    { at: 1.0, value: 0 },
  ] satisfies Keyframe[],
};

/**
 * The camera carries the whole piece.
 *
 * It opens wide on an almost empty frame, pushes in for the turn, falls with
 * the grain — lagging just enough that the drop accelerates *within* the frame
 * — and then, after impact, pans left and settles. That last move is the whole
 * transition: the grain does not travel to the Home, the frame recomposes
 * around where it landed. Which is what makes its arrival the *cause* of the
 * Home rather than a coincidence of timing.
 *
 * It also never cuts and never resets, because frame 06 needs to pick up this
 * same camera still descending toward the soil.
 */
export const camera = {
  /** Lateral dolly. `targetX` follows it, so this pans without rotating. */
  x: [
    { at: 0.0, value: 0 },
    { at: 0.78, value: 0 },
    { at: 1.0, value: HERO_PAN_X, ease: easing.outCubic },
  ] satisfies Keyframe[],

  y: [
    { at: 0.0, value: 0.3 },
    { at: 0.2, value: 0.3 },
    { at: 0.48, value: 0.16, ease: easing.inOutSine },
    { at: 0.58, value: 0.02 },
    { at: 0.745, value: -1.3, ease: easing.gravity },
    { at: 0.8, value: -1.4, ease: easing.outCubic },
    { at: 1.0, value: -1.44 },
  ] satisfies Keyframe[],

  /**
   * Apparent size of the grain lives here, not in its scale. The macro push
   * through Act 02 is what lets the turn read as material — at the opening
   * distance the grain is five per cent of frame height and there is nothing
   * to examine.
   */
  z: [
    { at: 0.0, value: 5.6 },
    { at: 0.18, value: 5.45 },
    { at: 0.48, value: 2.95, ease: easing.inOutSine },
    // Pulls back as the grain releases — the lens gives up the close-up
    // because the subject is leaving, which is motivation, not a transition.
    { at: 0.58, value: 3.9, ease: easing.outCubic },
    { at: 0.745, value: 4.75 },
    { at: 0.8, value: 4.6 },
    { at: 1.0, value: 4.35, ease: easing.outCubic },
  ] satisfies Keyframe[],

  targetY: [
    { at: 0.0, value: 0.02 },
    { at: 0.48, value: -0.14 },
    { at: 0.58, value: -0.28 },
    { at: 0.745, value: -1.55, ease: easing.gravity },
    { at: 0.8, value: -1.62 },
    { at: 1.0, value: -1.63 },
  ] satisfies Keyframe[],
};

/**
 * Key light. The small azimuth drift through Act 02 is what makes the turn feel
 * observed: the highlight travels across the grain's shoulders instead of
 * sitting in one place while the geometry rotates under it.
 */
export const light = {
  intensity: [
    { at: 0.0, value: 2.2 },
    { at: 0.3, value: 2.65 },
    { at: 0.48, value: 2.05 },
    { at: 0.745, value: 2.3 },
    { at: 1.0, value: 2.35 },
  ] satisfies Keyframe[],

  azimuth: [
    { at: 0.0, value: 0.0 },
    { at: 0.48, value: 0.55, ease: easing.inOutSine },
    { at: 1.0, value: 0.24, ease: easing.outCubic },
  ] satisfies Keyframe[],
};

export const shadow = {
  /**
   * Two surfaces, each with its own authority, rather than one plane that
   * teleports between them.
   *
   * Opacity and spread are driven by the grain's *distance* above each surface,
   * so the ledge shadow dissolves as the grain climbs away from it and the
   * earth shadow resolves out of a huge soft smear as the grain comes down —
   * no crossfade required, and the fall never passes through a frame where
   * nothing is casting.
   */
  ledge: [
    { at: 0.0, value: 1 },
    { at: 0.52, value: 1 },
    { at: 0.62, value: 0 },
  ] satisfies Keyframe[],

  earth: [
    { at: 0.0, value: 0 },
    { at: 0.56, value: 0 },
    { at: 0.66, value: 1, ease: easing.outCubic },
    { at: 1.0, value: 1 },
  ] satisfies Keyframe[],
};

/** Impact, not release. A grain this size displaces almost nothing. */
export const dust = {
  amount: [
    { at: 0.735, value: 0 },
    { at: 0.762, value: 1, ease: easing.outQuad },
    { at: 0.83, value: 0.42 },
    { at: 0.92, value: 0 },
  ] satisfies Keyframe[],
};

/**
 * The backdrop is a lit surface, not a fill: a vertical wash, a warm pool that
 * follows the grain, atmospheric haze for depth, a vignette, and an organic
 * fibre texture under all of it.
 */
export const backdrop = {
  pool: [
    { at: 0.0, value: 0.42 },
    { at: 0.48, value: 0.56 },
    { at: 0.745, value: 0.45 },
    { at: 1.0, value: 0.62, ease: easing.outCubic },
  ] satisfies Keyframe[],

  /** Page-level cast shadow. Kept low — the grain now has a real contact
   *  shadow on the earth, and doubling them reads as a smudge. */
  cast: [
    { at: 0.0, value: 0 },
    { at: 0.74, value: 0 },
    { at: 0.92, value: 0.08, ease: easing.outCubic },
    { at: 1.0, value: 0.09 },
  ] satisfies Keyframe[],

  /** Depth haze: the far field lightens and loses contrast, as air does. */
  haze: [
    { at: 0.0, value: 0.24 },
    { at: 0.48, value: 0.15 },
    { at: 0.745, value: 0.28 },
    { at: 1.0, value: 0.32, ease: easing.outCubic },
  ] satisfies Keyframe[],

  vignette: [
    { at: 0.0, value: 0.16 },
    { at: 0.48, value: 0.12 },
    { at: 0.745, value: 0.17 },
    { at: 1.0, value: 0.2, ease: easing.outCubic },
  ] satisfies Keyframe[],
};
