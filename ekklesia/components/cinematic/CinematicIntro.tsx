"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { Mark } from "@/components/brand/Mark";
import { BRAND_MARK_SRC, FIRST_FRAME_TONE, INTRO } from "@/lib/cinematic/config";

type Props = {
  /** True once the video's first frame has actually decoded. */
  ready: boolean;
  onDone: () => void;
};

/**
 * The entrance.
 *
 * This is not a loading screen with the brand on it — it is the loading state
 * *replaced* by a brand moment, which is why there is no second overlay
 * underneath and nothing that reads as progress. Warm paper, the mark, a beat
 * of stillness, and then the paper itself becomes the colour of the first frame
 * and lifts off it.
 *
 * Two things make the hand-over invisible. The video is mounted and decoding
 * underneath the whole time, so there is nothing to start; and the ivory
 * travels to `#6E5235` — the measured mean colour of frame 0 — before it
 * dissolves, so the two surfaces meet at the same value and there is no step in
 * exposure, no flash and no black.
 *
 * The timeline pauses before the exit and waits for the first frame. If the
 * footage is slow the visitor sees the mark held a little longer, which reads
 * as composure rather than as waiting.
 */
export function CinematicIntro({ ready, onDone }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const readyRef = useRef(ready);

  useEffect(() => {
    readyRef.current = ready;
    // If the gate was already reached, this releases it.
    if (ready) timeline.current?.play();
  }, [ready]);

  useEffect(() => {
    const surface = root.current;
    const brand = mark.current;
    if (!surface || !brand) return;

    /*
     * The page opens at the top, always. Browsers restore the previous scroll
     * position on reload, and an entrance that resolves onto the middle of the
     * sequence is worse than no entrance at all.
     */
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    const tl = gsap.timeline({
      onComplete: () => {
        history.scrollRestoration = previousRestoration;
        onDone();
      },
    });
    timeline.current = tl;

    tl.fromTo(
      brand,
      { autoAlpha: 0, y: 10 },
      { autoAlpha: 1, y: 0, duration: INTRO.markIn, ease: "power2.out" },
    )
      .to({}, { duration: INTRO.stillness })
      /*
       * Waits here for the first frame. The resume is deferred by a tick: a
       * `play()` called from inside the pause callback is swallowed, because
       * the timeline sets itself paused immediately afterwards.
       */
      .addPause(">", () => {
        if (readyRef.current) gsap.delayedCall(0, () => tl.play());
      })
      .to(brand, { autoAlpha: 0, duration: INTRO.markOut, ease: "power1.inOut" })
      // Paper becomes the footage's own tone…
      .to(
        surface,
        { backgroundColor: FIRST_FRAME_TONE, duration: INTRO.dissolve, ease: "power1.inOut" },
        "<0.1",
      )
      // …and then lifts off it.
      .to(surface, { autoAlpha: 0, duration: INTRO.dissolve * 0.8, ease: "power2.inOut" }, "<0.25");

    /*
     * Never in the way. Any scroll input runs the rest of the entrance at four
     * times speed rather than blocking it — the visitor asked to get on with it,
     * and an intro that has to be waited out is the thing this replaces.
     */
    const hurry = () => {
      tl.timeScale(INTRO.hurry);
      tl.play();
      detach();
    };
    const detach = () => {
      window.removeEventListener("wheel", hurry);
      window.removeEventListener("touchmove", hurry);
      window.removeEventListener("keydown", hurry);
    };
    window.addEventListener("wheel", hurry, { passive: true });
    window.addEventListener("touchmove", hurry, { passive: true });
    window.addEventListener("keydown", hurry);

    // The backstop. Nothing about a hero is worth a brand screen that never
    // lifts, so past this it lifts whether the footage is there or not.
    const backstop = window.setTimeout(() => tl.play(), INTRO.maxHold * 1000);

    return () => {
      window.clearTimeout(backstop);
      detach();
      history.scrollRestoration = previousRestoration;
      tl.kill();
    };
  }, [onDone]);

  return (
    <div ref={root} className="intro" aria-hidden="true">
      <div ref={mark} className="intro__mark">
        {/*
          The mark, not a word set in a serif. `Mark` is the vector already in
          the repository — the canopy over a trunk — and an entrance that shows
          only type is an entrance without the brand in it. `BRAND_MARK_SRC`
          still wins when the official file lands.
        */}
        {BRAND_MARK_SRC ? (
          <img className="intro__logo" src={BRAND_MARK_SRC} alt="" draggable={false} />
        ) : (
          <>
            <Mark size={54} />
            <span className="intro__word">Ekklesia</span>
            <span className="intro__sub">Connect</span>
          </>
        )}
      </div>
    </div>
  );
}
