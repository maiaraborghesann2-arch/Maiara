"use client";

import { useCallback } from "react";

import { window4 } from "@/lib/math";
import { useProgressElement } from "@/lib/scroll/useProgressElement";
import { Mark } from "@/components/brand/Mark";

/**
 * Frame 04 — the Home the grain lands in.
 *
 * The composition is vertical and centred, stacked on the same axis the grain
 * fell down: title, lede, action, a hairline, and then the grain itself resting
 * on the earth at the foot of the column. It is not decoration placed beside
 * copy — it is the thing the copy stands on, which is the whole reason the
 * trajectory is a straight line.
 *
 * Real HTML throughout: a proper `<h1>`, a real `<button>`, real focus rings.
 * Each line rises out of a clipped box instead of fading. Display serif at this
 * size fades badly — the strokes go grey and muddy halfway — where a wipe keeps
 * every weight crisp the whole way in. On the way out, in Act II, the same mask
 * wipes them back down as the camera drops toward the soil, so the Home leaves
 * in the direction the descent is already going.
 */
export function Hero() {
  const applyStagger = useCallback((element: HTMLElement, progress: number) => {
    const parts = element.querySelectorAll<HTMLElement>("[data-a]");
    for (const part of parts) {
      const a = Number(part.dataset.a);
      const b = Number(part.dataset.b);
      const value = window4(progress, a, b, 1.015, 1.075);
      const masked = part.classList.contains("hero__line");

      part.style.opacity = String(masked ? Math.min(1, value * 1.6) : value);
      part.style.transform = masked
        ? `translate3d(0, ${(1 - value) * 104}%, 0)`
        : `translate3d(0, ${(1 - value) * 16}px, 0)`;
    }
  }, []);

  const applyBlock = useCallback(
    (element: HTMLDivElement, progress: number) => {
      const value = window4(progress, 0.8, 0.93, 1.015, 1.075);
      element.style.opacity = "1";
      element.style.visibility = value < 0.004 ? "hidden" : "visible";
      // Keep the action out of the tab order until the Home has arrived.
      element.inert = value <= 0.85;
      applyStagger(element, progress);
    },
    [applyStagger],
  );

  const applyHeader = useCallback((element: HTMLElement, progress: number) => {
    const value = window4(progress, 0.8, 0.9, 1.015, 1.075);
    element.style.opacity = String(value);
    element.style.transform = `translate3d(0, ${(1 - value) * -14}px, 0)`;
    element.style.visibility = value < 0.004 ? "hidden" : "visible";
    element.inert = value <= 0.85;
  }, []);

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
          <span className="site-header__menu-label">Menu</span>
          <span className="site-header__menu-icon" aria-hidden="true">
            <span />
            <span />
          </span>
        </button>
      </header>

      <div ref={blockRef} className="hero beat">
        <div className="hero__column">
          <p className="hero__kicker" data-a="0.835" data-b="0.915">
            <span className="hero__rule" aria-hidden="true" />
            Jornada de fé e conhecimento
            <span className="hero__rule" aria-hidden="true" />
          </p>

          <h1 className="hero__title">
            <span className="hero__mask">
              <span className="hero__line" data-a="0.85" data-b="0.93">
                Pequenos começos.
              </span>
            </span>
            <span className="hero__mask">
              <span className="hero__line" data-a="0.868" data-b="0.948">
                Grandes frutos.
              </span>
            </span>
          </h1>

          <p className="hero__lede" data-a="0.9" data-b="0.97">
            Conteúdo que transforma vidas e gera crescimento real.
          </p>

          <div className="hero__actions" data-a="0.92" data-b="0.985">
            <button type="button" className="hero__cta">
              Explorar recursos
            </button>
          </div>

          {/*
            Runs from the action down toward the grain. The only job it has is to
            say the two belong to one column — without it the type reads as
            floating above an unrelated object.
          */}
          <span className="hero__descender" data-a="0.94" data-b="1.0" aria-hidden="true" />
        </div>
      </div>
    </>
  );
}
