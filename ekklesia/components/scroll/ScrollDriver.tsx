"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { progressStore } from "@/lib/scroll/progressStore";
import { actTwoStore } from "@/lib/scroll/stage";

type Props = {
  /** Length of the narrative track, in viewport heights. */
  heightVh: number;
  /**
   * Which chapter this track drives. A name rather than the store itself: the
   * page is a Server Component, and an object full of functions cannot cross
   * that boundary.
   */
  chapter: "one" | "two";
};

/**
 * The track: an empty, invisible column of scrollable height whose traversal
 * *is* the timeline.
 *
 * There is intentionally no pinning here. The stage (canvas + overlay) is
 * `position: fixed` and simply never moves, so the browser has nothing to pin
 * and nothing to recalculate on resize — the track only has to report how far
 * through it we are. Later chapters that need a section to physically scroll
 * past the camera can add their own pinned trigger without disturbing this one.
 */
export function ScrollDriver({ heightVh, chapter }: Props) {
  const store = chapter === "one" ? progressStore : actTwoStore;
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = trackRef.current;
    if (!element) return;

    gsap.registerPlugin(ScrollTrigger);

    const trigger = ScrollTrigger.create({
      trigger: element,
      /*
       * Chapter two starts one viewport *earlier* than its own top.
       *
       * "top top" fires when the element's top reaches the top of the screen,
       * but the previous track finishes at "bottom bottom" — one viewport
       * before its own bottom arrives there. Left alone that mismatch leaves a
       * full screen of scrolling between the chapters where neither clock
       * advances and the whole piece freezes mid-descent.
       */
      start: chapter === "two" ? "top bottom" : "top top",
      end: "bottom bottom",
      // `true` follows Lenis' own smoothing 1:1; the cinematic easing comes
      // from the damping in the store, so we do not want to smooth twice here.
      scrub: true,
      onUpdate: (self) => store.setRaw(self.progress),
      onRefresh: (self) => store.setRaw(self.progress),
    });

    return () => trigger.kill();
  }, [heightVh, store, chapter]);

  return (
    <div
      ref={trackRef}
      aria-hidden="true"
      style={{ height: `${heightVh}vh` }}
      data-scroll-track
    />
  );
}
