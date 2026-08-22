import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * The root system — such as it is.
 *
 * This is a deliberate retreat from the previous build, which was botanically
 * complete and read as an inverted tree: fifteen laterals, forty-odd second
 * order runs and a scatter of hairs, spreading evenly to both sides of a thick
 * vertical trunk. Every one of those is a true thing about a root system and
 * together they were the wrong picture, because the frame was showing all of it
 * at once and the eye had nothing to rest on.
 *
 * What is here instead is what a macro lens would actually catch a few days
 * into germination: a radicle, three laterals at three different heights going
 * three different ways, and a handful of tips. Nine runs in total. The rest is
 * soil and dark, and the viewer is left to assume the rest of the system is out
 * there beyond the plane of focus — which is both true and a great deal more
 * convincing than showing it.
 *
 * Two structural notes:
 *
 *  - The radicle is *fusiform*, not tapered. It leaves the shell thin, swells
 *    over the first fifth of its run, and thins from there. Thickest-at-the-seed
 *    is what made the last version read as a stem with a ball on top; a young
 *    root is delicate exactly where it emerges.
 *  - Branch positions are written down rather than sampled. At three branches a
 *    seeded generator clusters them or mirrors them about as often as not, and
 *    either outcome is the thing this round exists to remove.
 */

/** How far the radicle reaches below the grain. */
export const ROOT_DEPTH = 0.68;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth, aperiodic, cheap. Three incommensurable sines beat a noise lookup. */
function wobble(t: number, phase: number) {
  return (
    Math.sin(t * 3.17 + phase) * 0.5 +
    Math.sin(t * 7.41 + phase * 1.7) * 0.33 +
    Math.sin(t * 15.3 + phase * 2.3) * 0.17
  );
}

export type Strand = {
  points: THREE.Vector3[];
  radii: number[];
  /** Distance from the grain, normalised — drives the colour ramp. */
  ages: number[];
  birth: number;
  life: number;
  radial: number;
  /** Generation, 0 for the radicle. Children get a shadowed collar. */
  order: number;
  phase: number;
};

type PathOptions = {
  start: THREE.Vector3;
  direction: THREE.Vector3;
  length: number;
  steps: number;
  /** How hard the run bends toward vertical as it goes. */
  gravity: number;
  /** Sideways deviation, as a fraction of length. */
  sinuosity: number;
  phase: number;
};

function path({ start, direction, length, steps, gravity, sinuosity, phase }: PathOptions) {
  const forward = direction.clone().normalize();

  // A frame to deviate *within*. Deviating in world x/z would make every root
  // wander in the same two directions, which the eye picks up immediately.
  const helper =
    Math.abs(forward.y) > 0.94 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3().crossVectors(forward, helper).normalize();
  const up = new THREE.Vector3().crossVectors(side, forward).normalize();

  const points: THREE.Vector3[] = [];
  const base = new THREE.Vector3();

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    base.copy(forward).multiplyScalar(length * t).add(start);
    // Gravitropism: a lateral leaves nearly horizontal and turns down as it
    // goes. Quadratic, so the turn is gentle at first and unmistakable later.
    base.y -= gravity * length * t * t;

    /*
     * Deviation grows as the square root of the run — never as a sum of steps.
     * Integrating a `sin(t)` wobble into the heading accumulates a net drift
     * over any finite run, and every root ends up leaning the same way.
     */
    const amount = sinuosity * length * Math.pow(t, 0.55);
    base.addScaledVector(side, wobble(t, phase) * amount);
    base.addScaledVector(up, wobble(t, phase + 21.7) * amount * 0.8);

    points.push(base.clone());
  }

  return points;
}

type StrandOptions = PathOptions & {
  rBase: number;
  rTip: number;
  taper: number;
  /**
   * How much thinner the run is where it leaves its parent, and over what
   * fraction of its length it recovers. This is the fusiform profile: nothing
   * young is thickest at the point it emerged from.
   */
  neck: number;
  neckLength: number;
  /**
   * Where along the run the thinning is centred. The radicle starts *inside*
   * the grain, so a neck measured from `t = 0` is spent entirely behind opaque
   * shell and what emerges is already at full thickness — which is exactly the
   * stem-with-a-ball-on-top this profile exists to prevent. Anchoring it at the
   * point the run leaves the shell puts the delicate part on screen.
   */
  neckAt?: number;
  ageFrom: number;
  ageTo: number;
  birth: number;
  life: number;
  radial: number;
  order: number;
};

