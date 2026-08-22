import { easing, type Keyframe } from "@/lib/math";

/**
 * The shot list, expressed as keyframe tracks over the *stage clock*: `0 → 1`
 * is Act I, `1 → 2` is Act II. See `lib/scroll/stage.ts` for why the clock is
 * the sum of two chapter stores rather than one long track.
 *
 * Every animated quantity lives here, in one file, so the timing of the whole
 * piece can be read and retuned without opening a single component. Components
 * stay dumb: they sample a track and write the result to a `ref`.
 *
 * Act I's keyframes all sit at or below `1.0` and are untouched — Act II is
 * appended past them, so sampling anywhere in Act I returns exactly what it
 * returned before Act II existed.
 */

/** The ledge the grain begins on. */
export const GROUND_Y = -0.3;
/** The earth it comes to rest on. */
export const LANDING_Y = -1.85;
/** How far it falls. */
export const DROP = LANDING_Y - GROUND_Y;

/** Working scale of the grain, and the half-height that follows from it. */
export const SEED_SCALE = 0.095;
const SEED_HALF = 0.93 * SEED_SCALE;

/**
 * Where the grain comes to rest once it is planted — below the surface, deep
 * enough that the camera can sit level with it and still have earth overhead.
 * `Roots` and `Soil` anchor to this.
 */
export const SEED_PLANTED_Y = -2.15;
const PLANTED_OFFSET = SEED_PLANTED_Y - (GROUND_Y + SEED_HALF);

export const seed = {
  /**
   * Constant. A real object does not change size — apparent scale is the
   * camera's job, and letting the lens do that work is most of why the sequence
   * reads as photographed rather than animated.
   */
  scale: [{ at: 0, value: SEED_SCALE }] satisfies Keyframe[],

  /**
   * Vertical *offset from resting contact*, not absolute height. `Seed` adds
   * this to `GROUND_Y + halfHeight × scale`, so the grain stays welded to the
   * ledge through Acts 01–02 no matter how anything else is retuned.
   *
   * The tail is the point: contact, a rebound of four per cent of the drop, and
   * a settle. Nothing else in the sequence communicates mass as cheaply as a
   * bounce too small to consciously notice.
   */
  fall: [
    { at: 0.0, value: 0 },
    { at: 0.46, value: 0 },
    // Breaks contact.
    { at: 0.53, value: 0.035, ease: easing.outCubic },
    { at: 0.6, value: 0.012 },
    { at: 0.745, value: DROP, ease: easing.gravity },
    { at: 0.762, value: DROP + 0.06, ease: easing.outCubic },
    { at: 0.782, value: DROP, ease: easing.inQuad },
    { at: 1.0, value: DROP },

    // Act II. The grain does not fall again — it is *pressed in*. A few
    // centimetres of give, the soil pushing back, and then the slow sink that
    // buries it. Repeating the fall would contradict the landing Act I already
    // earned; this is what "ela encontra o solo" means once it is already there.
    { at: 1.1, value: DROP },
    { at: 1.17, value: DROP - 0.03, ease: easing.gravity },
    { at: 1.2, value: DROP - 0.018, ease: easing.outCubic },
    // The sink is timed against the *camera's* crossing, not against a beat.
    // Let the grain go under first and there is a stretch of scroll where the
    // subject is behind an opaque surface the lens has not reached yet — the
    // frame is a wall of soil with nothing in it.
    { at: 1.26, value: DROP - 0.018 },
    { at: 1.44, value: PLANTED_OFFSET, ease: easing.inOutSine },
    { at: 2.0, value: PLANTED_OFFSET },
  ] satisfies Keyframe[],

  /**
   * Half a turn across Act 02 on a sine ease, so it has no visible start or
   * stop; then a tumble under gravity that *stops* on impact. A landed object
   * does not keep rotating, and letting it would undo the weight the bounce
   * just bought.
   */
  rotationY: [
    { at: 0.0, value: 0.15 },
    { at: 0.18, value: 0.24 },
    { at: 0.48, value: Math.PI * 0.92, ease: easing.inOutSine },
    { at: 0.745, value: Math.PI * 1.28 },
    { at: 0.79, value: Math.PI * 1.33, ease: easing.outCubic },
    { at: 1.0, value: Math.PI * 1.34 },
    // A few degrees of settle as the soil takes it. Nothing more: it is buried.
    { at: 1.16, value: Math.PI * 1.36, ease: easing.outCubic },
    { at: 2.0, value: Math.PI * 1.36 },
  ] satisfies Keyframe[],

  rotationX: [
    { at: 0.0, value: 0.06 },
    { at: 0.48, value: -0.1, ease: easing.inOutSine },
    { at: 0.745, value: -0.34 },
    { at: 0.79, value: -0.3, ease: easing.outCubic },
    { at: 1.0, value: -0.3 },
    { at: 1.16, value: -0.26, ease: easing.outCubic },
    { at: 2.0, value: -0.26 },
    { at: 2.6, value: -0.22, ease: easing.inOutSine },
    { at: 3.0, value: -0.07, ease: easing.outCubic },
  ] satisfies Keyframe[],

  rotationZ: [
    { at: 0.0, value: -0.04 },
    { at: 0.46, value: -0.03 },
    { at: 0.62, value: 0.1 },
    { at: 0.745, value: 0.22 },
    { at: 0.79, value: 0.19, ease: easing.outCubic },
    { at: 1.0, value: 0.19 },
    { at: 1.16, value: 0.15, ease: easing.outCubic },
    { at: 2.0, value: 0.15 },
    { at: 2.6, value: 0.12, ease: easing.inOutSine },
    { at: 3.0, value: 0.04, ease: easing.outCubic },
  ] satisfies Keyframe[],

  /** Idle drift authority — silenced at release and never restored: the grain
   *  is resting on earth by the end, not floating in a hero. */
  idle: [
    { at: 0.0, value: 1 },
    { at: 0.44, value: 1 },
    { at: 0.52, value: 0 },
    { at: 2.0, value: 0 },
  ] satisfies Keyframe[],
};

