"use client";

import { useCallback } from "react";

import { clamp, window4 } from "@/lib/math";
import { useProgressElement } from "@/lib/scroll/useProgressElement";

/**
 * The only piece of interface in Act I.
 *
 * Something has to say "this responds to scroll", because the opening frame is
 * deliberately still and would otherwise read as a static image. A hairline
 * with a travelling segment says it without adding a word of copy or competing
 * with the object for attention — which is the brief for frame 01. It runs the
 * length of both chapters and steps aside only at the very end.
 */
export function ScrollIndicator() {
  const apply = useCallback((element: HTMLDivElement, progress: number) => {
    const thumb = element.firstElementChild?.nextElementSibling as HTMLElement | null;
    if (thumb) {
      // The clock runs 0 → 2 across both chapters.
      thumb.style.transform = `translate3d(0, ${clamp(progress / 2) * 62}px, 0)`;
    }
    // Steps aside once the Home has assembled — the page takes over from there.
    element.style.opacity = String(window4(progress, -0.02, -0.005, 3.9, 4.0) * 0.9);
  }, []);

  const ref = useProgressElement<HTMLDivElement>(apply);

  return (
    <div ref={ref} className="scroll-indicator beat" aria-hidden="true">
      <span className="scroll-indicator__rail" />
      <span className="scroll-indicator__thumb" />
    </div>
  );
}
