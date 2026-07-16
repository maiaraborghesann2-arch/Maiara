import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { lenisInstance } from './SmoothScroll';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const LUX_EASE = [0.65, 0, 0.35, 1] as const;

// The camera-swing transition applies only BETWEEN routes. The very first
// route after boot (revealed by the intro gate) has no previous page to
// swing from — animating transforms there both looks wrong and puts a
// transformed ancestor above the page during its initial layout, which is
// exactly the environment that produced the sphere's wrong-initial-position
// bug. First mount gets a plain opacity reveal with NO transforms at all.
let hasShownARoute = false;

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Route-level wrapper. Page transition reads as a camera pivoting between
 * two angles of the same space: exit rotates away (rotateY -8°, pushed back
 * 100px, fading) while the entering page swings in from the opposite angle,
 * overlapping briefly (AnimatePresence mode="popLayout" in App). Reduced
 * motion falls back to a plain opacity fade. Also resets scroll and
 * re-measures ScrollTriggers once the enter transform settles.
 *
 * IMPORTANT: once the enter animation completes, the inline transform is
 * hard-reset to `none`. Framer Motion otherwise leaves a residual
 * perspective/matrix3d on this <main>, and ANY resting transform here makes
 * it the containing block for position:fixed descendants — silently breaking
 * GSAP ScrollTrigger pinning inside the page (the Home hero's pinned
 * expansion sequence would collapse into dead scroll space).
 */
export function PageShell({ children, className = '' }: PageShellProps) {
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const mainRef = useRef<HTMLElement>(null);
  // captured once at mount: is this the boot route (no transition) or a
  // between-routes navigation (camera swing)?
  const firstRoute = useRef(!hasShownARoute).current;
  useEffect(() => {
    hasShownARoute = true;
  }, []);
  // true once the enter animation has settled — from then on transformTemplate
  // forces framer to emit `transform: none` on EVERY style write, so later
  // re-renders (LayoutGate unmount, language switch, etc.) can never re-apply
  // the residual matrix3d that breaks position:fixed pinning inside the page.
  // The boot route starts settled: it never carries a transform at all.
  const settledRef = useRef(firstRoute);

  // Scroll reset on route enter — the systemic fix for "elements slide into
  // place after the transition reveal". Three things must all hold:
  //  (1) ScrollTrigger.clearScrollMemory(): every ScrollTrigger.refresh()
  //      RESTORES its remembered scroll position afterwards, and refreshes
  //      fire throughout a route change (exit teardown, Reveal mounts,
  //      enter-complete) — without clearing the memory each one resurrects
  //      the PREVIOUS page's scroll offset over any reset we do here.
  //      (This was the actual root cause; the reset itself worked and was
  //      then repeatedly overwritten.)
  //  (2) reset THROUGH Lenis (immediate) — a bare window.scrollTo leaves
  //      Lenis lerping from the old offset, i.e. visible sliding.
  //  (3) useLayoutEffect, so it all happens before the entering page's
  //      first paint. The enter-complete refresh (below) then re-measures
  //      pins against the now-correct scroll 0 and "restores" 0.
  useLayoutEffect(() => {
    ScrollTrigger.clearScrollMemory();
    if (lenisInstance) {
      lenisInstance.scrollTo(0, { immediate: true, force: true });
    }
    window.scrollTo(0, 0);
  }, []);

  const variants = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.35 } },
        exit: { opacity: 0, transition: { duration: 0.25 } },
      }
    : firstRoute
    ? {
        // boot reveal: direct fade, zero transforms — content is already in
        // its final position when the gate closes. Exit keeps the camera
        // swing so navigating AWAY from the first page still transitions.
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.6, ease: LUX_EASE } },
        exit: {
          opacity: 0,
          rotateY: -8,
          z: -100,
          transition: { duration: 0.5, ease: LUX_EASE },
        },
      }
    : {
        initial: { opacity: 0, rotateY: 8, z: -100 },
        animate: {
          opacity: 1,
          rotateY: 0,
          z: 0,
          transition: { duration: 0.6, delay: 0.12, ease: LUX_EASE },
        },
        exit: {
          opacity: 0,
          rotateY: -8,
          z: -100,
          transition: { duration: 0.5, ease: LUX_EASE },
        },
      };

  return (
    <motion.main
      ref={mainRef}
      className={className}
      style={{
        transformPerspective: 1200,
        transformOrigin: '50% 50%',
        width: '100%',
      }}
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transformTemplate={(_, generated) => (settledRef.current ? 'none' : generated)}
      onAnimationStart={(definition) => {
        // exit needs real transforms again (the camera pivot away)
        if (definition === 'exit') settledRef.current = false;
      }}
      onAnimationComplete={(definition) => {
        // ENTER only. Refreshing on exit re-measured (and scroll-restored)
        // against the OUTGOING page — one of the writers that kept
        // resurrecting the old scroll offset during transitions.
        if (definition === 'animate') {
          settledRef.current = true;
          const el = mainRef.current;
          if (el) {
            el.style.transform = 'none'; // immediate; template covers future writes
            el.style.willChange = 'auto';
          }
          ScrollTrigger.refresh();
        }
      }}
    >
      {children}
    </motion.main>
  );
}