/**
 * The camera carries the whole piece: wide on an almost empty frame, a macro
 * push for the turn, a lagging fall, and a reframe that opens the Home.
 */
export const camera = {
  /**
   * The grain never leaves the centre line, so neither does the camera.
   *
   * Everything the viewer reads as "the Home assembling around it" is done with
   * `targetY` alone: after impact the lens aims higher while the grain sits
   * still, which sinks it into the lower third and opens the column of sand
   * above it that the title occupies. The move continues the direction the fall
   * already established — down the frame — instead of cutting across it, which
   * a lateral dolly would.
   *
   * It also never cuts and never resets, because frame 06 has to pick up this
   * same camera still descending toward the soil.
   */
  y: [
    { at: 0.0, value: 0.3 },
    { at: 0.2, value: 0.3 },
    { at: 0.48, value: 0.16, ease: easing.inOutSine },
    { at: 0.58, value: 0.06 },
    { at: 0.66, value: -0.1 },
    { at: 0.745, value: -1.06, ease: easing.gravity },
    { at: 0.82, value: -1.11, ease: easing.outCubic },
    { at: 1.0, value: -1.13 },

    // Act II. One unbroken descent: it closes on the grain, follows it into the
    // soil, crosses the surface somewhere around 1.25, settles level with the
    // buried grain, then falls away again to take in the root system. Nowhere
    // does it reverse — the whole chapter is the same move Act I started.
    // Held at the Act I framing until the Home has finished wiping out. Start
    // the descent underneath the title and the horizon climbs through the
    // typography, which is the one thing guaranteed to read as two layers
    // rather than one room.
    { at: 1.08, value: -1.13, ease: easing.inOutSine },
    { at: 1.2, value: -1.17 },
    { at: 1.26, value: -1.42 },
    // Crosses the surface at ~1.325, within a frame or two of the grain doing
    // the same. The lens follows it under; it does not arrive afterwards.
    { at: 1.34, value: -1.95 },
    { at: 1.44, value: -2.18 },
    { at: 1.5, value: -2.28, ease: easing.inOutSine },
    { at: 1.62, value: -2.36 },
    /*
     * The tail decelerates instead of falling away. The old ending pulled to
     * three and a half units below the grain and five back from it, and a root
     * system read from that far is a diagram of one however well it is built —
     * the taproot came out six pixels wide, which is a stroke, not a subject.
     * It still only ever descends; it just stops sooner, and eases as it does,
     * which is what a shot settling into a pause should do anyway.
     */
    { at: 1.72, value: -2.45 },
    { at: 1.84, value: -2.52 },
    { at: 1.94, value: -2.57, ease: easing.outCubic },
    { at: 2.0, value: -2.6 },

    /*
     * Act III. What sells the transformation is the move, not the geometry: the
     * lens leaves the pause travelling *down* the radicle, closes to within half
     * a unit of the axis where the tube is nearly all there is in frame, and
     * reverses there. With nothing else to measure against — dark soil, the
     * laterals out of frame, a near-uniform run — the reversal reads as the shot
     * settling rather than as a cut, and what it climbs on the way back up is
     * the same tube it came down.
     */
    { at: 2.16, value: -2.66, ease: easing.inOutSine },
    { at: 2.36, value: -2.73 },
    { at: 2.5, value: -2.72, ease: easing.inOutSine },
    { at: 2.62, value: -2.6 },
    { at: 2.74, value: -2.25 },
    { at: 2.86, value: -1.82 },
    { at: 2.94, value: -1.56, ease: easing.outCubic },
    { at: 3.0, value: -1.44 },
  ] satisfies Keyframe[],

  /**
   * Apparent size of the grain lives here, not in its scale. The macro push
   * through Act 02 is what lets the turn read as material — at the opening
   * distance the grain is five per cent of frame height and there is nothing
   * to examine.
   */
  z: [
    { at: 0.0, value: 5.6 },
    { at: 0.18, value: 5.45 },
    { at: 0.48, value: 2.95, ease: easing.inOutSine },
    // Pulls back as the grain releases — the lens gives up the close-up
    // because the subject is leaving, which is motivation, not a transition.
    { at: 0.58, value: 3.9, ease: easing.outCubic },
    { at: 0.745, value: 4.75 },
    { at: 0.82, value: 4.4 },
    { at: 1.0, value: 3.95, ease: easing.outCubic },

    // Closes to a macro on the buried grain for germination, then gives the
    // distance back as the roots need room. The pull-back is the reveal.
    // Right down onto the soil. Held back at the Act I distance the lens looks
    // across the ground rather than at it, and a surface seen edge-on to the
    // horizon reads as landscape — which is the wrong scale entirely for
    // something a fifth of a unit wide.
    { at: 1.08, value: 3.85, ease: easing.inOutSine },
    { at: 1.2, value: 1.6 },
    { at: 1.3, value: 1.0 },
    { at: 1.4, value: 1.25 },
    { at: 1.5, value: 1.7 },
    { at: 1.62, value: 1.8, ease: easing.inOutSine },
    { at: 1.72, value: 2.1 },
    { at: 1.84, value: 2.45 },
    { at: 1.94, value: 2.52 },
    // Close enough that the root system is *photographed* rather than charted,
    // far enough that the deepest runs stay inside the frame.
    { at: 2.0, value: 2.55, ease: easing.outCubic },

    // In to the axis, held there through the reversal, then given back slowly
    // as the shoot needs room and the surface arrives.
    { at: 2.16, value: 1.0, ease: easing.inOutSine },
    { at: 2.36, value: 0.42 },
    { at: 2.5, value: 0.4, ease: easing.inOutSine },
    { at: 2.62, value: 0.44 },
    { at: 2.74, value: 0.6 },
    { at: 2.86, value: 0.95 },
    { at: 3.0, value: 1.45, ease: easing.outCubic },
  ] satisfies Keyframe[],

  /**
   * Deliberately descends *slower* than the grain does through the fall. That
   * lag is the whole sense of gravity: aim and subject drop together and the
   * grain still sinks from just above centre to the lower third, because it is
   * outrunning the lens. Then the camera catches it for the landing.
   */
  targetY: [
    { at: 0.0, value: 0.02 },
    { at: 0.48, value: -0.14 },
    { at: 0.58, value: -0.28 },
    { at: 0.66, value: -0.42 },
    { at: 0.745, value: -1.4, ease: easing.gravity },
    // The reframe. Nothing in the scene moves; the lens eases upward and the
    // resting grain settles into the lower third.
    { at: 0.82, value: -1.24, ease: easing.outCubic },
    { at: 1.0, value: -1.17, ease: easing.outCubic },

    // Aims back down onto the grain as the Home dissolves, then leads the
    // descent — always a little below the camera, so the move reads as going
    // somewhere rather than sinking.
    { at: 1.08, value: -1.2, ease: easing.inOutSine },
    { at: 1.2, value: -1.88 },
    { at: 1.26, value: -2.0 },
    { at: 1.34, value: -2.12 },
    { at: 1.44, value: -2.3 },
    { at: 1.5, value: -2.42, ease: easing.inOutSine },
    { at: 1.62, value: -2.35 },
    /*
     * Aimed a little above the grain at the end, which drops the whole organism
     * into the lower two thirds and opens the top of frame. The phrase lives in
     * that gap — over soil rather than over roots.
     */
    { at: 1.72, value: -2.4 },
    // Eased up onto the grain for the pause. The organism hangs below it, so
    // aiming a little above puts the whole of it in the lower two thirds and
    // leaves the top of frame as bare soil for the words.
    { at: 1.84, value: -2.3 },
    { at: 1.94, value: -2.27 },
    { at: 2.0, value: -2.25, ease: easing.outCubic },

    // Leads the move in both directions: below the lens on the way down, above
    // it on the way up, so the shot always reads as going somewhere.
    { at: 2.16, value: -2.56, ease: easing.inOutSine },
    { at: 2.36, value: -2.79 },
    { at: 2.5, value: -2.7, ease: easing.inOutSine },
    { at: 2.62, value: -2.48 },
    { at: 2.74, value: -2.06 },
    { at: 2.86, value: -1.7 },
    { at: 3.0, value: -1.56, ease: easing.outCubic },
  ] satisfies Keyframe[],
};