function strand(options: StrandOptions): Strand {
  const points = path(options);
  const { rBase, rTip, taper, neck, neckLength, ageFrom, ageTo, steps, phase } = options;
  const neckAt = options.neckAt ?? 0;

  const radii: number[] = [];
  const ages: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const body = rTip + (rBase - rTip) * Math.pow(1 - t, taper);
    /*
     * Three scales of irregularity, none of them in step with the others. A
     * monotonic profile is the last thing standing between this and dowel.
     */
    const nodule =
      1 +
      Math.sin(t * 8.3 + phase) * 0.08 +
      Math.sin(t * 21.1 + phase * 1.9) * 0.05 +
      Math.sin(t * 44.7 + phase * 0.7) * 0.028;
    const thin = 1 - neck * Math.exp(-Math.max(0, t - neckAt) / neckLength);
    radii.push(body * thin * nodule);
    ages.push(ageFrom + (ageTo - ageFrom) * t);
  }

  return {
    points,
    radii,
    ages,
    birth: options.birth,
    life: options.life,
    radial: options.radial,
    order: options.order,
    phase,
  };
}

function radiusAt(host: Strand, t: number) {
  const i = Math.min(host.radii.length - 1, Math.round(t * (host.radii.length - 1)));
  return host.radii[i];
}

function pointAt(host: Strand, t: number) {
  const i = Math.min(host.points.length - 1, Math.round(t * (host.points.length - 1)));
  return host.points[i].clone();
}

function ageAt(host: Strand, t: number) {
  const i = Math.min(host.ages.length - 1, Math.round(t * (host.ages.length - 1)));
  return host.ages[i];
}

