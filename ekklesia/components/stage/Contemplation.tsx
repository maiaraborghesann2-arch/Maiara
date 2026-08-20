"use client";

import { useCallback } from "react";

import { window4 } from "@/lib/math";
import { useProgressElement } from "@/lib/scroll/useProgressElement";

/**
 * Frame 09 — the pause.
 *
 * The camera has all but stopped and the root system is fully out; this is the
 * one moment in the piece where nothing is happening, and the words are what
 * the moment is for. So they are set as a line of a book rather than as a
 * section of a website: no rule, no eyebrow, no button, and a scrim soft enough
 * that you would not notice it if you were not looking for it.
 *
 * The scrim earns its place — pale roots crossing behind display serif at this
 * size would cut the strokes apart, and dimming the roots instead would take
 * away the thing the reader is being asked to contemplate.
 */
export function Contemplation() {
  const apply = useCallback((element: HTMLDivElement, progress: number) => {
    const parts = element.querySelectorAll<HTMLElement>("[data-a]");
    for (const part of parts) {
      const a = Number(part.dataset.a);
      const b = Number(part.dataset.b);
      const value = window4(progress, a, b, 2.05, 2.06);
      part.style.opacity = String(value);
      part.style.transform = `translate3d(0, ${(1 - value) * 18}px, 0)`;
    }

    const scrim = window4(progress, 1.87, 1.95, 2.05, 2.06);
    element.style.setProperty("--scrim", String(scrim));
    // The container carries `beat`, which starts at zero opacity for the
    // no-JavaScript path. Its children do their own fading, so the container
    // itself has to be turned on explicitly or nothing ever shows.
    element.style.opacity = "1";
    element.style.visibility = scrim < 0.004 ? "hidden" : "visible";
  }, []);

  const ref = useProgressElement<HTMLDivElement>(apply);

  return (
    <div ref={ref} className="contemplation beat">
      <p className="contemplation__lead" data-a="1.9" data-b="1.965">
        Nem todo crescimento acontece à vista.
      </p>
      <p className="contemplation__note" data-a="1.925" data-b="1.99">
        Antes de romper a superfície, existe um processo silencioso
        acontecendo por baixo.
      </p>
    </div>
  );
}
