"use client";

import { CinematicOpening } from "@/components/cinematic/CinematicOpening";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import {
  Approach,
  Capabilities,
  Diagnosis,
  Paths,
  Philosophy,
  Problem,
} from "@/components/site/Sections";
import { LocaleProvider } from "@/lib/site/locale";
import { useReveal } from "@/lib/site/useReveal";

/**
 * The page, in one place.
 *
 * There are two entry points into it — the Next route and the standalone
 * preview bundle — and for a while each assembled this tree itself. They
 * drifted twice without anyone noticing, so neither composes it any more.
 *
 * The opening is the supplied footage, scrubbed by the scroll, and it is closed
 * work: `CinematicOpening` takes no props and reads everything it needs from
 * `lib/cinematic/config.ts`. Replacing the film touches that file and nothing
 * here. The procedural seed-to-plant scene it replaced is still in the
 * repository — `components/experience/*`, `lib/scroll/choreography.ts`, the act
 * stores, and the styles for all of it in `styles/legacy.css` — but nothing
 * imports any of it, so it is out of the bundle as well as out of the frame.
 * There is exactly one visual system running.
 *
 * Everything below the opening is ordinary scrolling HTML. The only script that
 * touches it is `useReveal`, which sets one attribute per element once and then
 * stops.
 */
export function Experience() {
  useReveal();

  return (
    /*
     * The language is state, not a route. Switching re-renders this tree with
     * different strings and touches nothing else — the `<video>` keeps its
     * identity, the scroll position is never written, and the film does not
     * restart. A `/en` and `/pt` pair would have navigated, which is the one
     * thing that must not happen inside a scroll-driven opening.
     */
    <LocaleProvider>
      <SmoothScroll>
      <SiteHeader />

      <div id="inicio" />
      <CinematicOpening />

      {/*
        Six sections, one idea each: the problem, the method, the decision, the
        work, the difference, the invitation. Anything that only restated an
        idea already made was removed rather than rephrased — there is no About
        here (it becomes its own page) and no case study, because the company
        has not finished work it can show.
      */}
      <main>
        <Problem />
        <Approach />
        <Paths />
        <Capabilities />
        <Philosophy />
        <Diagnosis />
      </main>

      <SiteFooter />
      </SmoothScroll>
    </LocaleProvider>
  );
}
