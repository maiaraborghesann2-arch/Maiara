import { createElement, useLayoutEffect, useRef } from 'react';
import type { ElementType, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';

gsap.registerPlugin(ScrollTrigger);

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  delay?: number;
  y?: number;
  [key: string]: unknown; // pass-through for data-* attributes etc.
}

/** Fade/slide-up once when the element scrolls into view (fade-only under reduced motion). */
export function Reveal({ children, as = 'div', className = '', delay = 0, y = 36, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const tween = gsap.fromTo(
      el,
      { autoAlpha: 0, y: reduced ? 0 : y },
      {
        autoAlpha: 1,
        y: 0,
        duration: reduced ? 0.5 : 0.9,
        delay,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      },
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [delay, y]);

  return createElement(as, { ref, className, ...rest }, children);
}
