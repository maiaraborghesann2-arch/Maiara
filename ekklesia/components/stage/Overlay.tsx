"use client";

import { STORYBOARD } from "@/lib/scroll/acts";
import { BeatReadout } from "./BeatReadout";
import { Caption } from "./Caption";
import { Hero } from "./Hero";
import { ScrollCue } from "./ScrollCue";

const captionOf = (id: string) =>
  STORYBOARD.find((frame) => frame.id === id)?.caption ?? [];

/**
 * The fixed HTML layer that sits over the canvas.
 *
 * It is pinned rather than scrolled: the page's scroll length lives entirely in
 * `ScrollDriver`, and everything visible here is positioned once and then only
 * ever animated. That keeps the camera move and the typography on one clock and
 * avoids the classic sticky-section jitter where text lags the WebGL by a frame.
 */
export function Overlay() {
  return (
    <div className="overlay">
      {/* Frame 01 is already on screen at rest, so this one starts revealed. */}
      <Caption lines={captionOf("semente")} a={-0.03} b={-0.005} c={0.16} d={0.23} />
      <Caption lines={captionOf("despertar")} a={0.26} b={0.32} c={0.42} d={0.48} />
      <Caption lines={captionOf("queda")} a={0.53} b={0.58} c={0.66} d={0.72} />

      <Hero />
      <ScrollCue />
      <BeatReadout />
    </div>
  );
}
