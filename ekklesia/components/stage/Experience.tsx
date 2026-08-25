"use client";

import {
  ACT_FOUR_TRACK_VH,
  ACT_ONE_TRACK_VH,
  ACT_THREE_TRACK_VH,
  ACT_TWO_TRACK_VH,
  STORYBOARD,
} from "@/lib/scroll/acts";
import { ExperienceCanvas } from "@/components/experience/ExperienceCanvas";
import { Overlay } from "@/components/stage/Overlay";
import { ScrollDriver } from "@/components/scroll/ScrollDriver";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";

const remaining = STORYBOARD.filter((frame) => frame.status === "planned");

/**
 * The whole piece, in one place.
 *
 * There are two entry points into it — the Next route and the standalone
 * preview bundle — and for a while each assembled this tree itself. They drifted
 * twice without anyone noticing, most recently badly enough that the shared
 * preview link ended two whole acts early while the dev server was fine: the
 * preview still had two scroll tracks. A chapter is not "added" until it is
 * added in both, and nothing in a build catches a page that is merely shorter
 * than it should be. So neither entry point composes this any more; they render
 * it.
 */
export function Experience() {
  return (
    <SmoothScroll>
      {/* Mounted once, never torn down — the camera move is continuous. */}
      <ExperienceCanvas />
      <Overlay />

      {/*
        One track per chapter, laid end to end. Scrolling them *is* the
        timeline; `stageProgress()` sums them into the single continuous clock
        the camera follows across every boundary.
      */}
      <ScrollDriver heightVh={ACT_ONE_TRACK_VH} chapter="one" />
      <ScrollDriver heightVh={ACT_TWO_TRACK_VH} chapter="two" />
      <ScrollDriver heightVh={ACT_THREE_TRACK_VH} chapter="three" />
      <ScrollDriver heightVh={ACT_FOUR_TRACK_VH} chapter="four" />

      {/* Handoff. Where the next act picks the same camera up. */}
      <section className="handoff">
        <p className="handoff__eyebrow">Fase 1 · Atos I a IV</p>
        <h2 className="handoff__title">Ela cresce.</h2>
        <p className="handoff__body">
          O protótipo cobre os quadros 01 a 12 do storyboard. Termina com uma
          planta jovem — mesmo eixo, da ponta da raiz à ponta da folha — ainda
          pequena e ainda em escala macro. É daqui que a árvore continua, sem
          corte e sem recarregar a cena.
        </p>

        <ol className="handoff__list">
          {remaining.map((frame) => (
            <li key={frame.id}>
              <span className="handoff__index">
                {String(frame.index).padStart(2, "0")}
              </span>
              <span className="handoff__label">{frame.label}</span>
            </li>
          ))}
        </ol>
      </section>
    </SmoothScroll>
  );
}
