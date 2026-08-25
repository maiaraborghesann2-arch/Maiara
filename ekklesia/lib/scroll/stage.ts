import { createProgressStore, progressStore, type Listener } from "./progressStore";

/** Act II. Its scroll track begins exactly where Act I's ends. */
export const actTwoStore = createProgressStore();
/** Act III. Same again — it begins where Act II's ends. */
export const actThreeStore = createProgressStore();
/** Act IV. And again. */
export const actFourStore = createProgressStore();

/**
 * The stage clock: one continuous number across the whole piece.
 *
 * `0 → 1` is Act I, `1 → 2` is Act II, `2 → 3` is Act III, `3 → 4` is Act IV.
 * Adjacent scroll
 * tracks each report their own `0..1`, and summing them gives a value that
 * never jumps at a boundary — which is what lets the camera keep descending through the surface
 * without a cut.
 *
 * The reason it is a sum of two stores rather than one long track: Act I is
 * approved. Rescaling its track would have meant rewriting every keyframe in
 * its choreography, and any arithmetic slip there would show up as a change to
 * a composition that is already signed off. Sampling below `1` is byte-for-byte
 * what it was before Act II existed.
 */
export function stageProgress(): number {
  return (
    progressStore.get() + actTwoStore.get() + actThreeStore.get() + actFourStore.get()
  );
}

/** Subscribe to the stage clock. Fires when either chapter advances. */
export function subscribeStage(listener: Listener) {
  const emit = () => listener(stageProgress());
  const offOne = progressStore.subscribe(emit);
  const offTwo = actTwoStore.subscribe(emit);
  const offThree = actThreeStore.subscribe(emit);
  const offFour = actFourStore.subscribe(emit);
  return () => {
    offOne();
    offTwo();
    offThree();
    offFour();
  };
}
