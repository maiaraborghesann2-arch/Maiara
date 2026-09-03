/**
 * The cinematic opening, in numbers.
 *
 * Everything about how scrolling maps onto the footage lives here: the length
 * of the section, the shape of the scroll-to-time curve, the narrative beats
 * that curve is built around, and how the frame is cropped at each breakpoint.
 * No component below this file contains a timing number.
 *
 * All of the times below were measured off the footage, not chosen by eye. The
 * film was sampled frame by frame for mean luminance and for inter-frame
 * change, and the beat boundaries sit exactly where those two curves turn:
 *
 *   0.00–1.45 s  luma 80, motion 0.08   the seed hangs, effectively still
 *   1.45–2.90 s  luma 80→65, motion 5.8 the fall
 *   2.90–3.70 s  luma 65→30, motion 8.3 the surface — the film's largest change
 *   3.70–6.00 s  luma 30→36, motion 0.9 under the earth, the quietest stretch
 *   6.00–7.10 s  luma 44→120, motion 8.8 breaking through into the light
 *   7.10–8.90 s  luma 130→124, motion 3.5 the crown fills
 *   8.90–10.04 s luma 110, motion 0.3   the tree settles and stays
 *
 * Two of those are the film's own transitions, and both are continuous morphs
 * inside the footage rather than cuts — verified frame by frame across the
 * boundaries. Which is why nothing in this project fades, wipes or dissolves
 * between stages: there is no discontinuity to cover, so the only instrument
 * used is the rate at which the scroll walks the footage.
 */

/* ═══════════════════════════════════════════════════════════════════════
 *  REPLACING THE FILM
 * ═══════════════════════════════════════════════════════════════════════
 *
 * These two constants are the whole contract. Drop a new file into
 * `public/media/`, point `VIDEO_SRC` at it, set `AUTHORED_DURATION` to its
 * length in seconds, and re-author `SCROLL_CURVE` against the new footage.
 * Nothing outside this file knows which film is playing — not the opening
 * component, not the page, not the rest of the site.
 *
 * A new film of a *different length* needs no code change at all: the curve is
 * normalised against `AUTHORED_DURATION` and re-expanded against the element's
 * own `duration` at runtime, so the mapping stays proportional automatically.
 * Re-authoring the curve is then a matter of taste, not of correctness — and
 * `assertDurationMatches` below says so out loud in development if the two
 * durations have drifted apart.
 *
 * What a replacement file needs, learned from the last one the hard way:
 *   • 8-bit H.264 (`yuv420p`, High profile). 10-bit — `yuv420p10le`, which is
 *     what Firefly hands you — does not decode in any browser.
 *   • A keyframe on every frame. Scrubbing seeks to arbitrary positions, and a
 *     sparse GOP makes each one cost the whole distance back to the last one.
 *
 *     ffmpeg -i <new>.mp4 -vf "zscale=w=2560:h=1440:filter=lanczos:\
 *       dither=error_diffusion,format=yuv420p" -c:v libx264 -preset slow \
 *       -tune film -profile:v high -crf 24 -g 1 -keyint_min 1 \
 *       -sc_threshold 0 -x264-params aq-mode=3:aq-strength=1.1 \
 *       -movflags +faststart -an public/media/scrub.mp4
 *
 * The file in place now is 2560×1440, 8-bit High profile, 241 of 241
 * keyframes, CRF 24, 19.5 MB.
 */
export const VIDEO_SRC = "/media/scrub.mp4";

/**
 * The length of the film `SCROLL_CURVE` was written against.
 *
 * This is *not* a guess at the runtime duration — it is the denominator that
 * turns the curve's authored seconds into fractions of the film. It also
 * stands in as the duration before the element reports its own.
 */
export const AUTHORED_DURATION = 10.042;

/**
 * Warns, in development only, when the loaded film is not the one the curve was
 * written for. The mapping still works — it scales proportionally — but the
 * beats will no longer sit on the moments they were placed on, and that is
 * worth knowing about rather than discovering by eye.
 */
export function assertDurationMatches(actual: number): void {
  if (process.env.NODE_ENV === "production") return;
  if (!Number.isFinite(actual) || actual <= 0) return;
  if (Math.abs(actual - AUTHORED_DURATION) < 0.25) return;
  console.warn(
    `[cinematic] O filme carregado dura ${actual.toFixed(2)}s, mas SCROLL_CURVE ` +
      `foi escrita para ${AUTHORED_DURATION}s. O mapeamento continua ` +
      `proporcional, mas os beats saíram dos momentos em que foram colocados. ` +
      `Reescreva SCROLL_CURVE e AUTHORED_DURATION em lib/cinematic/config.ts.`,
  );
}

/**
 * The brand mark shown during the entrance.
 *
 * `null` falls back to the wordmark set in the identity's own display serif —
 * which is the typography, not a redrawing of the tree symbol. Drop the real
 * asset into `public/media/` (SVG for preference; PNG with transparency works)
 * and point this at it. Nothing else needs to change.
 */