/**
 * Key light. The small azimuth drift through Act 02 is what makes the turn feel
 * observed: the highlight travels across the grain's shoulders instead of
 * sitting in one place while the geometry rotates under it.
 */
export const light = {
  intensity: [
    { at: 0.0, value: 2.2 },
    { at: 0.3, value: 2.65 },
    { at: 0.48, value: 2.05 },
    { at: 0.745, value: 2.3 },
    { at: 1.0, value: 2.35 },
    // Underground the key is no longer the sun — it is what little of it makes
    // it through the surface. Most of the drop happens as the camera crosses.
    // Softened before the descent: the same key that modelled a grain against
    // pale sand blows out soil seen from a hand's breadth away.
    { at: 1.2, value: 1.65 },
    { at: 1.4, value: 1.35 },
    { at: 1.5, value: 1.0 },
    { at: 2.0, value: 0.92 },
    // Deepest at the bottom of the descent, then the sun comes back as the lens
    // climbs — gradually, and never past where Act I had it.
    { at: 2.44, value: 0.8 },
    { at: 2.7, value: 1.05 },
    { at: 2.86, value: 1.7 },
    { at: 3.0, value: 2.1, ease: easing.outCubic },
  ] satisfies Keyframe[],

  azimuth: [
    { at: 0.0, value: 0.0 },
    { at: 0.48, value: 0.55, ease: easing.inOutSine },
    { at: 1.0, value: 0.24, ease: easing.outCubic },
    { at: 2.0, value: 0.08, ease: easing.inOutSine },
    { at: 3.0, value: 0.3, ease: easing.inOutSine },
  ] satisfies Keyframe[],
};

