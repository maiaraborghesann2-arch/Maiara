import { createProgressStore, progressStore, type Listener } from "./progressStore";

/** Act II. Its scroll track begins exactly where Act I's ends. */
export const actTwoStore = createProgressStore();

/**
 * The stage clock: one continuous number across the whole piece.
 *
 * `0 → 1` is Act I, `1 → 2` is Act II. Two adjacent scroll tracks each report
 * their own `0..1`, and summing them gives a value that never jumps at the
 * boundary — which is what lets the camera keep descending through the surface
 * without a cut.
 *
 * The reason it is a sum of two stores rather than one long track: Act I is
 * approved. Rescaling its track would have meant rewriting every keyframe in
 * its choreography, and any arithmetic slip there would show up as a change to
 * a composition that is already signed off. Sampling below `1` is byte-for-byte
 * what it was before Act II existed.
 */
export function stageProgress(): number {
  return progressStore.get() + actTwoStore.get();
}

/** Subscribe to the stage clock. Fires when either chapter advances. */
export function subscribeStage(listener: Listener) {
  const emit = () => listener(stageProgress());
  const offOne = progressStore.subscribe(emit);
  const offTwo = actTwoStore.subscribe(emit);
  return () => {
    offOne();
    offTwo();
  };
}
