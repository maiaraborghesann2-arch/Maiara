import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import gsap from 'gsap';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import './CustomCursor.css';

const RING_SIZE = 32;
const DOT_SIZE = 8;
const MAGNETIC_MAX_SHIFT = 8; // px — how far a [data-magnetic] element leans toward the cursor
const RING_HOVER_SCALE = 2.5;

/**
 * Custom cursor: champagne dot tracking the pointer 1:1, brushed-gold ring
 * trailing on a spring. Elements with [data-magnetic] pull toward the cursor.
 * Renders nothing on coarse pointers (touch) and under reduced motion.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);

  const dotX = useMotionValue(-100);
  const dotY = useMotionValue(-100);
  const ringX = useSpring(dotX, { stiffness: 300, damping: 30 });
  const ringY = useSpring(dotY, { stiffness: 300, damping: 30 });

  const magneticEl = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    if (!fine || prefersReducedMotion()) return;
    setEnabled(true);
    document.body.classList.add('has-custom-cursor');
    return () => document.body.classList.remove('has-custom-cursor');
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const releaseMagnetic = () => {
      const el = magneticEl.current;
      if (!el) return;
      magneticEl.current = null;
      setHovering(false);
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
    };

    const onMove = (e: PointerEvent) => {
      dotX.set(e.clientX);
      dotY.set(e.clientY);
      setVisible(true);

      const target = (e.target as Element | null)?.closest?.('[data-magnetic]');
      const el = target instanceof HTMLElement ? target : null;

      if (el !== magneticEl.current) {
        releaseMagnetic();
        magneticEl.current = el;
        if (el) setHovering(true);
      }

      if (el) {
        // pull the element toward the cursor, clamped
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = gsap.utils.clamp(
          -MAGNETIC_MAX_SHIFT,
          MAGNETIC_MAX_SHIFT,
          (e.clientX - cx) * 0.22,
        );
        const dy = gsap.utils.clamp(
          -MAGNETIC_MAX_SHIFT,
          MAGNETIC_MAX_SHIFT,
          (e.clientY - cy) * 0.22,
        );
        gsap.to(el, { x: dx, y: dy, duration: 0.35, ease: 'power2.out', overwrite: 'auto' });
      }
    };

    const onLeave = () => {
      setVisible(false);
      releaseMagnetic();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [enabled, dotX, dotY]);

  if (!enabled) return null;

  return (
    <div className="cursor-root" aria-hidden="true" data-visible={visible}>
      <motion.div
        className="cursor-ring"
        style={{
          x: ringX,
          y: ringY,
          width: RING_SIZE,
          height: RING_SIZE,
          marginLeft: -RING_SIZE / 2,
          marginTop: -RING_SIZE / 2,
        }}
        animate={{ scale: hovering ? RING_HOVER_SCALE : 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      />
      <motion.div
        className="cursor-dot"
        style={{
          x: dotX,
          y: dotY,
          width: DOT_SIZE,
          height: DOT_SIZE,
          marginLeft: -DOT_SIZE / 2,
          marginTop: -DOT_SIZE / 2,
        }}
      />
    </div>
  );
}
