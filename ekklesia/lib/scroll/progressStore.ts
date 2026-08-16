/**
 * The single source of truth for "where are we in the narrative".
 *
 * Why this exists instead of React state: scrubbing writes a new value on every
 * animation frame. Routing that through `useState` would re-render the whole
 * component tree ~60 times a second and the experience would stutter as soon as
 * the scene gets heavy. So the value lives in a plain mutable object:
 *
 *   - the WebGL layer *pulls* it inside `useFrame` (no subscription at all)
 *   - the DOM layer *pushes* off `subscribe`, writing styles imperatively
 *
 * Both read the identical number in the same frame, which is what keeps the
 * HTML captions welded to the 3D choreography.
 */

type Listener = (progress: number) => void;

const listeners = new Set<Listener>();

const state = {
  /** Raw value written by ScrollTrigger. */
  raw: 0,
  /** Damped value published to consumers — this is the one to animate with. */
  progress: 0,
  /** Signed scroll velocity, useful for direction-aware effects later. */
  velocity: 0,
};

function emit() {
  for (const listener of listeners) listener(state.progress);
}

export const progressStore = {
  /** Read the damped narrative progress, 0..1. */
  get: () => state.progress,
  getRaw: () => state.raw,
  getVelocity: () => state.velocity,

  /** Called by ScrollTrigger's `onUpdate`. */
  setRaw(value: number) {
    state.raw = value;
  },

  /**
   * Advance the damped value toward the raw one. Driven from a single ticker so
   * that every consumer sees the same value in the same frame.
   *
   * `lambda === Infinity` snaps instantly (reduced-motion path).
   */
  advance(dt: number, lambda: number) {
    const previous = state.progress;
    state.progress = Number.isFinite(lambda)
      ? previous + (state.raw - previous) * (1 - Math.exp(-lambda * dt))
      : state.raw;

    state.velocity = dt > 0 ? (state.progress - previous) / dt : 0;

    // Snap out the last sliver so idle frames settle exactly on the target.
    if (Math.abs(state.raw - state.progress) < 0.00005) {
      state.progress = state.raw;
    }

    if (state.progress !== previous) emit();
  },

  /** Force-publish, e.g. on mount so the first paint is already correct. */
  sync() {
    state.progress = state.raw;
    emit();
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(state.progress);
    return () => {
      listeners.delete(listener);
    };
  },
};
