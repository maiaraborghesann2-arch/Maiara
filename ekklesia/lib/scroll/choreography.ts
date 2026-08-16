import { easing, type Keyframe } from "@/lib/math";

/**
 * The shot list for Act I, expressed as keyframe tracks over the Act I track
 * progress (0 = top of the scroll track, 1 = bottom).
 *
 * Every animated quantity in the chapter lives here, in one file, so the
 * timing of the whole sequence can be read and retuned without opening a
 * single component. Components stay dumb: they sample a track and write the
 * result to a `ref`.
 */

/** World-space height the seed rests at before it breaks free. */
export const GROUND_Y = -0.34;

export const seed = {
  scale: [
    { at: 0.0, value: 0.105 },
    { at: 0.24, value: 0.114 },
    { at: 0.5, value: 0.132 },
    { at: 0.66, value: 0.126 },
    { at: 0.88, value: 0.142, ease: easing.outCubic },
    { at: 1.0, value: 0.147 },
  ] satisfies Keyframe[],

  /**
   * Rest, a small lift as it releases, then an accelerating descent that never
   * stops — the seed is still drifting downward at the end of the chapter,
   * which is the handoff into frame 05 ("ela encontra o solo").
   */
  y: [
    { at: 0.0, value: -0.199 },
    { at: 0.48, value: -0.199 },
    // A hair of lift as it breaks contact — enough to read as "solta", not so
    // much that the seed appears to float upward.
    { at: 0.56, value: -0.16, ease: easing.outCubic },
    // Hangs briefly at the top of the release so the dust burst blooms
    // *beneath* it, the way frame 03 stages the moment. Falling immediately
    // would drop the seed past its own dust.
    { at: 0.64, value: -0.24 },
    { at: 0.82, value: -1.34, ease: easing.gravity },
    { at: 1.0, value: -1.46, ease: easing.outCubic },
  ] satisfies Keyframe[],

  /**
   * Fraction of the hero anchor the seed has travelled toward. Multiplied by a
   * viewport-derived x so the composition holds on any aspect ratio.
   */
  /**
   * Held at zero through the whole fall. The seed has to drop *straight down*
   * over the dust it kicked up — drifting sideways during frame 03 severs the
   * two and the burst stops reading as caused by the seed. The move to the
   * hero anchor only starts once the fall has been established.
   */
  xFactor: [
    { at: 0.0, value: 0 },
    { at: 0.68, value: 0 },
    { at: 0.9, value: 1, ease: easing.outCubic },
    { at: 1.0, value: 1 },
  ] satisfies Keyframe[],

  rotationY: [
    { at: 0.0, value: 0.2 },
    { at: 0.2, value: 0.36 },
    { at: 0.5, value: Math.PI * 2.35, ease: easing.inOutCubic },
    { at: 0.78, value: Math.PI * 3.0 },
    { at: 1.0, value: Math.PI * 3.24 },
  ] satisfies Keyframe[],

  rotationZ: [
    { at: 0.48, value: 0.02 },
    { at: 0.64, value: 0.34 },
    { at: 0.8, value: 0.5 },
    { at: 1.0, value: 0.16, ease: easing.outCubic },
  ] satisfies Keyframe[],

  rotationX: [
    { at: 0.0, value: 0.09 },
    { at: 0.5, value: 0.05 },
    { at: 0.78, value: -0.34 },
    { at: 1.0, value: -0.11 },
  ] satisfies Keyframe[],

  /** Idle drift authority — silenced once the seed is in free fall. */
  idle: [
    { at: 0.0, value: 1 },
    { at: 0.46, value: 1 },
    { at: 0.56, value: 0 },
    { at: 1.0, value: 0.35 },
  ] satisfies Keyframe[],
};

/**
 * The camera never cuts and never resets. It holds for the first three beats,
 * then follows the seed down as the Home assembles — which leaves it already
 * travelling downward, aimed at the ground, exactly where frame 06 ("a câmera
 * atravessa a superfície") needs to pick it up.
 */
export const camera = {
  y: [
    { at: 0.0, value: 0.42 },
    { at: 0.5, value: 0.42 },
    { at: 0.78, value: -0.42 },
    { at: 1.0, value: -1.02, ease: easing.outCubic },
  ] satisfies Keyframe[],

  z: [
    { at: 0.0, value: 5.0 },
    { at: 0.4, value: 4.86 },
    { at: 0.7, value: 5.12 },
    { at: 1.0, value: 5.5, ease: easing.outCubic },
  ] satisfies Keyframe[],

  targetY: [
    { at: 0.0, value: -0.05 },
    { at: 0.5, value: -0.05 },
    { at: 0.78, value: -0.72 },
    { at: 1.0, value: -1.3, ease: easing.outCubic },
  ] satisfies Keyframe[],
};

export const groundShadow = {
  opacity: [
    { at: 0.0, value: 0.9 },
    { at: 0.44, value: 0.9 },
    { at: 0.58, value: 0 },
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

/** Background wash: cream of frames 01–03 warming into the Home sand. */
export const background = {
  /** 0 = bone, 1 = dusk, 2 = sand. Sampled then split into two lerps. */
  mix: [
    { at: 0.0, value: 0 },
    { at: 0.5, value: 0 },
    { at: 0.74, value: 1 },
    { at: 1.0, value: 2, ease: easing.outCubic },
  ] satisfies Keyframe[],
};
