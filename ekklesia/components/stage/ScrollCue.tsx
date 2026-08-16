"use client";

import { useCallback } from "react";

import { window4 } from "@/lib/math";
import { useProgressElement } from "@/lib/scroll/useProgressElement";

/**
 * The only instruction the piece gives. It has to exist: nothing on screen
 * moves until the user scrolls, so without a cue the first frame reads as a
 * static image rather than the start of something.
 */
export function ScrollCue() {
  const apply = useCallback((element: HTMLDivElement, progress: number) => {
    const value = window4(progress, -0.01, 0.02, 0.03, 0.09);
    element.style.opacity = String(value);
    element.style.visibility = value < 0.004 ? "hidden" : "visible";
  }, []);

  const ref = useProgressElement<HTMLDivElement>(apply);

  return (
    <div ref={ref} className="scroll-cue beat">
      <span>role para começar</span>
      <span className="scroll-cue__line" aria-hidden="true" />
    </div>
  );
}
