import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface PageShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Route-level wrapper: shared page transition (exit fade+scale-down 0.4s,
 * enter fade+scale-up 0.5s after the exit completes) plus scroll reset and
 * a ScrollTrigger re-measure once the enter transform settles.
 */
export function PageShell({ children, className = '' }: PageShellProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.main
      className={className}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{
        opacity: 1,
        scale: 1,
        transition: { duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] },
      }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.4, ease: [0.65, 0, 0.35, 1] } }}
      onAnimationComplete={() => ScrollTrigger.refresh()}
    >
      {children}
    </motion.main>
  );
}
