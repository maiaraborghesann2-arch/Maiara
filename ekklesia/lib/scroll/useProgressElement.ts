"use client";

import { useEffect, useRef } from "react";

import { subscribeStage } from "./stage";

/**
 * Binds a DOM element to the stage clock (0 → 1 Act I, 1 → 2 Act II).
 *
 * `apply` runs on every scroll frame and writes styles *directly* — no state,
 * no re-render, no reconciliation. This is the DOM-side twin of `useFrame` in
 * the 3D layer, and because both read the same store in the same frame, a
 * caption fades on exactly the beat the seed turns.
 *
 * `apply` must be referentially stable (wrap it in `useCallback`), otherwise
 * the subscription churns on every render.
 */
export function useProgressElement<T extends HTMLElement>(
  apply: (element: T, progress: number) => void,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    return subscribeStage((progress) => apply(element, progress));
  }, [apply]);

  return ref;
}
