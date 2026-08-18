"use client";

import { useCallback } from "react";

import { window4 } from "@/lib/math";
import { useProgressElement } from "@/lib/scroll/useProgressElement";
import { Mark } from "@/components/brand/Mark";

/**
 * Frame 04 — the Home the grain lands in.
 *
 * Real HTML: a proper `<h1>`, a real `<button>`, real focus rings. The grain
 * beside it is the WebGL object from the shared canvas, resting on the earth it
 * struck, with its own contact shadow. Neither layer is pretending to be the
 * other.
 *
 * The composition is editorial rather than landing-page: an olive rule and a
 * kicker set the column, the headline breaks across three lines the way the
 * storyboard sets it, and the action pairs a terracotta button with a quiet
 * text link so the block has a foot as well as a head. Depth comes from the
 * lighting behind it, not from more elements.
 *
 * Each line rises out of a clipped box instead of fading. Display serif at this
 * size fades badly — the strokes go grey and muddy halfway — where a wipe keeps
 * every weight crisp the whole way in.
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
        : `translate3d(0, ${(1 - value) * 16}px, 0)`;
    }
  }, []);

  const applyBlock = useCallback(
    (element: HTMLDivElement, progress: number) => {
      const value = window4(progress, 0.8, 0.93, 1.01, 1.02);
      element.style.opacity = "1";
      element.style.visibility = value < 0.004 ? "hidden" : "visible";
      // Keep the actions out of the tab order until the Home has arrived.
      element.inert = value <= 0.85;
      applyStagger(element, progress);
    },
    [applyStagger],
  );

  const applyHeader = useCallback(
    (element: HTMLElement, progress: number) => {
      const value = window4(progress, 0.8, 0.9, 1.01, 1.02);
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
        <div className="hero__column">
          <p className="hero__kicker" data-a="0.835" data-b="0.915">
            <span className="hero__rule" aria-hidden="true" />
            Jornada de fé e conhecimento
          </p>

          <h1 className="hero__title">
            {/* One mask per line: the storyboard breaks the headline across
                three, and per-line masks are what give the wipe its stagger. */}
            <span className="hero__mask">
              <span className="hero__line" data-a="0.85" data-b="0.93">
                Pequenos
              </span>
            </span>
            <span className="hero__mask">
              <span className="hero__line" data-a="0.865" data-b="0.945">
                começos.
              </span>
            </span>
            <span className="hero__mask">
              <span className="hero__line" data-a="0.88" data-b="0.96">
                Grandes frutos.
              </span>
            </span>
          </h1>

          <p className="hero__lede" data-a="0.905" data-b="0.975">
            Conteúdo que transforma vidas e gera crescimento real.
          </p>

          <div className="hero__actions" data-a="0.925" data-b="0.99">
            <button type="button" className="hero__cta">
              Explorar recursos
            </button>
            <a className="hero__link" href="#">
              Conhecer a jornada
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
