"use client";

import { CinematicOpening } from "@/components/cinematic/CinematicOpening";
import { SmoothScroll } from "@/components/scroll/SmoothScroll";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import {
  Adapts,
  Approach,
  Capabilities,
  Cases,
  Diagnosis,
  Mission,
  Paths,
  Problem,
  Proposition,
  Responsibility,
  Situations,
} from "@/components/site/Sections";
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
    <SmoothScroll>
      <SiteHeader />

      <div id="inicio" />
      <CinematicOpening />

      {/*
        The order is the company's own method: understand the problem, clarify
        the situation, show the possible paths, and only then say what we do.
        A visitor who reads it in order has been walked through a diagnosis.
      */}
      <main>
        <Proposition />
        <Problem />
        <Approach />
        <Paths />
        <Capabilities />
        <Adapts />
        <Situations />
        <Cases />
        <Responsibility />
        <Diagnosis />
        <Mission />
      </main>

      <SiteFooter />
    </SmoothScroll>
  );
}