export const shadow = {
  /**
   * Two surfaces, each with its own authority, rather than one plane that
   * teleports between them.
   *
   * Opacity and spread are driven by the grain's *distance* above each surface,
   * so the ledge shadow dissolves as the grain climbs away from it and the
   * earth shadow resolves out of a huge soft smear as the grain comes down —
   * no crossfade required, and the fall never passes through a frame where
   * nothing is casting.
   */
  ledge: [
    { at: 0.0, value: 1 },
    { at: 0.52, value: 1 },
    { at: 0.62, value: 0 },
    { at: 2.0, value: 0 },
  ] satisfies Keyframe[],

  earth: [
    { at: 0.0, value: 0 },
    { at: 0.56, value: 0 },
    { at: 0.66, value: 1, ease: easing.outCubic },
    { at: 1.0, value: 1 },
    // Gone by the time the grain is buried: a shadow needs a surface to fall
    // on, and the grain is no longer standing on one.
    { at: 1.22, value: 0.85 },
    { at: 1.3, value: 0.4 },
    { at: 1.36, value: 0 },
    { at: 2.0, value: 0 },
  ] satisfies Keyframe[],
};

/** Impact, not release. A grain this size displaces almost nothing. */
export const dust = {
  /** Act I: the landing. */
  impact: [
    { at: 0.735, value: 0 },
    { at: 0.762, value: 1, ease: easing.outQuad },
    { at: 0.83, value: 0.42 },
    { at: 0.92, value: 0 },
  ] satisfies Keyframe[],

  /**
   * Act II: the planting. Smaller than the landing, because the grain is being
   * pressed into soil that gives rather than struck against a surface — a few
   * grains rolling aside, not a puff.
   */
  plant: [
    { at: 1.13, value: 0 },
    { at: 1.18, value: 0.7, ease: easing.outQuad },
    { at: 1.28, value: 0.34 },
    { at: 1.42, value: 0 },
  ] satisfies Keyframe[],
};

