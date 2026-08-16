"use client";

import { useCallback } from "react";

import { window4 } from "@/lib/math";
import { useProgressElement } from "@/lib/scroll/useProgressElement";

type Props = {
  lines: readonly string[];
  /** Trapezoid stops on the Act I track: fade in a→b, hold b→c, fade out c→d. */
  a: number;
  b: number;
  c: number;
  d: number;
};

/**
 * The italic narration beneath each frame ("A semente existe. Pequena.
 * Silenciosa. Cheia de potencial.").
 *
 * Real HTML text, not a texture: it stays selectable, translatable and
 * available to screen readers, while its visibility is scrubbed by the same
 * progress value that drives the seed.
 */
export function Caption({ lines, a, b, c, d }: Props) {
  const apply = useCallback(
    (element: HTMLParagraphElement, progress: number) => {
      const value = window4(progress, a, b, c, d);
      element.style.opacity = String(value);
      element.style.transform = `translate3d(0, ${(1 - value) * 14}px, 0)`;
      element.style.visibility = value < 0.004 ? "hidden" : "visible";
    },
    [a, b, c, d],
  );

  const ref = useProgressElement<HTMLParagraphElement>(apply);

  return (
    <p ref={ref} className="caption beat">
      {lines.map((line, index) => (
        <span key={index}>{line}</span>
      ))}
    </p>
  );
}
