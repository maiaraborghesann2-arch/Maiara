"use client";

import { STORYBOARD } from "@/lib/scroll/acts";
import { BeatReadout } from "./BeatReadout";
import { Caption } from "./Caption";
import { Hero } from "./Hero";
import { ScrollIndicator } from "./ScrollIndicator";

const captionOf = (id: string) =>
  STORYBOARD.find((frame) => frame.id === id)?.caption ?? [];

/**
 * The fixed HTML layer that sits over the canvas.
 *
 * It is pinned rather than scrolled: the page's scroll length lives entirely in
 * `ScrollDriver`, and everything visible here is positioned once and then only
 * ever animated. That keeps the camera move and the typography on one clock and
 * avoids the classic sticky-section jitter where text lags the WebGL by a frame.
 *
 * Frame 01 carries no copy at all — art direction asked for the opening to be
 * nothing but sand, light and the object. Narration enters with the turn.
 * (To restore it, add a `<Caption>` for `semente` with a window starting at 0.)
 */
export function Overlay() {
  return (
    <div className="overlay">
      <Caption lines={captionOf("despertar")} a={0.26} b={0.33} c={0.43} d={0.49} />
      <Caption lines={captionOf("queda")} a={0.54} b={0.59} c={0.66} d={0.72} />

      <Hero />
      <ScrollIndicator />
      <BeatReadout />
    </div>
  );
}