export const BRAND_MARK_SRC: string | null = null;

/**
 * Where the entrance ends up.
 *
 * Measured off the footage rather than picked: `#6B5032` is the mean colour of
 * frame 0. The ivory travels to exactly that before the video is uncovered, so
 * the reveal is a dissolve between two surfaces of the same value instead of a
 * change of exposure.
 */
export const FIRST_FRAME_TONE = "#6B5032";

/**
 * The entrance, in seconds. Under two and a half all in, and every step of it
 * can be cut short by the visitor touching the scroll.
 */
export const INTRO = {
  markIn: 0.7,
  stillness: 0.5,
  markOut: 0.45,
  /** The ivory travelling to the footage's own tone, then uncovering it. */
  dissolve: 0.9,
  /** How much faster it runs if the visitor starts scrolling. */
  hurry: 4,
  /**
   * The longest the entrance will ever wait for the first frame.
   *
   * A held brand screen is the worst failure a hero can have, so past this it
   * goes anyway. Revealing early is safe: the stage's own background is the
   * same ivory, so an undecoded video shows warm paper rather than black.
   */
  maxHold: 4,
} as const;

export const VIDEO_ASPECT = 16 / 9;

/**
 * How much scroll the opening occupies.
 *
 * Unchanged at 500vh, and deliberately so: the footage went from 15.0 s to
 * 10.0 s over the same track, which is already a third more scroll for every
 * second of film. The extra room the new cut needed came for free.
 */
export const CINEMATIC_TRACK_VH = 500;

export type CinematicBeatId =
  | "seed"
  | "descent"
  | "soil"
  | "underground"
  | "emergence"
  | "growth"
  | "tree";

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
 * The scroll-to-footage curve, as control points, in seconds of film.
 *
 * Seconds rather than a normalised `0..1` because every one of these numbers
 * was read off the footage, and the file is the thing they have to keep
 * agreeing with.
 *
 * The rule behind the spacing: a stretch of film gets scroll in proportion to
 * how much is *changing* in it, not to how long it runs. So the two moments
 * where the picture transforms — the crossing into the soil and the break into
 * the light — are walked at roughly half the speed of the fall around them,
 * which is what makes them read as passages rather than as edits. The quiet
 * stretches are walked faster in film-seconds and still feel slower, because
 * almost nothing in them moves.
 *
 * `scroll` must run 0 → 1 and `second` must never go backwards. Everything else
 * is a judgement call, and this is the one place to change it.
 */
export const SCROLL_CURVE: readonly { scroll: number; second: number }[] = [
  // The seed, suspended in the light. The first second of film is a held shot —
  // it does not move at all — so it is walked at the fastest rate in the piece
  // and *still* reads as the stillest. Walking it slowly would not make the
  // seed more contemplative, it would only make the scroll feel disconnected.
  { scroll: 0.0, second: 0.0 },
  { scroll: 0.045, second: 1.0 },
  // It lets go.
  { scroll: 0.08, second: 1.45 },
  // The fall — and the footage's own deceleration into the soil, which the
  // curve leans into rather than fights.
  { scroll: 0.22, second: 2.9 },
  // The surface. Eight tenths of a second of film across nearly a fifth of the
  // whole section: the slowest stretch in the piece, at less than half the rate
  // of the fall on either side of it, because this is where the film changes
  // world. Nothing is laid over it — the slowness *is* the transition.
  { scroll: 0.4, second: 3.7 },
  // Under the earth. The widest beat, and the one with the least happening in
  // it — the roots are given the room to arrive rather than appear.
  { scroll: 0.62, second: 6.0 },
  // Out into the light. Slowed against the fall for the same reason the
  // crossing is: it is the second place the whole frame changes at once.
  { scroll: 0.76, second: 7.1 },
  // The crown fills.
  { scroll: 0.87, second: 8.9 },
  // The tree completes — and the curve arrives here with its slope already
  // falling away, so the film settles into its last frame instead of hitting
  // it. That deceleration is the ending; there is no effect on top of it.
  { scroll: 0.945, second: 10.042 },
  // …and the last twentieth is the hold. The footage does not advance.
  { scroll: 1.0, second: 10.042 },
];

export const CINEMATIC_BEATS: readonly CinematicBeat[] = [
  {
    id: "seed",
    label: "A semente",
    note: "Suspensa na luz. Nada se move — e é para ser assim.",
    scroll: [0.0, 0.08],
  },
  {
    id: "descent",
    label: "A queda",
    note: "Desce, e o próprio filme desacelera antes do contato.",
    scroll: [0.08, 0.22],
  },
  {
    id: "soil",
    label: "A travessia",
    note: "A superfície. A passagem mais lenta da peça — outro mundo.",
    scroll: [0.22, 0.4],
  },
  {
    id: "underground",
    label: "Sob a terra",
    note: "O trecho mais largo e o mais quieto. As raízes chegam.",
    scroll: [0.4, 0.62],
  },
  {
    id: "emergence",
    label: "O rompimento",
    note: "Rompe a superfície; a paisagem se abre atrás dela.",
    scroll: [0.62, 0.76],
  },
  {
    id: "growth",
    label: "A copa",
    note: "O tronco se firma e a copa se enche, sem pressa.",
    scroll: [0.76, 0.87],
  },
  {
    id: "tree",
    label: "A árvore",
    note: "Ela se completa — e permanece em quadro.",
    scroll: [0.87, 1.0],
  },
];

