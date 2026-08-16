"use client";

import { useCallback } from "react";

import { window4 } from "@/lib/math";
import { useProgressElement } from "@/lib/scroll/useProgressElement";
import { Mark } from "@/components/brand/Mark";

/**
 * Frame 04 — the Home the seed arrives at.
 *
 * Deliberately real HTML: a proper `<h1>`, a real `<button>`, real focus rings.
 * The seed beside it is the WebGL object from the shared canvas, so the two
 * layers compose without either giving up what it is good at. Rendering this
 * headline into a texture would have cost indexing, text selection, and every
 * assistive technology.
 */
export function Hero() {
  const applyBlock = useCallback(
    (element: HTMLDivElement, progress: number) => {
      const value = window4(progress, 0.76, 0.93, 1.01, 1.02);
      element.style.opacity = String(value);
      element.style.transform = `translate3d(0, ${(1 - value) * 26}px, 0)`;
      // Keep the CTA out of the tab order until the Home has actually arrived.
      element.style.pointerEvents = value > 0.85 ? "auto" : "none";
      element.style.visibility = value < 0.004 ? "hidden" : "visible";
      element.inert = value <= 0.85;
    },
    [],
  );

  const applyHeader = useCallback(
    (element: HTMLElement, progress: number) => {
      const value = window4(progress, 0.72, 0.86, 1.01, 1.02);
      element.style.opacity = String(value);
      element.style.transform = `translate3d(0, ${(1 - value) * -12}px, 0)`;
      element.style.pointerEvents = value > 0.85 ? "auto" : "none";
      element.style.visibility = value < 0.004 ? "hidden" : "visible";
      element.inert = value <= 0.85;
    },
    [],
  );

  const blockRef = useProgressElement<HTMLDivElement>(applyBlock);
  const headerRef = useProgressElement<HTMLElement>(applyHeader);

  return (
    <>
      <header ref={headerRef} className="site-header beat">
        <a className="site-header__brand" href="#">
          <Mark size={26} />
          <span className="site-header__word">
            <strong>Ekklesia</strong>
            <em>Connect</em>
          </span>
        </a>

        <button type="button" className="site-header__menu" aria-label="Abrir menu">
          <span />
          <span />
          <span />
        </button>
      </header>

      <div ref={blockRef} className="hero beat">
        <h1 className="hero__title">
          Pequenos começos.
          <br />
          Grandes frutos.
        </h1>

        <p className="hero__lede">
          Conteúdo que transforma vidas
          <br />e gera crescimento real.
        </p>

        <button type="button" className="hero__cta">
          Explorar recursos
        </button>
      </div>
    </>
  );
}
