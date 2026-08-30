"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  CINEMATIC_BEATS,
  CINEMATIC_TRACK_VH,
  FOCUS,
  PORTRAIT_BELOW,
  REDUCED_MOTION_VIDEO_PROGRESS,
  VIDEO_DURATION,
  VIDEO_SRC,
  beatAt,
  videoProgressFor,
} from "@/lib/cinematic/config";
import { cinematicStore, subscribeCinematic } from "@/lib/cinematic/store";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * The opening: one video, scrubbed by the scroll.
 *
 * The stage is `position: sticky` inside a tall track, so the footage holds the
 * viewport for the length of the section and then releases it — the page itself
 * scrolls normally, and nothing outside this section is pinned.
 *
 * Nothing here re-renders while scrolling. The progress store is read in the
 * same GSAP ticker that drives Lenis, and the only things written per frame are
 * `video.currentTime` and two `textContent`s in the debug panel. React sees a
 * handful of renders for the whole visit: mount, metadata, first frame.
 */
export function CinematicOpening() {
  const section = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const readout = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [debug, setDebug] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).has("debug"));
  }, []);

  /*
   * The section *is* the timeline. One trigger, reporting into the existing
   * progress store — no second scroll engine, and no pinning: the stage is
   * sticky in CSS, so there is nothing for ScrollTrigger to recalculate on
   * resize beyond the trigger's own bounds.
   */
  useEffect(() => {
    const element = section.current;
    if (!element) return;

    gsap.registerPlugin(ScrollTrigger);
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => cinematicStore.setRaw(self.progress),
      onRefresh: (self) => cinematicStore.setRaw(self.progress),
    });

    return () => trigger.kill();
  }, []);

  /*
   * The crop anchor. Read once and on orientation change — never per frame —
   * and written as custom properties so the value lives in the config file
   * while the actual compositing stays in CSS.
   */
  useEffect(() => {
    const stage = video.current?.parentElement;
    if (!stage) return;

    const apply = () => {
      const portrait = window.innerWidth / window.innerHeight < PORTRAIT_BELOW;
      const focus = portrait ? FOCUS.portrait : FOCUS.landscape;
      stage.style.setProperty("--focus-x", focus.x);
      stage.style.setProperty("--focus-y", focus.y);
    };

    apply();
    window.addEventListener("resize", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      window.removeEventListener("resize", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, [ready]);

  const onLoaded = useCallback(() => setReady(true), []);
  const onError = useCallback(() => setFailed(true), []);

  /*
   * The scrub.
   *
   * The obvious implementation — assign `currentTime` on every scroll frame —
   * is wrong for this file, and measurably so: the master carries two keyframes
   * in fifteen seconds, one every 7.5 s, so an arbitrary seek can cost the
   * decoder up to 180 inter-frames. Asking for a new position while the last
   * one is still resolving makes the browser drop the intermediate requests,
   * and the picture freezes and then jumps.
   *
   * So seeks are *coalesced* rather than queued: the target is updated every
   * frame, and a seek is only issued when the element is not already seeking.
   * The mapping stays deterministic — the same scroll position always resolves
   * to the same timestamp — it just stops asking faster than the decoder can
   * answer.
   */
  useEffect(() => {
    const element = video.current;
    if (!element) return;

    if (reducedMotion) {
      const settle = () => {
        element.currentTime = REDUCED_MOTION_VIDEO_PROGRESS * (element.duration || VIDEO_DURATION);
      };
      if (element.readyState >= 1) settle();
      else element.addEventListener("loadedmetadata", settle, { once: true });
      return () => element.removeEventListener("loadedmetadata", settle);
    }

    let target = 0;
    let applied = -1;

    const pump = () => {
      const duration = element.duration || VIDEO_DURATION;
      if (!Number.isFinite(duration) || duration <= 0) return;
      // A hair inside the end: seeking to exactly `duration` lands past the
      // last sample on some browsers and shows a blank frame.
      const wanted = Math.min(target * duration, duration - 0.02);
      if (element.seeking) return;
      // A frame is 1/24 s. Anything finer is a seek the viewer cannot see.
      if (Math.abs(wanted - applied) < 1 / 48) return;
      applied = wanted;
      element.currentTime = wanted;
    };

    const stop = subscribeCinematic((scroll) => {
      target = videoProgressFor(scroll);
      // Hidden tabs still fire the ticker in some browsers; seeking there wakes
      // the decoder for a frame nobody is looking at.
      if (document.visibilityState === "visible") pump();
    });

    // A seek that finishes while the target has moved on has to be followed up,
    // or the picture stops one step behind wherever the scroll stopped.
    element.addEventListener("seeked", pump);
    return () => {
      stop();
      element.removeEventListener("seeked", pump);
    };
  }, [reducedMotion]);

  /* The debug panel, written directly — never through state. */
  useEffect(() => {
    if (!debug) return;
    const element = readout.current;
    if (!element) return;

    return subscribeCinematic((scroll) => {
      const beat = beatAt(scroll);
      const time = videoProgressFor(scroll) * (video.current?.duration || VIDEO_DURATION);
      const scrollCell = element.querySelector<HTMLElement>("[data-scroll]");
      const timeCell = element.querySelector<HTMLElement>("[data-time]");
      const beatCell = element.querySelector<HTMLElement>("[data-beat]");
      if (scrollCell) scrollCell.textContent = `${(scroll * 100).toFixed(1)}%`;
      if (timeCell) timeCell.textContent = `${time.toFixed(2)}s`;
      if (beatCell) beatCell.textContent = beat.label;
    });
  }, [debug]);

  return (
    <section
      ref={section}
      className="cinematic"
      style={{ height: `${CINEMATIC_TRACK_VH}vh` }}
      data-cinematic-track
      aria-label="Abertura: da semente à árvore"
    >
      <div className="cinematic__stage">
        <video
          ref={video}
          className="cinematic__video"
          src={VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          // Never played, so it is not a control surface: out of the tab order,
          // no context menu affordances, nothing for a screen reader to land on.
          tabIndex={-1}
          aria-hidden="true"
          disablePictureInPicture
          disableRemotePlayback
          onLoadedData={onLoaded}
          onError={onError}
          data-ready={ready ? "true" : "false"}
        />

        {/*
          The barest possible grade. The footage arrives with its own treatment;
          this is a warm ivory breath at the very top and bottom so the frame
          meets the page's own light instead of ending at a hard edge.
        */}
        <div className="cinematic__grade" aria-hidden="true" />

        {/*
          Loading. Ivory, not a spinner — the same surface the rest of the site
          sits on, so the first frame arrives *into* the page rather than
          replacing a placeholder.
        */}
        <div className="cinematic__veil" data-open={ready ? "false" : "true"} aria-hidden="true">
          <span className="cinematic__veilMark" />
          {failed ? (
            <p className="cinematic__veilNote">
              Não foi possível carregar a sequência de abertura.
            </p>
          ) : null}
        </div>

        {/*
          Caption slots, on the same clock, rendered empty. Filling a beat's
          `caption` in the config is the only change needed to turn them on.
        */}
        <div className="cinematic__captions" aria-hidden="true">
          {CINEMATIC_BEATS.map((beat) =>
            beat.caption?.length ? (
              <p key={beat.id} className="cinematic__caption" data-beat-id={beat.id}>
                {beat.caption.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </p>
            ) : null,
          )}
        </div>

        {debug ? (
          <div ref={readout} className="cinematic__readout">
            <span>
              scroll <b data-scroll>0.0%</b>
            </span>
            <span>
              vídeo <b data-time>0.00s</b>
            </span>
            <span>
              beat <b data-beat>—</b>
            </span>
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Exposed so the track driver and the store agree on one name. */
export { cinematicStore };