export function buildStrands(origin: THREE.Vector3) {
  const random = mulberry32(0x2f11);
  const strands: Strand[] = [];

  /*
   * The radicle. It begins inside the grain, so nothing on screen shows a tube
   * meeting a sphere — what emerges from the shell is already a root, and it is
   * at its thinnest there.
   */
  const tap = strand({
    start: origin,
    direction: new THREE.Vector3(0, -1, 0),
    length: ROOT_DEPTH,
    steps: 44,
    gravity: 0,
    // Enough to read as grown rather than drawn, not enough to wander.
    sinuosity: 0.16,
    phase: 1.4,
    rBase: 0.019,
    rTip: 0.0022,
    taper: 1.35,
    neck: 0.5,
    neckLength: 0.09,
    // The shell's lower pole, as a fraction of the run: origin sits 0.035 above
    // the grain's centre and the coat is 0.083 below it.
    neckAt: 0.118 / ROOT_DEPTH,
    ageFrom: 0,
    ageTo: 0.62,
    birth: 0,
    life: 0.42,
    radial: 16,
    order: 0,
  });
  strands.push(tap);

  /*
   * Three laterals, at three heights, going three ways. Written out rather than
   * sampled: at this count a generator clusters them or mirrors them as often
   * as not, and a system that spreads evenly to both sides is the inverted tree
   * this round exists to remove. The azimuths are deliberately not opposed and
   * the lengths deliberately unequal.
   */
  const plan = [
    // Early, long, out to the left and slightly toward the lens.
    { at: 0.28, azimuth: -0.62, drop: 0.16, length: 0.3, gravity: 0.55, life: 0.2 },
    // Later, shorter, away to the right — it reads as further into the soil.
    { at: 0.55, azimuth: 2.35, drop: 0.42, length: 0.19, gravity: 0.85, life: 0.17 },
    // Low and small, almost following the radicle down.
    { at: 0.79, azimuth: 0.95, drop: 0.78, length: 0.115, gravity: 1.05, life: 0.14 },
  ];

  const laterals: Strand[] = [];
  for (const [index, spec] of plan.entries()) {
    const parentRadius = radiusAt(tap, spec.at);
    const lateral = strand({
      start: pointAt(tap, spec.at),
      direction: new THREE.Vector3(
        Math.cos(spec.azimuth),
        -spec.drop,
        Math.sin(spec.azimuth) * 0.8,
      ),
      length: spec.length,
      steps: 18,
      gravity: spec.gravity,
      sinuosity: 0.17 + index * 0.03,
      phase: 3.1 + index * 4.7,
      rBase: parentRadius * 0.52,
      rTip: 0.0011,
      taper: 1.25,
      neck: 0.42,
      neckLength: 0.09,
      ageFrom: ageAt(tap, spec.at),
      ageTo: 0.95,
      // Cannot exist before the radicle has grown past its own branch point.
      birth: 0.2 + spec.at * 0.4,
      life: spec.life,
      radial: 10,
      order: 1,
    });
    strands.push(lateral);
    laterals.push(lateral);
  }

  /*
   * A handful of tips. Not a generation — just enough that the laterals are
   * visibly dividing rather than ending, which is the whole difference between
   * a system that is growing and one that has been drawn.
   */
  const tips = [
    { host: 0, at: 0.52, azimuth: 0.4, length: 0.075 },
    { host: 0, at: 0.82, azimuth: -1.9, length: 0.05 },
    { host: 1, at: 0.61, azimuth: 1.3, length: 0.045 },
    { host: 2, at: 0.58, azimuth: -0.7, length: 0.032 },
  ];

  for (const tip of tips) {
    const host = laterals[tip.host];
    strands.push(
      strand({
        start: pointAt(host, tip.at),
        direction: new THREE.Vector3(
          Math.cos(tip.azimuth) * 0.85,
          -0.35 - random() * 0.5,
          Math.sin(tip.azimuth) * 0.85,
        ),
        length: tip.length,
        steps: 9,
        gravity: 0.8 + random() * 0.6,
        sinuosity: 0.26,
        phase: random() * 12,
        rBase: radiusAt(host, tip.at) * 0.55,
        rTip: 0.0006,
        taper: 1.15,
        neck: 0.36,
        neckLength: 0.1,
        ageFrom: ageAt(host, tip.at),
        ageTo: 1,
        birth: host.birth + host.life * tip.at * 0.9 + 0.03,
        life: 0.09 + random() * 0.04,
        radial: 7,
        order: 2,
      }),
    );
  }

  // And two on the radicle itself, low down, so it is not a bare shaft.
  for (const spec of [
    { at: 0.62, azimuth: 1.85, length: 0.06 },
    { at: 0.88, azimuth: -1.15, length: 0.038 },
  ]) {
    strands.push(
      strand({
        start: pointAt(tap, spec.at),
        direction: new THREE.Vector3(
          Math.cos(spec.azimuth) * 0.9,
          -0.5 - random() * 0.4,
          Math.sin(spec.azimuth) * 0.9,
        ),
        length: spec.length,
        steps: 9,
        gravity: 0.9,
        sinuosity: 0.24,
        phase: random() * 12,
        rBase: radiusAt(tap, spec.at) * 0.42,
        rTip: 0.0006,
        taper: 1.15,
        neck: 0.4,
        neckLength: 0.1,
        ageFrom: ageAt(tap, spec.at),
        ageTo: 1,
        birth: 0.34 + spec.at * 0.36,
        life: 0.1,
        radial: 7,
        order: 2,
      }),
    );
  }

  const maxGrow = strands.reduce((m, s) => Math.max(m, s.birth + s.life), 0);
  return { strands, maxGrow };
}

/**
 * Sweeps a strand into a tube with a parallel-transport frame.
 *
 * `TubeGeometry` cannot do this: it takes a single radius, so a taper has to be
 * faked afterwards by pulling rings toward the axis — and the fusiform profile
 * every run here uses needs the radius to be free at every ring. Building the
 * rings directly also lets each generation carry its own radial count.
 */
