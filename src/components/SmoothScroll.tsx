import { useEffect } from 'react';
import type { ReactNode } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';

gsap.registerPlugin(ScrollTrigger);

/**
 * Lenis inertial scrolling — mounted ONCE at the app root (App.tsx wraps the
 * whole tree in <SmoothScroll>), never remounted across route changes.
 *
 * ScrollTrigger sync contract (drift-proof):
 *  - Lenis is stepped exclusively by the GSAP ticker (single rAF source),
 *  - every Lenis scroll event calls ScrollTrigger.update(),
 *  - lagSmoothing is disabled so the two never disagree after a long frame.
 * The hero's pinned expansion timeline and route transitions both ride this.
 */
/**
 * The live Lenis instance (null under reduced motion / before mount).
 * Route containers use this to reset scroll IMMEDIATELY on enter —
 * calling window.scrollTo directly would fight Lenis, which then lerps
 * from the previous page's offset and makes the new page visibly slide
 * into place.
 */
export let lenisInstance: Lenis | null = null;

export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.25, // clearly eased glide (spec range 1.1–1.3)
      // expo-style ease-out — same settle character as --ease-out-soft
      // (cubic-bezier(0.22, 1, 0.36, 1)) used across the site's UI motion
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });

    lenisInstance = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisInstance = null;
    };
  }, []);

  return <>{children}</>;
}
