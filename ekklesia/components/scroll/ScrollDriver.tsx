"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { progressStore } from "@/lib/scroll/progressStore";

type Props = {
  /** Length of the narrative track, in viewport heights. */
  heightVh: number;
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
export function ScrollDriver({ heightVh }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = trackRef.current;
    if (!element) return;

    gsap.registerPlugin(ScrollTrigger);

    const trigger = ScrollTrigger.create({
      trigger: element,
      start: "top top",
      end: "bottom bottom",
      // `true` follows Lenis' own smoothing 1:1; the cinematic easing comes
      // from the damping in the store, so we do not want to smooth twice here.
      scrub: true,
      onUpdate: (self) => progressStore.setRaw(self.progress),
      onRefresh: (self) => progressStore.setRaw(self.progress),
    });

    return () => trigger.kill();
  }, [heightVh]);

  return (
    <div
      ref={trackRef}
      aria-hidden="true"
      style={{ height: `${heightVh}vh` }}
      data-scroll-track
    />
  );
}