/**
 * The backdrop is a lit surface, not a fill: a vertical wash, a warm pool that
 * follows the grain, atmospheric haze for depth, a vignette, and an organic
 * fibre texture under all of it.
 */
export const backdrop = {
  pool: [
    { at: 0.0, value: 0.42 },
    { at: 0.48, value: 0.56 },
    { at: 0.745, value: 0.45 },
    { at: 1.0, value: 0.62, ease: easing.outCubic },
    { at: 1.14, value: 0.3 },
    { at: 1.28, value: 0.05 },
    { at: 2.0, value: 0.02 },
    { at: 2.7, value: 0.02 },
    { at: 3.0, value: 0.34, ease: easing.outCubic },
  ] satisfies Keyframe[],

  /** Page-level cast shadow. Kept low — the grain now has a real contact
   *  shadow on the earth, and doubling them reads as a smudge. */
  cast: [
    { at: 0.0, value: 0 },
    { at: 0.74, value: 0 },
    { at: 0.92, value: 0.08, ease: easing.outCubic },
    { at: 1.0, value: 0.09 },
    { at: 1.1, value: 0 },
    { at: 2.0, value: 0 },
  ] satisfies Keyframe[],

  /** Depth haze: the far field lightens and loses contrast, as air does. */
  haze: [
    { at: 0.0, value: 0.24 },
    { at: 0.48, value: 0.15 },
    { at: 0.745, value: 0.28 },
    { at: 1.0, value: 0.32, ease: easing.outCubic },
    { at: 1.24, value: 0.3 },
    { at: 1.5, value: 0.1 },
    { at: 2.0, value: 0.06 },
    { at: 2.6, value: 0.06 },
    { at: 3.0, value: 0.26, ease: easing.outCubic },
  ] satisfies Keyframe[],

  vignette: [
    { at: 0.0, value: 0.16 },
    { at: 0.48, value: 0.12 },
    { at: 0.745, value: 0.19 },
    { at: 1.0, value: 0.26, ease: easing.outCubic },
    // Closes in underground: earth on every side is a smaller room than sand
    // under an open sky, and the vignette is what says so.
    { at: 1.38, value: 0.3 },
    { at: 1.6, value: 0.36 },
    { at: 2.0, value: 0.4, ease: easing.outCubic },
    // Opens back up as we surface: the room stops being a room.
    { at: 2.6, value: 0.42 },
    { at: 3.0, value: 0.2, ease: easing.outCubic },
  ] satisfies Keyframe[],

  /**
   * Warm shafts raking in from the upper left. They are the single largest
   * contributor to the room reading as *lit* rather than *filled*, and they
   * strengthen through the piece as the atmosphere warms toward the Home.
   */
  shaft: [
    { at: 0.0, value: 0.3 },
    { at: 0.48, value: 0.2 },
    { at: 0.745, value: 0.42 },
    { at: 1.0, value: 0.58, ease: easing.outCubic },
    // The sun does not follow us down.
    { at: 1.22, value: 0.48 },
    { at: 1.4, value: 0.1 },
    { at: 2.0, value: 0.03 },
    { at: 2.62, value: 0.03 },
    // The sun does follow us back.
    { at: 3.0, value: 0.34, ease: easing.outCubic },
  ] satisfies Keyframe[],

  /**
   * The earth itself, resolving out of the haze below the horizon as the camera
   * descends toward it. Off entirely while the grain is still on the ledge —
   * there is nothing down there yet to see.
   */
  floor: [
    { at: 0.0, value: 0 },
    { at: 0.58, value: 0 },
    { at: 0.745, value: 0.5, ease: easing.outCubic },
    { at: 1.0, value: 0.72, ease: easing.outCubic },
    { at: 1.2, value: 1 },
    { at: 2.0, value: 1 },
  ] satisfies Keyframe[],
};

