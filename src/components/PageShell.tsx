import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const LUX_EASE = [0.65, 0, 0.35, 1] as const;

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
 */
export function PageShell({ children, className = '' }: PageShellProps) {
  const reduced = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const variants = reduced
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.35 } },
        exit: { opacity: 0, transition: { duration: 0.25 } },
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
      onAnimationComplete={() => ScrollTrigger.refresh()}
    >
      {children}
    </motion.main>
  );
}