/**
 * Where the frame dissolves into the page.
 *
 * Over this range the ivory already present at the foot of the frame grows,
 * so the ground under the tree becomes the page's own light before the first
 * section of the site arrives. It is a change of light, not a wipe, and it is
 * a pure function of scroll — scrolling back up puts it exactly where it was.
 */
export const HANDOFF_SCROLL: readonly [number, number] = [0.87, 1.0];

/**
 * When the headline arrives over the tree, per line.
 *
 * The words are part of the film's last shot, not a section under it, so their
 * timing lives here with the rest of the film's timing rather than in a
 * component. Each line has its own range off the same scroll, overlapping —
 * that is what gives the pair a stagger without a timeline, and it stays a pure
 * function of scroll position, so it runs backwards exactly.
 *
 * The first line starts as the crown finishes filling (the footage reaches its
 * last frame at 0.945) and the second settles just before the hold. Both are
 * fully in with a stretch of scroll left over, so the composition — tree and
 * words together — is what the visitor rests on before the page moves on.
 */
export const HEADLINE_SCROLL: readonly (readonly [number, number])[] = [
  [0.885, 0.945],
  [0.905, 0.965],
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

/*
 * Monotone cubic (Fritsch–Carlson) tangents for the curve above.
 *
 * The earlier cut was interpolated piecewise-linearly, which is fine when the
 * control points are evenly paced. These are not: the crossing is walked at
 * half the speed of the fall on either side of it, and a linear curve would
 * change speed *instantly* at those joins. A step change in playback rate is
 * precisely what reads as an edit, which is the one thing this sequence must
 * not do — so the curve is C¹ instead, and the film accelerates and decelerates
 * into each passage rather than switching gear at a boundary.
 *
 * Fritsch–Carlson specifically, because it is the cubic that cannot overshoot:
 * the footage is guaranteed never to run backwards while the page scrolls
 * forwards, which a natural cubic spline would not guarantee here.
 */
const TANGENTS: readonly number[] = (() => {
  const n = SCROLL_CURVE.length;
  const width: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    width[i] = SCROLL_CURVE[i + 1].scroll - SCROLL_CURVE[i].scroll;
    slope[i] = (SCROLL_CURVE[i + 1].second - SCROLL_CURVE[i].second) / width[i];
  }

  const tangent: number[] = new Array(n);
  tangent[0] = slope[0];
  tangent[n - 1] = slope[n - 2];
  for (let i = 1; i < n - 1; i++) {
    // A flat or reversing join pins the tangent at zero — this is what makes
    // the film settle to a stop at the final frame rather than arrive at speed.
    if (slope[i - 1] * slope[i] <= 0) {
      tangent[i] = 0;
      continue;
    }
    const a = 2 * width[i] + width[i - 1];
    const b = width[i] + 2 * width[i - 1];
    tangent[i] = (a + b) / (a / slope[i - 1] + b / slope[i]);
  }
  return tangent;
})();

/**
 * Maps the section's scroll progress onto the footage, `0..1` in both.
 *
 * Deterministic and stateless: the same scroll position always resolves to the
 * same timestamp, in either direction. All of the smoothing in time — as
 * opposed to the smoothing in shape this curve provides — happens upstream in
 * the damped progress store.
 */
export function videoProgressFor(scroll: number): number {
  const p = scroll < 0 ? 0 : scroll > 1 ? 1 : scroll;

  for (let i = 1; i < SCROLL_CURVE.length; i++) {
    const a = SCROLL_CURVE[i - 1];
    const b = SCROLL_CURVE[i];
    if (p > b.scroll) continue;

    const width = b.scroll - a.scroll;
    if (width <= 0) return b.second / AUTHORED_DURATION;

    const t = (p - a.scroll) / width;
    const t2 = t * t;
    const t3 = t2 * t;
    const second =
      (2 * t3 - 3 * t2 + 1) * a.second +
      (t3 - 2 * t2 + t) * width * TANGENTS[i - 1] +
      (-2 * t3 + 3 * t2) * b.second +
      (t3 - t2) * width * TANGENTS[i];

    return second / AUTHORED_DURATION;
  }

  return SCROLL_CURVE[SCROLL_CURVE.length - 1].second / AUTHORED_DURATION;
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
 * The single frame shown to visitors who have asked for less motion. The
 * completed tree: the one image that says what the whole sequence is about
 * without needing the sequence.
 */
export const REDUCED_MOTION_VIDEO_PROGRESS = 0.97;
