"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { progressStore } from "@/lib/scroll/progressStore";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/** How fast the damped progress chases the raw scroll position. */
const DAMP_LAMBDA = 7.5;

/**
 * Owns the one and only animation loop of the experience.
 *
 * Everything time-based hangs off GSAP's ticker here — Lenis' inertia,
 * ScrollTrigger's recalculation, and the progress damping — in that order.
 * Keeping them in a single loop is what guarantees the 3D scene and the HTML
 * overlay are reading the same progress value within the same frame; two
 * independent rAF loops would let them drift by a frame and the captions would
 * visibly lag the seed.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const lenis = reducedMotion
      ? null
      : new Lenis({
          duration: 1.15,
          easing: (t: number) => 1 - Math.pow(1 - t, 3),
          // Touch devices already have native inertia; doubling it feels soupy.
          syncTouch: false,
        });

    lenis?.on("scroll", ScrollTrigger.update);

    const lambda = reducedMotion ? Number.POSITIVE_INFINITY : DAMP_LAMBDA;

    const tick = (time: number, deltaMs: number) => {
      lenis?.raf(time * 1000);
      progressStore.advance(Math.min(deltaMs, 50) / 1000, lambda);
    };

    gsap.ticker.add(tick);
    // Without this, GSAP "catches up" after a stall and the scrub jumps.
    gsap.ticker.lagSmoothing(0);

    progressStore.sync();

    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
    };
  }, [reducedMotion]);

  return <>{children}</>;
}
