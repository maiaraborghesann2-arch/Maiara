"use client";

import { useEffect } from "react";

/**
 * Reveals below the fold.
 *
 * Deliberately not GSAP, and deliberately not ScrollTrigger. The opening
 * already owns a ScrollTrigger, a Lenis instance and the single GSAP ticker;
 * adding a timeline per section would put a second system on the same scroll
 * and give the two of them opportunities to disagree about layout on resize.
 *
 * What the content actually needs is far less than that: a one-way "this has
 * been seen" flag. An IntersectionObserver sets `data-shown` on the element and
 * unobserves it, and the transition itself is a CSS rule. No work happens on
 * the scroll thread at all, and nothing is animated per frame.
 *
 * One observer for the whole page rather than one per element — the callback
 * receives every crossing in a batch, so the cost does not grow with the number
 * of sections.
 *
 * Under `prefers-reduced-motion` the observer is never created and every
 * element is marked shown immediately: the page arrives complete instead of
 * arriving quickly. The CSS keeps the same rule for both, so a reader with
 * motion reduced sees exactly the same finished layout.
 */
export function useReveal(): void {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (targets.length === 0) return;

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still || typeof IntersectionObserver === "undefined") {
      for (const el of targets) el.dataset.shown = "true";
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.shown = "true";
          observer.unobserve(entry.target);
        }
      },
      {
        // A little way in, so things reveal as they arrive rather than the
        // instant a single pixel clears the fold.
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.05,
      },
    );

    for (const el of targets) {
      // Anything already on screen at mount — the first section after the
      // opening, or a deep link — should simply be there, not animate in.
      if (el.getBoundingClientRect().top < window.innerHeight) el.dataset.shown = "true";
      else observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);
}
