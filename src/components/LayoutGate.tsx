import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Logo } from './Logo';
import './LayoutGate.css';

/**
 * Opaque branded veil covering the app from the moment the routed content
 * mounts until layout is actually settled — then one clean 0.6s fade.
 *
 * Rationale: individual elements (web-font-dependent text, the lazy-mounted
 * ParticleSphere, grid measurements) each settle on their own schedule, and
 * patching every mount ordering separately kept regressing. Instead nothing
 * is revealed until ALL of it is ready:
 *   - document.fonts.ready (headline/nav metrics final — no font-swap shift)
 *   - three stacked animation frames (React commit + browser layout flushed)
 *   - a minimum hold so the reveal never strobes on fast loads
 *
 * The veil sits BELOW the loading screen (z-overlay - 10): on first visit
 * the loading screen plays on top and this veil is what its fade-out
 * reveals; on session revisits (loading screen skipped) the veil alone
 * covers the settling layout. Either path reveals only settled content.
 */

const MIN_HOLD_MS = 350;

export function LayoutGate() {
  const [gone, setGone] = useState(false);
  const veilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const started = performance.now();

    const raf = () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

    (async () => {
      await document.fonts.ready.catch(() => {});
      await raf();
      await raf();
      await raf();
      const elapsed = performance.now() - started;
      if (elapsed < MIN_HOLD_MS) {
        await new Promise((r) => setTimeout(r, MIN_HOLD_MS - elapsed));
      }
      if (cancelled) return;
      const veil = veilRef.current;
      if (!veil) {
        setGone(true);
        return;
      }
      gsap.to(veil, {
        autoAlpha: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => setGone(true),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (gone) return null;

  return (
    <div ref={veilRef} className="layout-gate" aria-hidden="true">
      <Logo size={44} monogramOnly />
    </div>
  );
}
