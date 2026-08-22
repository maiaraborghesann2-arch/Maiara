import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * The root system.
 *
 * The version before this one was botanically sound and read as wire, and the
 * reason was arithmetic rather than art. Its taproot was eleven thousandths of
 * a unit across and the shot that took it in was five units back: two and a
 * half thousandths of the frame, six pixels, with nine radial segments. At that
 * size a tube has no shading gradient across it, so it cannot read as having a
 * cross-section — it is a stroke with a colour. Everything finer than it was
 * one or two pixels.
 *
 * So the fix is proportion, not radius. A macro photograph of a germinating
 * seed shows three or four seed-widths of root, not thirteen; the system here
 * is now about six times the grain across rather than twenty-five, the lens
 * comes in to match, and the taproot lands at a fifth of the grain's width —
 * which is both what a real radicle looks like and thick enough on screen to
 * be modelled by light.
 *
 * Three other things keep it from reading as drawn:
 *
 *  1. Paths are *evaluated*, never integrated. Summing steps with a `sin(t)`
 *     wobble added to each accumulates a net drift, and every root ends up
 *     leaning the same way.
 *  2. No run has a circular cross-section, a monotonic taper, or a constant
 *     radius — ovality, swellings and nodules all vary along it.
 *  3. Junctions are occluded in the vertex colours. Nothing in the scene can
 *     compute the shadow a branch casts into the crotch it grows out of, and
 *     without it every fork reads as two cylinders intersecting.
 */

/** How far the system reaches below the grain. */
export const ROOT_DEPTH = 1.0;

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
  /** Generation, 0 for the taproot. Children get a shadowed collar. */
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
     * Deviation grows as the square root of the run. Linearly, a root is dead
     * straight for its first third and only starts to wander once it is far
     * from the grain — which is exactly the stretch the camera is closest to.
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
  order: number;
};

