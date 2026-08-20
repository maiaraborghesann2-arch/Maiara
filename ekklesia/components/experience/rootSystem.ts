import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * The root system.
 *
 * The previous build failed on three counts, all of them structural rather than
 * cosmetic, and all three are fixed here by construction rather than by tuning:
 *
 *  1. It hung diagonally. The path was integrated as a sum of steps, each with a
 *     `sin(t)` wobble added to it — and the mean of that wobble over a finite
 *     run is not zero, so every root accumulated a net sideways drift. Paths
 *     here are *evaluated*, not integrated: position is a function of `t`, the
 *     deviation is measured from the axis rather than added to the heading, and
 *     it is multiplied by `t` so it is exactly zero at the origin.
 *  2. The taproot read as one continuous line. It was a near-constant radius
 *     over three units with the first branch a tenth of the way down. Real roots
 *     lose most of their thickness in the first third; the taper here is a power
 *     curve, and laterals start almost immediately.
 *  3. It looked like a tube pushed into a sphere. The taproot now starts *inside*
 *     the grain and flares over its first few centimetres, so the junction is
 *     never on screen — what you see is the root already emerging from the shell.
 */

/** How far the whole system extends below the grain. */
export const ROOT_DEPTH = 2.55;

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

type Strand = {
  points: THREE.Vector3[];
  radii: number[];
  /** Distance from the grain, normalised — drives the colour ramp. */
  ages: number[];
  birth: number;
  life: number;
  radial: number;
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
     * Grows as the square root of the run, not linearly. Linearly, a root is
     * dead straight for its first third and only starts to wander once it is
     * far from the grain — which is precisely the stretch the camera is closest
     * to, so the beat where the radicle is the whole frame came out a matchstick.
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
  /** Extra thickness right at the origin, so the run swells into its parent. */
  flare: number;
  taper: number;
  ageFrom: number;
  ageTo: number;
  birth: number;
  life: number;
  radial: number;
};

function strand(options: StrandOptions): Strand {
  const points = path(options);
  const { rBase, rTip, flare, taper, ageFrom, ageTo, steps } = options;

  const radii: number[] = [];
  const ages: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Power taper. Linear leaves a straw; anything above 1 loses most of the
    // thickness early, which is what a root actually does.
    const body = rTip + (rBase - rTip) * Math.pow(1 - t, taper);
    radii.push(body * (1 + flare * Math.exp(-t * 52)));
    ages.push(ageFrom + (ageTo - ageFrom) * t);
  }

  return {
    points,
    radii,
    ages,
    birth: options.birth,
    life: options.life,
    radial: options.radial,
  };
}

