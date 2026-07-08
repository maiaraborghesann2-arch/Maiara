import { createElement, useEffect, useMemo, useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import './LiquidText.css';

const RADIUS = 130; // px — cursor proximity that wakes a character
const MAX_LIFT = 8; // px — subtle: luxury ripple, not glitch art
const MAX_SKEW = 4; // deg
const MAX_SCALE = 1.045;

interface LiquidTextProps {
  as?: ElementType;
  children: string;
  className?: string;
  /** render emphasised words in italic (display serif convention) */
  italic?: boolean;
}

interface CharState {
  el: HTMLSpanElement;
  cx: number;
  cy: number;
  active: boolean;
}

/**
 * Headline text with a gentle per-character "liquid" ripple that follows
 * cursor proximity and settles back with elastic easing.
 */
export function LiquidText({ as = 'h1', children, className = '', italic = false }: LiquidTextProps) {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reduced) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const chars: CharState[] = [];
    root.querySelectorAll<HTMLSpanElement>('.liquid-char').forEach((el) => {
      chars.push({ el, cx: 0, cy: 0, active: false });
    });
    if (chars.length === 0) return;

    const measure = () => {
      for (const c of chars) {
        const r = c.el.getBoundingClientRect();
        c.cx = r.left + r.width / 2;
        c.cy = r.top + r.height / 2;
      }
    };
    measure();

    let raf = 0;
    let mx = -1e6;
    let my = -1e6;
    let needsMeasure = false;

    const update = () => {
      raf = 0;
      if (needsMeasure) {
        measure();
        needsMeasure = false;
      }
      for (const c of chars) {
        const dx = mx - c.cx;
        const dy = my - c.cy;
        const d = Math.hypot(dx, dy);
        if (d < RADIUS) {
          const t = 1 - d / RADIUS;
          c.active = true;
          gsap.to(c.el, {
            y: -t * MAX_LIFT,
            skewX: (dx / (d || 1)) * t * -MAX_SKEW,
            scale: 1 + t * (MAX_SCALE - 1),
            duration: 0.4,
            ease: 'power3.out',
            overwrite: 'auto',
          });
        } else if (c.active) {
          c.active = false;
          gsap.to(c.el, {
            y: 0,
            skewX: 0,
            scale: 1,
            duration: 1.1,
            ease: 'elastic.out(1, 0.35)',
            overwrite: 'auto',
          });
        }
      }
    };

    const onMove = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) raf = requestAnimationFrame(update);
    };
    const invalidate = () => {
      needsMeasure = true;
      if (!raf) raf = requestAnimationFrame(update);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('resize', invalidate);
    window.addEventListener('scroll', invalidate, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('scroll', invalidate);
      if (raf) cancelAnimationFrame(raf);
      chars.forEach((c) => gsap.killTweensOf(c.el));
    };
  }, [reduced, children]);

  const content: ReactNode = useMemo(() => {
    if (reduced) return children;
    return children.split(' ').map((word, wi, arr) => (
      <span className="liquid-word" key={`${word}-${wi}`} aria-hidden="true">
        {Array.from(word).map((ch, ci) => (
          <span className="liquid-char" key={ci}>
            {ch}
          </span>
        ))}
        {wi < arr.length - 1 ? ' ' : null}
      </span>
    ));
  }, [children, reduced]);

  return createElement(
    as,
    {
      ref: rootRef,
      className: `liquid-text ${italic ? 'u-italic' : ''} ${className}`,
      'data-liquid-text': true,
      'aria-label': children,
    },
    content,
  );
}
