import { useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import './RouteCameraTransition.css';

/**
 * Wraps the routed viewport in a GSAP-driven "camera angle change" pivot —
 * a brief rotateY + scale flourish (~400ms) fired on every route change,
 * layered on top of the existing AnimatePresence crossfade in <PageShell />
 * rather than replacing it. Keeps route enter/exit orchestration (and
 * therefore Lenis/scroll-position handling) untouched.
 */
export function RouteCameraTransition({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const first = useRef(true);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = stageRef.current;
    if (!el || prefersReducedMotion()) return;

    gsap
      .timeline({ defaults: { transformPerspective: 1400, transformOrigin: '50% 50%' } })
      .fromTo(el, { rotateY: 0, scale: 1 }, { rotateY: -7, scale: 0.97, duration: 0.18, ease: 'power2.in' })
      .set(el, { rotateY: 7 })
      .to(el, { rotateY: 0, scale: 1, duration: 0.24, ease: 'power2.out' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="route-viewport">
      <div ref={stageRef} className="route-stage">
        {children}
      </div>
    </div>
  );
}