function sweep(strand: Strand, maxGrow: number) {
  const { points, radii, ages, radial, order, phase } = strand;
  const rings = points.length;

  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const previousTangent = new THREE.Vector3();
  const rotation = new THREE.Quaternion();

  const position = new Float32Array(rings * (radial + 1) * 3);
  const centre = new Float32Array(rings * (radial + 1) * 3);
  const grow = new Float32Array(rings * (radial + 1));
  const colour = new Float32Array(rings * (radial + 1) * 3);

  const vertex = new THREE.Vector3();
  /*
   * Dirty cream at the tips, the colour of the soil where it has been in the
   * ground longest — and dark enough overall that the lighting has to reveal it
   * rather than the albedo announcing it. The previous ramp ran bright enough
   * that the roots were the light source of the frame, which is the one thing
   * the note rules out.
   */
  const base = new THREE.Color("#2A1F14");
  const tip = new THREE.Color("#6A5B46");
  const tone = new THREE.Color();

  for (let i = 0; i < rings; i++) {
    if (i === 0) tangent.copy(points[1]).sub(points[0]).normalize();
    else if (i === rings - 1) tangent.copy(points[i]).sub(points[i - 1]).normalize();
    else tangent.copy(points[i + 1]).sub(points[i - 1]).normalize();

    if (i === 0) {
      const helper =
        Math.abs(tangent.y) > 0.94 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      normal.crossVectors(tangent, helper).normalize();
    } else {
      // Carry the frame forward instead of recomputing it, or the tube twists.
      rotation.setFromUnitVectors(previousTangent, tangent);
      normal.applyQuaternion(rotation).normalize();
    }
    previousTangent.copy(tangent);
    binormal.crossVectors(tangent, normal);

    const t = i / (rings - 1);
    tone.copy(base).lerp(tip, Math.min(1, ages[i] * 1.05));

    /*
     * The collar. A branch grows *out of* its parent, and the crotch between
     * them holds shadow no light in this scene can produce — there is no
     * ambient occlusion pass, and at this scale a fork without one reads as two
     * cylinders that happen to intersect.
     */
    const collar = order === 0 ? 1 : 0.34 + 0.66 * Math.min(1, t / 0.16);

    for (let j = 0; j <= radial; j++) {
      const angle = (j / radial) * Math.PI * 2;
      // Not a cylinder: ovality that rotates along the run, plus fine ridging,
      // which is what gives the silhouette something to catch light on.
      const oval =
        1 +
        Math.sin(angle * 2 + t * 5.1 + phase) * 0.13 +
        Math.sin(angle * 3 - t * 3.3) * 0.075 +
        Math.sin(angle * 7 + t * 19.0) * 0.03;
      const r = radii[i] * oval;

      vertex
        .copy(points[i])
        .addScaledVector(normal, Math.cos(angle) * r)
        .addScaledVector(binormal, Math.sin(angle) * r);

      const index = i * (radial + 1) + j;
      position[index * 3] = vertex.x;
      position[index * 3 + 1] = vertex.y;
      position[index * 3 + 2] = vertex.z;
      centre[index * 3] = points[i].x;
      centre[index * 3 + 1] = points[i].y;
      centre[index * 3 + 2] = points[i].z;
      grow[index] = (strand.birth + t * strand.life) / maxGrow;

      // Deep shadow underneath. There is no bounce light down here, and a
      // uniformly lit root floats in front of the soil rather than sitting in it.
      const lift = 0.42 + 0.58 * Math.max(0, Math.cos(angle) * 0.5 + 0.5);
      const crevice = 0.9 + 0.1 * Math.cos(angle * 7 + t * 19.0);
      const shade = lift * crevice * collar;

      colour[index * 3] = tone.r * shade;
      colour[index * 3 + 1] = tone.g * shade;
      colour[index * 3 + 2] = tone.b * shade;
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * (radial + 1) + j;
      const b = a + radial + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("aCenter", new THREE.BufferAttribute(centre, 3));
  geometry.setAttribute("aGrow", new THREE.BufferAttribute(grow, 1));
  geometry.setAttribute("color", new THREE.BufferAttribute(colour, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function buildRootGeometry(origin: THREE.Vector3) {
  const { strands, maxGrow } = buildStrands(origin);
  const parts = strands.map((s) => sweep(s, maxGrow));
  const merged = mergeGeometries(parts, false)!;
  for (const part of parts) part.dispose();
  return { geometry: merged, strands };
}