/** Radius of a run at parameter `t`, so a child can be sized to its parent. */
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
   * The taproot. It begins *above* where it becomes visible — inside the grain —
   * so nothing on screen shows a tube meeting a sphere; the flare handles the
   * few centimetres either side of the shell.
   */
  const tap = strand({
    start: origin,
    direction: new THREE.Vector3(0, -1, 0),
    length: ROOT_DEPTH,
    steps: 52,
    gravity: 0,
    sinuosity: 0.13,
    phase: 1.4,
    rBase: 0.0108,
    rTip: 0.0019,
    /*
     * Tight. The flare exists to hide the junction with the shell, which is
     * about a centimetre of run; spread over a tenth of the root it stops being
     * a junction and becomes a cone.
     */
    flare: 0.95,
    taper: 1.05,
    ageFrom: 0,
    ageTo: 0.72,
    birth: 0,
    life: 0.4,
    radial: 12,
  });
  strands.push(tap);

  /*
   * Laterals. Golden-angle azimuths with jitter: evenly spaced angles read as a
   * whorl and purely random ones clump, and both are tells.
   */
  const laterals: Strand[] = [];
  const LATERALS = 13;
  for (let i = 0; i < LATERALS; i++) {
    const at = 0.055 + (i / LATERALS) * 0.87 + (random() - 0.5) * 0.05;
    const azimuth = i * 2.39996 + (random() - 0.5) * 0.9;
    const parentRadius = radiusAt(tap, at);

    // Longer near the top, where the root has been established longest.
    const length = (0.24 + random() ** 0.8 * 1.15) * (1.15 - at * 0.5);
    const lateral = strand({
      start: pointAt(tap, at),
      direction: new THREE.Vector3(
        Math.cos(azimuth),
        -0.12 - random() * 0.3,
        Math.sin(azimuth) * 0.85,
      ),
      length,
      steps: 22,
      gravity: 0.35 + random() * 1.15,
      sinuosity: 0.13 + random() * 0.12,
      phase: random() * 12,
      rBase: parentRadius * (0.5 + random() * 0.22),
      rTip: 0.0013,
      flare: 0.8,
      taper: 1.1,
      ageFrom: ageAt(tap, at),
      ageTo: 0.9,
      /*
       * Cannot exist before the taproot has grown past its own branch point —
       * and held back well beyond that, so there is a stretch of scroll where
       * the frame is one radicle descending and nothing else.
       */
      birth: 0.16 + at * 0.42 + random() * 0.04,
      life: 0.26 + random() * 0.1,
      radial: 9,
    });
    strands.push(lateral);
    laterals.push(lateral);
  }

  // Second order, then a scatter of hairs. Both are what stop the system reading
  // as a trunk with arms.
  const seconds: Strand[] = [];
  for (const lateral of laterals) {
    const branches = 1 + Math.floor(random() * 3);
    for (let i = 0; i < branches; i++) {
      const at = 0.22 + random() * 0.62;
      const azimuth = random() * Math.PI * 2;
      const parentRadius = radiusAt(lateral, at);

      const second = strand({
        start: pointAt(lateral, at),
        direction: new THREE.Vector3(
          Math.cos(azimuth) * 0.8,
          -0.25 - random() * 0.5,
          Math.sin(azimuth) * 0.8,
        ),
        length: 0.14 + random() * 0.38,
        steps: 13,
        gravity: 0.7 + random() * 0.9,
        sinuosity: 0.2 + random() * 0.12,
        phase: random() * 12,
        rBase: parentRadius * (0.52 + random() * 0.2),
        rTip: 0.0009,
        flare: 0.7,
        taper: 1.05,
        ageFrom: ageAt(lateral, at),
        ageTo: 1,
        birth: lateral.birth + lateral.life * at * 0.9 + 0.03,
        life: 0.17 + random() * 0.08,
        radial: 7,
      });
      strands.push(second);
      seconds.push(second);
    }
  }

  for (const second of seconds) {
    if (random() > 0.55) continue;
    const at = 0.3 + random() * 0.5;
    const azimuth = random() * Math.PI * 2;
    strands.push(
      strand({
        start: pointAt(second, at),
        direction: new THREE.Vector3(
          Math.cos(azimuth) * 0.9,
          -0.3 - random() * 0.6,
          Math.sin(azimuth) * 0.9,
        ),
        length: 0.05 + random() * 0.13,
        steps: 7,
        gravity: 0.6 + random() * 0.8,
        sinuosity: 0.28,
        phase: random() * 12,
        rBase: radiusAt(second, at) * 0.6,
        rTip: 0.0007,
        flare: 0.6,
        taper: 1.2,
        ageFrom: ageAt(second, at),
        ageTo: 1,
        birth: second.birth + second.life * at * 0.9 + 0.02,
        life: 0.1 + random() * 0.05,
        radial: 5,
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
 * faked afterwards by pulling rings toward the axis — which works until a run
 * needs to flare *outward* at its base, and every junction in the system needs
 * exactly that. Building the rings directly also lets each generation carry its
 * own radial count, so hair roots cost five vertices a ring instead of twelve.
 */
function sweep(strand: Strand, maxGrow: number) {
  const { points, radii, ages, radial } = strand;
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
  const base = new THREE.Color("#33230F");
  const tip = new THREE.Color("#93805A");
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

    for (let j = 0; j <= radial; j++) {
      const angle = (j / radial) * Math.PI * 2;
      // A root is not a cylinder. A little ovality, phase-shifted along the run,
      // is the difference between a grown thing and extruded pipe.
      const oval = 1 + Math.sin(angle * 2 + t * 5.1) * 0.15 + Math.sin(angle * 3 - t * 3.3) * 0.08;
      // Swellings along the run. A root thickens where laterals leave it and
      // thins between; a perfectly monotonic taper is the last thing standing
      // between this and a length of dowel.
      const knuckle = 1 + Math.sin(t * 29.3 + strand.birth * 40) * 0.1 + Math.sin(t * 11.1) * 0.06;
      const r = radii[i] * oval * knuckle;

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

      // Shade the underside of every run down a little. There is no bounce light
      // three metres inside soil, and a uniformly lit root floats.
      const lift = 0.55 + 0.45 * Math.max(0, Math.cos(angle) * 0.5 + 0.5);
      colour[index * 3] = tone.r * lift;
      colour[index * 3 + 1] = tone.g * lift;
      colour[index * 3 + 2] = tone.b * lift;
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
