"use client";

import { CinematicOpening } from "@/components/cinematic/CinematicOpening";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";

/**
 * The page, in one place.
 *
 * There are two entry points into it — the Next route and the standalone
 * preview bundle — and for a while each assembled this tree itself. They
 * drifted twice without anyone noticing, so neither composes it any more.
 *
 * The opening is now the supplied footage, scrubbed by the scroll. The
 * procedural seed-to-plant scene that used to live here is still in the
 * repository — `components/experience/*`, `lib/scroll/choreography.ts` and the
 * act stores in `lib/scroll/stage.ts` — but nothing imports it, so it is out of
 * the bundle as well as out of the frame. There is exactly one visual system
 * running.
 */
export function Experience() {
  return (
    <SmoothScroll>
      <CinematicOpening />

      <main className="chapter" id="conteudo">
        <p className="chapter__eyebrow">Ekklesia Connect</p>
        <h1 className="chapter__title">Pequenos começos. Grandes frutos.</h1>
        <p className="chapter__body">
          Conteúdo que transforma vidas e gera crescimento real — formação,
          comunidade e prática para quem constrói a igreja no dia a dia.
        </p>
        <a className="chapter__cta" href="#recursos">
          Explorar recursos
        </a>
      </main>
    </SmoothScroll>
  );
}
