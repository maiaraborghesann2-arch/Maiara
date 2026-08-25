import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { SHOOT_TOP_Y, shootPointAt } from "./shootSystem";

/**
 * The young plant — the axis continuing above the cotyledons.
 *
 * Same principle as the shoot, one storey up: this is not a new plant swapped
 * in for the sprout, it is the epicotyl carrying on from the node the
 * hypocotyl ended at. It merges into the *same mesh* as the roots and the
 * shoot, extends the *same* `aGrow` timeline, and is revealed by the *same*
 * uniform. Root tip to leaf tip is one object with one growth parameter, which
 * is why nothing here can drift out of step with anything else, in either
 * scroll direction.
 *
 * Leaves grow the same way. Their vertices collapse to the nearest point on
 * their own midrib rather than to a single origin, and their birth times run
 * faster along the midrib than across the lamina — so a leaf puts out its rib
 * first and fills in behind it, which is what unfurling looks like. No separate
 * animation, no second clock.
 */

/** Where the axis finishes at the end of the act. */
export const PLANT_TOP_Y = -0.76;
/** Where the aGrow values for this storey begin, above the shoot's `1.08..2.08`. */
export const PLANT_GROW_FROM = 2.12;

const STEM_STEPS = 40;
const STEM_RADIAL = 14;

function wobble(t: number, phase: number) {
  return (
    Math.sin(t * 3.4 + phase) * 0.52 +
    Math.sin(t * 8.1 + phase * 1.7) * 0.31 +
    Math.sin(t * 16.7 + phase * 2.3) * 0.17
  );
}

const NODE = shootPointAt(1);
const PHASE = 2.3;

/** The stem's axis. Deterministic, so leaves can be hung off it by parameter. */
function stemPointAt(t: number, out = new THREE.Vector3()) {
  const height = PLANT_TOP_Y - SHOOT_TOP_Y;
  // Leans as it goes, the way a seedling reaching for light does — and the
  // deviation is measured from the axis, so it is exactly zero at the node.
  const sway = 0.09 * Math.pow(t, 1.3);
  out.set(
    NODE.x + wobble(t, PHASE) * sway + t * t * 0.045,
    SHOOT_TOP_Y + height * t,
    NODE.z + wobble(t, PHASE + 17.1) * sway * 0.6,
  );
  return out;
}

function stemRadiusAt(t: number) {
  // Picks up almost exactly where the hypocotyl left off, swells a little as it
  // takes the weight of the leaves, and thins into the growing tip.
  const body = 0.0098 + 0.0032 * Math.exp(-Math.pow((t - 0.3) / 0.4, 2)) - 0.0058 * t * t;
  const nodule =
    1 + Math.sin(t * 9.7 + PHASE) * 0.05 + Math.sin(t * 23.1) * 0.03;
  return Math.max(0.0018, body) * nodule;
}

type Sweep = {
  points: THREE.Vector3[];
  radii: number[];
  radial: number;
  birth: number;
  life: number;
  /** Base and tip pigment. */
  from: THREE.Color;
  to: THREE.Color;
};

