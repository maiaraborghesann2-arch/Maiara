/**
 * The cinematic opening, in numbers.
 *
 * Everything about how scrolling maps onto the footage lives here: the length
 * of the section, the shape of the scroll-to-time curve, the narrative beats
 * that curve is built around, and how the frame is cropped at each breakpoint.
 * No component below this file contains a timing number.
 *
 * Measured from the file itself (`moov`/`mvhd`, not guessed): 15.042 s,
 * 1920×1080, 24 fps, H.264, no audio track.
 */

export const VIDEO_SRC = "/media/ekklesia-seed-to-tree.mp4";

/** Read from the container. Only a fallback — the element's own `duration`
 *  wins as soon as metadata arrives. */
export const VIDEO_DURATION = 15.042;
export const VIDEO_ASPECT = 1920 / 1080;

/** How much scroll the opening occupies. */
export const CINEMATIC_TRACK_VH = 500;

export type CinematicBeatId = "seed" | "descent" | "underground" | "growth" | "tree";

export type CinematicBeat = {
  id: CinematicBeatId;
  label: string;
  /** What the footage is doing here — the reason the range is the size it is. */
  note: string;
  /** Where the beat sits in the section's own `0..1`. */
  scroll: readonly [number, number];
  /**
   * Reserved. Captions are built and wired to the same clock but rendered
   * empty: the note for this pass is that the footage carries the opening on
   * its own. Fill these in and they appear, on the beat, with no other change.
   */
  caption?: readonly string[];
};

/**
 * The scroll-to-footage curve, as control points.
 *
 * Deliberately *not* linear. A linear map spends scroll in proportion to
 * running time, which gives the quiet opening and the descent into the soil the
 * same weight as a transition that reads in half a second — the footage has its
 * own rhythm and the scroll should follow that, not the clock.
 *
 * So: the seed and the crossing into the earth are stretched (a lot of scroll
 * for a little footage, so they can be dwelt on), the middle transitions run
 * closer to real time, and the last tenth of the section holds the finished
 * tree on screen without advancing at all.
 *
 * `scroll` must run 0 → 1 and `video` must never go backwards. Everything else
 * is a judgement call, and this is the one place to change it.
 */
export const SCROLL_CURVE: readonly { scroll: number; video: number }[] = [
  { scroll: 0.0, video: 0.0 },
  // The seed: a sixth of the whole section for a fifteenth of the footage.
  { scroll: 0.16, video: 0.07 },
  // The descent picks up pace.
  { scroll: 0.34, video: 0.27 },
  // Entering the soil — the widest range in the piece.
  { scroll: 0.6, video: 0.52 },
  // Roots and the plant emerging.
  { scroll: 0.8, video: 0.78 },
  // The tree completes here, at nine tenths…
  { scroll: 0.9, video: 1.0 },
  // …and the last tenth is the hold. The footage does not advance; the frame
  // simply stays, which is what gives the sequence its ending.
  { scroll: 1.0, video: 1.0 },
];

export const CINEMATIC_BEATS: readonly CinematicBeat[] = [
  {
    id: "seed",
    label: "A semente",
    note: "Ela existe, e gira. Quieto, mínimo, sem pressa.",
    scroll: [0.0, 0.16],
  },
  {
    id: "descent",
    label: "A queda",
    note: "Desce em direção à terra; o ambiente muda com ela.",
    scroll: [0.16, 0.34],
  },
  {
    id: "underground",
    label: "Sob a terra",
    note: "A câmera atravessa a superfície. O momento mais importante.",
    scroll: [0.34, 0.6],
  },
  {
    id: "growth",
    label: "Crescimento",
    note: "As raízes se formam e a planta começa a emergir.",
    scroll: [0.6, 0.8],
  },
  {
    id: "tree",
    label: "A árvore",
    note: "Ela se completa — e permanece em quadro.",
    scroll: [0.8, 1.0],
  },
];

/**
 * Where the crop is anchored, per breakpoint.
 *
 * A 16:9 master shown on a tall phone loses two thirds of its width, and which
 * two thirds decides whether the subject is in frame at all. Portrait keeps the
 * horizontal centre and sits a little high, because everything that matters in
 * this footage — seed, hole, trunk — is on the centre line and in the upper
 * half of it.
 */
export const FOCUS = {
  landscape: { x: "50%", y: "50%" },
  portrait: { x: "50%", y: "42%" },
} as const;

/** Below this ratio the frame is treated as portrait. */
export const PORTRAIT_BELOW = 1.0;

/**
 * Maps the section's scroll progress onto the footage, `0..1` in both.
 *
 * Piecewise linear on purpose. Easing *within* a segment would make the
 * footage speed up and slow down inside a beat, which reads as the video
 * stuttering rather than as the scroll being followed; all the smoothing this
 * needs already happens in the damped progress store upstream.
 */
export function videoProgressFor(scroll: number): number {
  const p = scroll < 0 ? 0 : scroll > 1 ? 1 : scroll;
  for (let i = 1; i < SCROLL_CURVE.length; i++) {
    const a = SCROLL_CURVE[i - 1];
    const b = SCROLL_CURVE[i];
    if (p <= b.scroll) {
      const span = b.scroll - a.scroll;
      const t = span <= 0 ? 0 : (p - a.scroll) / span;
      return a.video + (b.video - a.video) * t;
    }
  }
  return SCROLL_CURVE[SCROLL_CURVE.length - 1].video;
}

/** Which beat the section is in, for captions and for the debug readout. */
export function beatAt(scroll: number): CinematicBeat {
  for (const beat of CINEMATIC_BEATS) {
    if (scroll < beat.scroll[1]) return beat;
  }
  return CINEMATIC_BEATS[CINEMATIC_BEATS.length - 1];
}

/** A beat's own `0..1`, for animating anything against it. */
export function beatProgress(beat: CinematicBeat, scroll: number): number {
  const t = (scroll - beat.scroll[0]) / (beat.scroll[1] - beat.scroll[0]);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * The single frame shown to visitors who have asked for less motion. Chosen
 * inside the growth beat: it is the one moment that says what the whole
 * sequence is about without needing the sequence.
 */
export const REDUCED_MOTION_VIDEO_PROGRESS = 0.74;
