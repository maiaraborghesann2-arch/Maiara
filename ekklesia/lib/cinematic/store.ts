import { createProgressStore, type Listener } from "@/lib/scroll/progressStore";

/**
 * The opening's progress, `0..1` across its own section.
 *
 * Reuses the existing store rather than introducing a second animation system:
 * `SmoothScroll` already owns the one ticker in the application, advances this
 * with the same `dt` it gives Lenis, and the damping that makes the piece feel
 * unhurried is the same damping the rest of the site was built on.
 */
export const cinematicStore = createProgressStore();

export function subscribeCinematic(listener: Listener) {
  return cinematicStore.subscribe(listener);
}