function sweepTube({ points, radii, radial, birth, life, from, to }: Sweep) {
  const rings = points.length;
  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const previous = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const vertex = new THREE.Vector3();
  const tone = new THREE.Color();

  const position = new Float32Array(rings * (radial + 1) * 3);
  const centre = new Float32Array(rings * (radial + 1) * 3);
  const grow = new Float32Array(rings * (radial + 1));
  const colour = new Float32Array(rings * (radial + 1) * 3);

  for (let i = 0; i < rings; i++) {
    if (i === 0) tangent.copy(points[1]).sub(points[0]).normalize();
    else if (i === rings - 1) tangent.copy(points[i]).sub(points[i - 1]).normalize();
    else tangent.copy(points[i + 1]).sub(points[i - 1]).normalize();

    if (i === 0) {
      const helper =
        Math.abs(tangent.y) > 0.94 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      normal.crossVectors(tangent, helper).normalize();
    } else {
      rotation.setFromUnitVectors(previous, tangent);
      normal.applyQuaternion(rotation).normalize();
    }
    previous.copy(tangent);
    binormal.crossVectors(tangent, normal);

    const t = i / (rings - 1);
    tone.copy(from).lerp(to, t);

    for (let j = 0; j <= radial; j++) {
      const angle = (j / radial) * Math.PI * 2;
      const oval =
        1 + Math.sin(angle * 2 + t * 4.1 + PHASE) * 0.085 + Math.sin(angle * 5 + t * 13.0) * 0.03;
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
      grow[index] = birth + t * life;

      const lift = 0.56 + 0.44 * Math.max(0, Math.cos(angle) * 0.5 + 0.5);
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

type LeafOptions = {
  attach: THREE.Vector3;
  /** Direction the petiole leaves the stem in. */
  azimuth: number;
  elevation: number;
  /**
   * How far the blade is rolled about its own petiole.
   *
   * Held flat — normal straight up, which is where a textbook draws it — a leaf
   * is edge-on to a lens at its own height and reads as a needle. Real leaves
   * are not flat either: they twist on the petiole to put their face where the
   * light is, and here the light and the viewer are in the same place.
   */
  roll: number;
  length: number;
  width: number;
  /** Seeded variation so no two blades are the same shape. */
  phase: number;
  birth: number;
  life: number;
};

const ALONG = 17;
const ACROSS = 9;
const THICKNESS = 0.00085;

/**
 * One leaf: a petiole and a blade, the blade built as two sheets a fraction of
 * a millimetre apart.
 *
 * A single double-sided surface is the obvious build and it is what makes CG
 * foliage read as paper — there is no edge to catch light and the underside is
 * the same colour as the top. Two sheets cost a few hundred vertices and buy
 * both: a real rim, and an underside that is paler and greyer the way the
 * abaxial face of a real leaf is.
 */
function buildLeaf(options: LeafOptions) {
  const { attach, azimuth, elevation, roll, length, width, phase, birth, life } = options;

  const out = new THREE.Vector3(
    Math.cos(azimuth),
    elevation,
    Math.sin(azimuth),
  ).normalize();
  const side = new THREE.Vector3().crossVectors(out, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(side, out).normalize();
  side.applyAxisAngle(out, roll);
  up.applyAxisAngle(out, roll);

  const parts: THREE.BufferGeometry[] = [];

  // Petiole: short, thin, and it droops a little under the blade.
  const petioleLength = length * 0.3;
  const petiolePoints: THREE.Vector3[] = [];
  const petioleRadii: number[] = [];
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    petiolePoints.push(
      new THREE.Vector3()
        .copy(out)
        .multiplyScalar(petioleLength * t)
        .add(attach)
        .addScaledVector(up, -0.1 * petioleLength * t * t),
    );
    petioleRadii.push(0.0028 * (1 - 0.35 * t));
  }
  parts.push(
    sweepTube({
      points: petiolePoints,
      radii: petioleRadii,
      radial: 6,
      birth,
      life: life * 0.28,
      from: new THREE.Color("#6E7A50"),
      to: new THREE.Color("#7C8757"),
    }),
  );

  const base = petiolePoints[petiolePoints.length - 1];
  const bladeLength = length * 0.7;

  const face = new THREE.Color("#66753F");
  const faceTip = new THREE.Color("#85936A");
  const backing = new THREE.Color("#8C947A");
  const vein = new THREE.Color("#8B9770");
  const tone = new THREE.Color();

  for (const sheet of [0, 1]) {
    const count = (ALONG + 1) * (ACROSS + 1);
    const position = new Float32Array(count * 3);
    const centre = new Float32Array(count * 3);
    const grow = new Float32Array(count);
    const colour = new Float32Array(count * 3);
    const indices: number[] = [];

    const point = new THREE.Vector3();
    const rib = new THREE.Vector3();

    for (let i = 0; i <= ALONG; i++) {
      const v = i / ALONG;
      // Ovate, drawn to a soft point, with a gently wavy margin — a mustard
      // leaf is lobed, and even suggesting that is enough at this size.
      let half = width * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.62)), 0.85);
      half *= 1 + 0.05 * Math.sin(v * 9.0 + phase) + 0.028 * Math.sin(v * 19.0 + phase * 2.1);
      if (sheet === 1) half *= 0.985;

      // The midrib itself dips and the blade droops away from the stem.
      const droop = -0.22 * v * v * bladeLength;
      const arch = 0.06 * Math.sin(v * Math.PI) * bladeLength;
      rib.copy(out)
        .multiplyScalar(bladeLength * v)
        .add(base)
        .addScaledVector(up, droop + arch);

      for (let j = 0; j <= ACROSS; j++) {
        const u = (j / ACROSS) * 2 - 1;
        const across = u * half;
        // Cupped, and the cup deepens toward the base.
        const cup = (1 - u * u) * half * (0.26 - 0.12 * v);
        // A ridge on the midrib and shallow creases along the lateral veins,
        // so the light has something to break on.
        const veinField = Math.abs(Math.sin((v * 6.2 - Math.abs(u) * 2.1) * Math.PI));
        const crease = veinField > 0.9 ? (veinField - 0.9) * 0.006 : 0;
        const midribRidge = Math.max(0, 1 - Math.abs(u) * 9) * 0.004;

        point
          .copy(rib)
          .addScaledVector(side, across)
          .addScaledVector(up, cup + crease + midribRidge);

        if (sheet === 1) point.addScaledVector(up, -THICKNESS);

        const index = i * (ACROSS + 1) + j;
        position[index * 3] = point.x;
        position[index * 3 + 1] = point.y;
        position[index * 3 + 2] = point.z;
        // Collapses to its own midrib, not to a single point: the rib appears
        // first and the lamina fills in behind it.
        centre[index * 3] = rib.x;
        centre[index * 3 + 1] = rib.y;
        centre[index * 3 + 2] = rib.z;
        grow[index] = birth + life * 0.28 + (0.56 * v + 0.44 * Math.abs(u)) * life * 0.72;

        if (sheet === 0) {
          tone.copy(face).lerp(faceTip, v * 0.8 + Math.abs(u) * 0.2);
          if (veinField > 0.93 || Math.abs(u) < 0.05) tone.lerp(vein, 0.55);
        } else {
          tone.copy(backing);
        }
        colour[index * 3] = tone.r;
        colour[index * 3 + 1] = tone.g;
        colour[index * 3 + 2] = tone.b;
      }
    }

    for (let i = 0; i < ALONG; i++) {
      for (let j = 0; j < ACROSS; j++) {
        const a = i * (ACROSS + 1) + j;
        const b = a + ACROSS + 1;
        // The lower sheet faces the other way, or it is culled from below.
        if (sheet === 0) indices.push(a, b, a + 1, b, b + 1, a + 1);
        else indices.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
    geometry.setAttribute("aCenter", new THREE.BufferAttribute(centre, 3));
    geometry.setAttribute("aGrow", new THREE.BufferAttribute(grow, 1));
    geometry.setAttribute("color", new THREE.BufferAttribute(colour, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    parts.push(geometry);
  }

  return parts;
}

export function buildPlantGeometry() {
  const parts: THREE.BufferGeometry[] = [];

  const stemPoints: THREE.Vector3[] = [];
  const stemRadii: number[] = [];
  for (let i = 0; i <= STEM_STEPS; i++) {
    const t = i / STEM_STEPS;
    stemPoints.push(stemPointAt(t));
    stemRadii.push(stemRadiusAt(t));
  }

  parts.push(
    sweepTube({
      points: stemPoints,
      radii: stemRadii,
      radial: STEM_RADIAL,
      birth: PLANT_GROW_FROM,
      life: 1,
      // Starts on the hypocotyl's own tip pigment and greens with height. Any
      // step here lands exactly where the piece claims nothing changes.
      from: new THREE.Color("#6A6749"),
      to: new THREE.Color("#78864F"),
    }),
  );

  /*
   * Four leaves on a spiral, and two short side shoots carrying one each.
   *
   * The golden angle is what a real stem uses and it is also what stops the
   * arrangement reading as opposite pairs — which at six leaves is the whole
   * difference between a plant and a diagram. Sizes fall off toward the top
   * because the leaves up there are younger, and every blade gets its own
   * phase, so no two are the same shape.
   */
  const leaves = [
    { at: 0.15, azimuth: -0.22, roll: -1.0, length: 0.22, width: 0.075 },
    { at: 0.36, azimuth: Math.PI + 0.34, roll: 1.15, length: 0.195, width: 0.066 },
    { at: 0.57, azimuth: 0.42, roll: -0.85, length: 0.165, width: 0.055 },
    { at: 0.85, azimuth: Math.PI - 0.28, roll: 1.0, length: 0.115, width: 0.039 },
  ];

  for (const [index, leaf] of leaves.entries()) {
    parts.push(
      ...buildLeaf({
        attach: stemPointAt(leaf.at),
        azimuth: leaf.azimuth,
        elevation: 0.36 - leaf.at * 0.08,
        roll: leaf.roll,
        length: leaf.length,
        width: leaf.width,
        phase: 1.7 + index * 3.3,
        birth: PLANT_GROW_FROM + leaf.at * 0.72 + 0.06,
        life: 0.3,
      }),
    );
  }

  const branches = [
    { at: 0.46, azimuth: -0.5, roll: -1.05, length: 0.115, leaf: 0.095 },
    { at: 0.67, azimuth: Math.PI + 0.62, roll: 1.1, length: 0.085, leaf: 0.07 },
  ];

  for (const [index, branch] of branches.entries()) {
    const attach = stemPointAt(branch.at);
    const out = new THREE.Vector3(
      Math.cos(branch.azimuth),
      0.72,
      Math.sin(branch.azimuth),
    ).normalize();

    const points: THREE.Vector3[] = [];
    const radii: number[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      points.push(
        new THREE.Vector3()
          .copy(out)
          .multiplyScalar(branch.length * t)
          .add(attach)
          .addScaledVector(new THREE.Vector3(0, 1, 0), 0.12 * branch.length * t * t),
      );
      radii.push(0.0042 * (1 - 0.55 * t) * (1 + Math.sin(t * 14 + index) * 0.06));
    }

    const birth = PLANT_GROW_FROM + branch.at * 0.72 + 0.14;
    parts.push(
      sweepTube({
        points,
        radii,
        radial: 8,
        birth,
        life: 0.22,
        from: new THREE.Color("#6D7550"),
        to: new THREE.Color("#77835A"),
      }),
    );
    parts.push(
      ...buildLeaf({
        attach: points[points.length - 1],
        azimuth: branch.azimuth + 0.35,
        elevation: 0.4,
        roll: branch.roll,
        length: branch.leaf,
        width: branch.leaf * 0.32,
        phase: 5.1 + index * 4.7,
        birth: birth + 0.16,
        life: 0.24,
      }),
    );
  }

  const merged = mergeGeometries(parts, false)!;
  for (const part of parts) part.dispose();
  return merged;
}

/**
 * The one growth uniform, for the whole organism.
 *
 * Roots hold `0..1` of it, the shoot `1.08..2.08`, the plant `2.12..3.12`. Each
 * act adds its own term and none of them can run backwards over another, so a
 * scrub anywhere in the piece lands every vertex of every storey at exactly the
 * state it was in on the way down.
 */
export function axisUniform(rootGrowth: number, shootGrowth: number, plantGrowth: number) {
  return rootGrowth + shootGrowth * 1.02 + plantGrowth * 1.04;
}
