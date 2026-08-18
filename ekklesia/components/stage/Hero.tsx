"use client";

import { useCallback } from "react";

import { window4 } from "@/lib/math";
import { useProgressElement } from "@/lib/scroll/useProgressElement";
import { Mark } from "@/components/brand/Mark";

/**
 * Frame 04 — the Home the seed arrives at.
 *
 * Deliberately real HTML: a proper `<h1>`, a real `<button>`, real focus rings.
 * The seed beside it is the WebGL object from the shared canvas, and the two are
 * bound together by the backdrop, which puts its light pool and cast shadow at
 * the seed's screen position — so the object sits *in* the page's lighting
 * rather than on top of it.
 *
 * The reveal is staggered and masked: each headline line rises out of a clipped
 * box instead of fading in. Display serif at this size fades badly — the strokes
 * go grey and muddy — where a wipe keeps every weight crisp the whole way in.
 */
export function Hero() {
  const applyStagger = useCallback((element: HTMLElement, progress: number) => {
    const parts = element.querySelectorAll<HTMLElement>("[data-a]");
    for (const part of parts) {
      const a = Number(part.dataset.a);
      const b = Number(part.dataset.b);
      const value = window4(progress, a, b, 1.01, 1.02);
      const masked = part.classList.contains("hero__line");

      part.style.opacity = String(masked ? Math.min(1, value * 1.6) : value);
      part.style.transform = masked
        ? `translate3d(0, ${(1 - value) * 104}%, 0)`
        : `translate3d(0, ${(1 - value) * 18}px, 0)`;
    }
  }, []);

  const applyBlock = useCallback(
    (element: HTMLDivElement, progress: number) => {
      const value = window4(progress, 0.74, 0.9, 1.01, 1.02);
      element.style.opacity = "1";
      element.style.visibility = value < 0.004 ? "hidden" : "visible";
      // Keep the CTA out of the tab order until the Home has actually arrived.
      element.inert = value <= 0.85;
      applyStagger(element, progress);
    },
    [applyStagger],
  );

  const applyHeader = useCallback(
    (element: HTMLElement, progress: number) => {
      const value = window4(progress, 0.72, 0.88, 1.01, 1.02);
      element.style.opacity = String(value);
      element.style.transform = `translate3d(0, ${(1 - value) * -14}px, 0)`;
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
          {/* Three masks, not two: the storyboard breaks the headline across
              three lines, and one mask per line gives the wipe its stagger. */}
          <span className="hero__mask">
            <span className="hero__line" data-a="0.75" data-b="0.86">
              Pequenos
            </span>
          </span>
          <span className="hero__mask">
            <span className="hero__line" data-a="0.775" data-b="0.885">
              começos.
            </span>
          </span>
          <span className="hero__mask">
            <span className="hero__line" data-a="0.8" data-b="0.91">
              Grandes frutos.
            </span>
          </span>
        </h1>

        <p className="hero__lede" data-a="0.85" data-b="0.95">
          Conteúdo que transforma vidas
          <br />e gera crescimento real.
        </p>

        <button type="button" className="hero__cta" data-a="0.88" data-b="0.97">
          Explorar recursos
        </button>
      </div>
    </>
  );
}
