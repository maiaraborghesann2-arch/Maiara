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

/** World-space height of the implied surface the seed rests on. */
export const GROUND_Y = -0.34;

export const seed = {
  /**
   * Small. The storyboard's first frame is mostly empty sand, and the object
   * only reads as precious because so little of the frame is spent on it.
   */
  scale: [
    { at: 0.0, value: 0.108 },
    { at: 0.5, value: 0.117 },
    { at: 0.66, value: 0.114 },
    { at: 0.88, value: 0.134, ease: easing.outCubic },
    { at: 1.0, value: 0.138 },
  ] satisfies Keyframe[],

  /**
   * Vertical *offset from resting contact*, not absolute height. `Seed` adds
   * this to `GROUND_Y + halfHeight × scale`, so the seed stays welded to the
   * surface through Acts 01–02 no matter how the scale track is retuned.
   */
  fall: [
    { at: 0.0, value: 0 },
    { at: 0.48, value: 0 },
    // Breaks contact — a few millimetres, enough to read as release.
    { at: 0.56, value: 0.048, ease: easing.outCubic },
    // Hangs at the apex while the dust blooms beneath it.
    { at: 0.64, value: -0.02 },
    { at: 0.82, value: -1.2, ease: easing.gravity },
    { at: 1.0, value: -1.42, ease: easing.outCubic },
  ] satisfies Keyframe[],

  /**
   * Held at zero through the whole fall. The seed has to drop *straight down*
   * over the dust it kicked up — drifting sideways during frame 03 severs the
   * two and the burst stops reading as caused by the seed. The move to the hero
   * anchor only starts once the fall has been established.
   */
  arrival: [
    { at: 0.0, value: 0 },
    { at: 0.68, value: 0 },
    { at: 0.9, value: 1, ease: easing.outCubic },
    { at: 1.0, value: 1 },
  ] satisfies Keyframe[],

  /**
   * Roughly half a turn across Act 02, on a sine ease so it has no visible
   * start or stop. A fast spin flattens the object into a blur; what discloses
   * form is a slow turn where the silhouette and the highlight both change.
   */
  rotationY: [
    { at: 0.0, value: 0.18 },
    { at: 0.2, value: 0.3 },
    { at: 0.5, value: Math.PI * 1.05, ease: easing.inOutSine },
    { at: 0.82, value: Math.PI * 1.55 },
    { at: 1.0, value: Math.PI * 1.72 },
  ] satisfies Keyframe[],

  /** Secondary axes: the turn tips slightly, then tumbles under gravity. */
  rotationX: [
    { at: 0.0, value: 0.1 },
    { at: 0.5, value: -0.12, ease: easing.inOutSine },
    { at: 0.82, value: -0.42 },
    { at: 1.0, value: -0.05, ease: easing.outCubic },
  ] satisfies Keyframe[],

  rotationZ: [
    { at: 0.0, value: -0.06 },
    { at: 0.48, value: -0.04 },
    { at: 0.66, value: 0.16 },
    { at: 0.82, value: 0.4 },
    { at: 1.0, value: 0.07, ease: easing.outCubic },
  ] satisfies Keyframe[],

  /** Idle drift authority — silenced once the seed is in free fall. */
  idle: [
    { at: 0.0, value: 1 },
    { at: 0.46, value: 1 },
    { at: 0.56, value: 0 },
    { at: 1.0, value: 0.3 },
  ] satisfies Keyframe[],
};

/**
 * The camera never cuts and never resets. It eases in through Act 02 — the
 * slow push is what makes the turn feel observed rather than displayed — then
 * follows the seed down as the Home assembles, which leaves it already
 * travelling downward, aimed at the ground, exactly where frame 06 ("a câmera
 * atravessa a superfície") needs to pick it up.
 */
export const camera = {
  y: [
    { at: 0.0, value: 0.4 },
    { at: 0.5, value: 0.4 },
    { at: 0.82, value: -0.42 },
    { at: 1.0, value: -1.02, ease: easing.outCubic },
  ] satisfies Keyframe[],

  z: [
    { at: 0.0, value: 5.05 },
    { at: 0.5, value: 4.72, ease: easing.inOutSine },
    { at: 0.7, value: 5.0 },
    { at: 1.0, value: 5.5, ease: easing.outCubic },
  ] satisfies Keyframe[],

  targetY: [
    { at: 0.0, value: -0.06 },
    { at: 0.5, value: -0.06 },
    { at: 0.82, value: -0.72 },
    { at: 1.0, value: -1.3, ease: easing.outCubic },
  ] satisfies Keyframe[],
};

/** Shadow authority — both the shadow map and the contact occlusion. */
export const shadow = {
  opacity: [
    { at: 0.0, value: 1 },
    { at: 0.46, value: 1 },
    { at: 0.6, value: 0 },
  ] satisfies Keyframe[],
};

/** Dust burst of frame 03: bloom on release, then settle. */
export const dust = {
  amount: [
    { at: 0.46, value: 0 },
    { at: 0.55, value: 1, ease: easing.outQuad },
    { at: 0.7, value: 0.5 },
    { at: 0.82, value: 0 },
  ] satisfies Keyframe[],
};

/**
 * The backdrop is not a flat fill. A vertical wash, a warm pool of light behind
 * the object, a soft cast shadow and a vignette give the sand depth — and in
 * Act 04 they are what bind the seed to the hero typography, because both then
 * sit inside the same lighting environment instead of being two layers stacked
 * on each other.
 */
export const backdrop = {
  /** Strength of the warm light pool that follows the seed. */
  pool: [
    { at: 0.0, value: 0.55 },
    { at: 0.5, value: 0.62 },
    { at: 0.82, value: 0.48 },
    { at: 1.0, value: 0.76, ease: easing.outCubic },
  ] satisfies Keyframe[],

  /**
   * Shadow the seed drops onto the page itself. Off until the Home, where it is
   * the main thing stopping the object from looking pasted on.
   */
  cast: [
    { at: 0.0, value: 0 },
    { at: 0.72, value: 0 },
    { at: 0.92, value: 0.16, ease: easing.outCubic },
    { at: 1.0, value: 0.19 },
  ] satisfies Keyframe[],

  vignette: [
    { at: 0.0, value: 0.12 },
    { at: 0.5, value: 0.1 },
    { at: 0.82, value: 0.14 },
    { at: 1.0, value: 0.19, ease: easing.outCubic },
  ] satisfies Keyframe[],
};
