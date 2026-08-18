import * as THREE from "three";

/**
 * Cross-component scene state, shared the same way narrative progress is:
 * a plain mutable object read inside `useFrame`, never React state.
 *
 * The backdrop needs to know where the seed is on screen in order to put the
 * light pool behind it and the cast shadow beneath it. Passing that through
 * props would re-render the tree every frame; recomputing it from the
 * choreography would duplicate the responsive hero-anchor logic that only
 * `Seed` has. So the seed writes, the backdrop reads.
 *
 * The backdrop renders first (via `renderOrder`) but its `useFrame` runs after
 * the seed's, so it reads the current frame's position, not a stale one.
 */
export const sceneState = {
  /** World-space position of the seed, written every frame by `Seed`. */
  seedPosition: new THREE.Vector3(),
  /** Current uniform scale of the seed, for sizing the light pool. */
  seedScale: 0.1,
};
