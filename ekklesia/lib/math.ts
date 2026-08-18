/**
 * Small math toolkit shared by the WebGL layer and the DOM layer.
 *
 * Everything here is pure and frame-rate independent so that the same helper
 * can drive a `useFrame` callback and a direct `style` write without the two
 * drifting apart.
 */

export const clamp = (v: number, min = 0, max = 1) =>
  v < min ? min : v > max ? max : v;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Normalised position of `v` inside `[a, b]`, clamped to 0..1. */
export const invLerp = (a: number, b: number, v: number) =>
  a === b ? 0 : clamp((v - a) / (b - a));

/**
 * Frame-rate independent damping. `lambda` is roughly "how many e-foldings per
 * second" — higher is snappier. Unlike `lerp(a, b, 0.1)` this behaves the same
 * at 30fps and 144fps.
 */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

export type Ease = (t: number) => number;

export const easing = {
  linear: (t: number) => t,
  inQuad: (t: number) => t * t,
  outQuad: (t: number) => 1 - (1 - t) * (1 - t),
  inCubic: (t: number) => t * t * t,
  outCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  inOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  outExpo: (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  inOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  /** Actual gravity: distance is quadratic in time. Nothing reads as weight
   *  like the real curve does. */
  gravity: (t: number) => t * t,
  /** Lands with a whisper of overshoot — good for "arriving" moves. */
  outBack: (t: number) => {
    const c = 1.18;
    return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  },
} satisfies Record<string, Ease>;

export type Keyframe = {
  /** Position on the driving progress axis, 0..1. Must ascend. */
  at: number;
  value: number;
  /** Easing applied on the way *into* this keyframe. */
  ease?: Ease;
};

/**
 * Samples a keyframe track at progress `p`.
 *
 * This is the backbone of the whole choreography: every animated quantity in
 * the experience (seed height, camera dolly, caption opacity) is expressed as
 * a track over the same global progress value, which is what keeps the DOM and
 * the 3D scene locked together. Adding a storyboard beat later means appending
 * keyframes, not rewriting the driver.
 */
export function track(keys: Keyframe[], p: number): number {
  if (keys.length === 0) return 0;
  if (p <= keys[0].at) return keys[0].value;

  const last = keys[keys.length - 1];
  if (p >= last.at) return last.value;

  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (p > b.at) continue;
    const a = keys[i - 1];
    const t = invLerp(a.at, b.at, p);
    return lerp(a.value, b.value, (b.ease ?? easing.inOutCubic)(t));
  }

  return last.value;
}

/**
 * Trapezoid window — ramps up over `[a, b]`, holds at 1 across `[b, c]`, ramps
 * back down over `[c, d]`. Used for caption and overlay visibility so that a
 * beat can breathe before the next one takes over.
 */
export function window4(p: number, a: number, b: number, c: number, d: number): number {
  if (p <= a || p >= d) return 0;
  if (p < b) return easing.outCubic(invLerp(a, b, p));
  if (p <= c) return 1;
  return 1 - easing.inCubic(invLerp(c, d, p));
}