function strand(options: StrandOptions): Strand {
  const points = path(options);
  const { rBase, rTip, flare, taper, ageFrom, ageTo, steps, phase } = options;

  const radii: number[] = [];
  const ages: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Power taper. Linear leaves a straw; anything above 1 loses most of the
    // thickness early, which is what a root actually does.
    const body = rTip + (rBase - rTip) * Math.pow(1 - t, taper);
    /*
     * Nodules. A root thickens where a lateral is about to leave it, thins
     * between, and carries a slow swell along its length — three scales of
     * variation, none of them in step with the others. A monotonic taper is
     * the last thing standing between this and a length of dowel.
     */
    const nodule =
      1 +
      Math.sin(t * 9.1 + phase) * 0.07 +
      Math.sin(t * 23.7 + phase * 1.9) * 0.05 +
      Math.sin(t * 47.3 + phase * 0.7) * 0.03;
    radii.push(body * (1 + flare * Math.exp(-t * 13)) * nodule);
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
   * few millimetres either side of the shell.
   */
  const tap = strand({
    start: origin,
    direction: new THREE.Vector3(0, -1, 0),
    length: ROOT_DEPTH,
    steps: 40,
    gravity: 0,
    sinuosity: 0.14,
    phase: 1.4,
    /*
     * Nearly parallel-sided, then blunt. A radicle does not narrow steadily
     * from the seed to a point — it holds most of its thickness and ends. The
     * combination that produced the point was a strong flare on top of a fast
     * taper: fat at the shell, a third of that a few centimetres down, and the
     * whole visible run read as one long spike at the beat where the radicle is
     * the only thing in frame.
     */
    rBase: 0.019,
    rTip: 0.008,
    flare: 0.8,
    taper: 1.5,
    ageFrom: 0,
    ageTo: 0.7,
    birth: 0,
    life: 0.4,
    radial: 16,
    order: 0,
  });
  strands.push(tap);

  /*
   * Laterals. Golden-angle azimuths with jitter: evenly spaced angles read as a
   * whorl and purely random ones clump, and both are tells.
   *
   * Two populations rather than one distribution — a few long runners that
   * strike out sideways and hold the width of the composition, and a majority
   * of shorter ones that stay near the taproot. A single length distribution
   * gives every branch the same weight, which is what makes a root system look
   * like a diagram of itself.
   */
  const laterals: Strand[] = [];
  const LATERALS = 15;
  for (let i = 0; i < LATERALS; i++) {
    const at = 0.06 + (i / LATERALS) * 0.86 + (random() - 0.5) * 0.05;
    const azimuth = i * 2.39996 + (random() - 0.5) * 1.0;
    const parentRadius = radiusAt(tap, at);

    // Which flank a lateral leaves on decides how far it gets to go. Real
    // systems are lopsided — they follow the water and the gaps — and a
    // silhouette balanced about its own axis is the loudest tell there is.
    const favoured = Math.cos(azimuth) > -0.15;
    const runner = random() < (favoured ? 0.48 : 0.16);
    const length = runner
      ? (0.4 + random() * 0.36) * (1.1 - at * 0.6)
      : (0.1 + random() * 0.26) * (1.15 - at * 0.65);

    const lateral = strand({
      start: pointAt(tap, at),
      direction: new THREE.Vector3(
        Math.cos(azimuth),
        runner ? -0.06 - random() * 0.2 : -0.3 - random() * 0.55,
        Math.sin(azimuth) * 0.82,
      ),
      length,
      steps: 20,
      /*
       * The laterals lowest on the taproot pull down least. Given the same
       * gravitropism as the ones near the grain they hang a long way past the
       * tip, and the system's extent stops being something the composition can
       * be framed around.
       */
      gravity: (runner ? 0.3 + random() * 0.5 : 0.55 + random() * 1.0) * (1 - at * 0.55),
      sinuosity: 0.15 + random() * 0.13,
      phase: random() * 12,
      rBase: parentRadius * (0.5 + random() * 0.2),
      rTip: 0.0022,
      flare: 0.7,
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
      radial: 10,
      order: 1,
    });
    strands.push(lateral);
    laterals.push(lateral);
  }

  // Second order, then a scatter of hairs. Both are what stop the system
  // reading as a trunk with arms.
  const seconds: Strand[] = [];
  for (const lateral of laterals) {
    const branches = 2 + Math.floor(random() * 3);
    for (let i = 0; i < branches; i++) {
      const at = 0.18 + random() * 0.7;
      const azimuth = random() * Math.PI * 2;
      const parentRadius = radiusAt(lateral, at);

      const second = strand({
        start: pointAt(lateral, at),
        direction: new THREE.Vector3(
          Math.cos(azimuth) * 0.8,
          -0.2 - random() * 0.6,
          Math.sin(azimuth) * 0.8,
        ),
        length: 0.05 + random() * 0.17,
        steps: 12,
        gravity: 0.6 + random() * 0.9,
        sinuosity: 0.22 + random() * 0.14,
        phase: random() * 12,
        rBase: parentRadius * (0.52 + random() * 0.2),
        rTip: 0.0014,
        flare: 0.6,
        taper: 1.05,
        ageFrom: ageAt(lateral, at),
        ageTo: 1,
        birth: lateral.birth + lateral.life * at * 0.9 + 0.03,
        life: 0.17 + random() * 0.08,
        radial: 8,
        order: 2,
      });
      strands.push(second);
      seconds.push(second);
    }
  }

  for (const second of seconds) {
    if (random() > 0.62) continue;
    const at = 0.28 + random() * 0.55;
    const azimuth = random() * Math.PI * 2;
    strands.push(
      strand({
        start: pointAt(second, at),
        direction: new THREE.Vector3(
          Math.cos(azimuth) * 0.9,
          -0.25 - random() * 0.6,
          Math.sin(azimuth) * 0.9,
        ),
        length: 0.022 + random() * 0.055,
        steps: 7,
        gravity: 0.6 + random() * 0.8,
        sinuosity: 0.3,
        phase: random() * 12,
        rBase: radiusAt(second, at) * 0.6,
        rTip: 0.0009,
        flare: 0.55,
        taper: 1.0,
        ageFrom: ageAt(second, at),
        ageTo: 1,
        birth: second.birth + second.life * at * 0.9 + 0.02,
        life: 0.1 + random() * 0.05,
        radial: 6,
        order: 3,
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
 * own radial count, so a hair root costs six vertices a ring instead of sixteen.
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
   * Damp earth, not gold. The previous ramp ran to an olive-yellow that read as
   * lit from within; a real rootlet against dark soil is warm cream at the tip
   * and the colour of the soil itself where it has been in the ground longest.
   */
  const base = new THREE.Color("#4A3826");
  const tip = new THREE.Color("#A08F76");
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
     * cylinders that happen to intersect. Only children get it; the taproot
     * leaves the grain, which does its own occluding.
     */
    const collar = order === 0 ? 1 : 0.4 + 0.6 * Math.min(1, t / 0.14);

    for (let j = 0; j <= radial; j++) {
      const angle = (j / radial) * Math.PI * 2;
      /*
       * A root is not a cylinder. Ovality that rotates along the run, plus a
       * fine ridging around it, is the difference between a grown thing and
       * extruded pipe — and it is what gives the silhouette something to catch
       * the light on.
       */
      const oval =
        1 +
        Math.sin(angle * 2 + t * 5.1 + phase) * 0.14 +
        Math.sin(angle * 3 - t * 3.3) * 0.08 +
        Math.sin(angle * 7 + t * 19.0) * 0.035;
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

      // Shade the underside of every run down. There is no bounce light a metre
      // inside soil, and a uniformly lit root floats.
      const lift = 0.5 + 0.5 * Math.max(0, Math.cos(angle) * 0.5 + 0.5);
      // Crevices between the ridges hold their own shadow.
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