/**
 * Act II only.
 *
 * The soil is not a brown plane. It is a volume the camera travels through:
 * suspended grains at every distance, clods with real silhouettes, and a light
 * from the surface that recedes as we leave it behind. Depth is the one thing
 * a flat texture cannot fake, and parallax between near and far matter is what
 * supplies it.
 */
export const soil = {
  /**
   * The textured surface fading in over the backdrop's painted earth. It has to
   * be fully opaque well before the camera arrives: a half-transparent ground
   * plane shows the clods buried underneath it, which reads as a glitch rather
   * than as soil.
   */
  surface: [
    { at: 1.06, value: 0 },
    { at: 1.19, value: 1, ease: easing.outCubic },
    { at: 2.0, value: 1 },
  ] satisfies Keyframe[],
};

export const germination = {
  /**
   * The hilum opening. Deliberately its own beat before any root appears —
   * something has to happen to the grain first, or the root reads as an object
   * arriving rather than as the grain splitting.
   */
  aperture: [
    { at: 1.46, value: 0 },
    { at: 1.56, value: 1, ease: easing.outCubic },
    { at: 2.0, value: 1 },
  ] satisfies Keyframe[],

  /**
   * The growth front, 0..1, matched against each vertex's birth time along the
   * root system. The curve is deliberately slow at the start: the first radicle
   * has to be watched emerging, and only once it is established do the
   * branchings come quickly enough to feel like spreading.
   */
  growth: [
    { at: 1.54, value: 0 },
    { at: 1.66, value: 0.14, ease: easing.outCubic },
    { at: 1.78, value: 0.4 },
    { at: 1.88, value: 0.72 },
    { at: 1.96, value: 0.94 },
    { at: 2.0, value: 1.06, ease: easing.outCubic },
  ] satisfies Keyframe[],
};

/**
 * Act III only.
 *
 * `growth` runs the shoot up the *same* shared timeline the roots grow on — one
 * attribute on one mesh, so the uniform that reveals the radicle is the uniform
 * that reveals the stem. The curve is slow through the middle on purpose: that
 * stretch is where the lens is closest to the axis, and the transformation is
 * meant to happen without being watched happening.
 */
export const shoot = {
  growth: [
    { at: 2.0, value: 0 },
    { at: 2.16, value: 0 },
    { at: 2.34, value: 0.1, ease: easing.outCubic },
    { at: 2.56, value: 0.3 },
    { at: 2.74, value: 0.6, ease: easing.inOutSine },
    { at: 2.88, value: 0.87 },
    { at: 2.96, value: 0.99, ease: easing.outCubic },
    { at: 3.0, value: 1 },
  ] satisfies Keyframe[],

  /**
   * The coat parting into two leaves. Right at the end and barely at all — the
   * note is a sprout, not a seedling with foliage, and the whole of the next
   * act is still ahead of it.
   */
  cotyledon: [
    { at: 2.86, value: 0 },
    { at: 2.95, value: 0.55, ease: easing.outCubic },
    { at: 3.0, value: 1, ease: easing.outCubic },
  ] satisfies Keyframe[],
};
