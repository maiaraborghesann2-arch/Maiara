import * as THREE from "three";

import { SEED_PLANTED_Y } from "@/lib/scroll/choreography";

/**
 * The shoot — the other half of the same axis.
 *
 * A seedling is one continuous organ: radicle below the seed, hypocotyl above
 * it, and no seam anywhere. That is why this is not a second object crossfaded
 * over the first. The geometry it produces is merged into the *same mesh* as
 * the roots, carries the same `aGrow` attribute on the same timeline, and is
 * revealed by the same uniform — so at the level of the renderer there is one
 * structure that grows in two directions, which is exactly the claim the
 * narration makes.
 *
 * The seed rides its tip. Mustard germinates epigeally: the hypocotyl arches
 * up and lifts the seed coat out of the ground, where it splits and becomes the
 * first two leaves. So the grain the viewer has followed since the first frame
 * is the thing that breaks the surface — no substitution, no dissolve, and no
 * moment where one object has to hand over to another.
 */

/** Where the axis reverses. Just below the grain's planted position, so the
 *  shoot's base overlaps the radicle's top and there is no gap at the collar. */
const BASE_Y = SEED_PLANTED_Y - 0.05;
/** Where the tip finishes, well clear of the surface at `LANDING_Y`. */
export const SHOOT_TOP_Y = -1.5;

/**
 * How far along the run the grain sits when the shoot has not started. The
 * curve begins below the grain, so `0` is not the grain's position — this is.
 */
export const SHOOT_SEED_START = (SEED_PLANTED_Y - BASE_Y) / (SHOOT_TOP_Y - BASE_Y);

/**
 * Where the shoot's `aGrow` values begin on the shared growth timeline. The
 * roots occupy `0..1`; the shoot is appended just above that, so one uniform
 * reveals both and the two are literally the same object to the renderer.
 */
export const SHOOT_GROW_FROM = 1.08;

const STEPS = 46;
const RADIAL = 16;

function wobble(t: number, phase: number) {
  return (
    Math.sin(t * 3.9 + phase) * 0.5 +
    Math.sin(t * 8.7 + phase * 1.7) * 0.32 +
    Math.sin(t * 17.1 + phase * 2.3) * 0.18
  );
}

const PHASE = 4.7;

/** The axis, as a function of `s` in `0..1`. Deterministic, so the grain can
 *  be placed on it every frame without storing anything. */
export function shootPointAt(s: number, out = new THREE.Vector3()) {
  const t = Math.min(1, Math.max(0, s));
  const height = SHOOT_TOP_Y - BASE_Y;

  /*
   * A lean, not a bend. A hypocotyl pushing through soil is never plumb — it
   * follows whatever gap it can find — but it is also not a corkscrew, and the
   * whole piece has been built on a centre line. The deviation is measured from
   * the axis and scaled by `t`, so it is exactly zero at the collar.
   */
  const sway = 0.055 * Math.pow(t, 1.25);
  out.set(
    wobble(t, PHASE) * sway,
    BASE_Y + height * t,
    wobble(t, PHASE + 19.3) * sway * 0.7,
  );
  return out;
}

function radiusAt(t: number) {
  /*
   * Thicker than the radicle and losing far less of it along the run — a stem
   * carries a growing tip, a root ends in one. The swell just above the collar
   * is where the hypocotyl takes the weight.
   */
  const body = 0.0135 + 0.0105 * Math.exp(-Math.pow((t - 0.22) / 0.42, 2));
  const nodule =
    1 +
    Math.sin(t * 7.1 + PHASE) * 0.055 +
    Math.sin(t * 19.3 + PHASE * 1.9) * 0.035 +
    Math.sin(t * 41.7) * 0.02;
  // Narrows into the grain it is carrying, so the join reads as one thing.
  const collarIn = 1 - 0.34 * Math.exp(-t / 0.05);
  const underSeed = 1 - 0.3 * Math.pow(Math.max(0, t - 0.86) / 0.14, 2);
  return body * nodule * collarIn * underSeed;
}

/**
 * @param growFrom Where this geometry's `aGrow` values begin. The roots occupy
 *   `0..1` of the shared growth timeline; the shoot is appended above it.
 */
export function buildShootGeometry(growFrom: number) {
  const points: THREE.Vector3[] = [];
  const radii: number[] = [];
  for (let i = 0; i <= STEPS; i++) {
    const t = i / STEPS;
    points.push(shootPointAt(t));
    radii.push(radiusAt(t));
  }

  const tangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const previousTangent = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const vertex = new THREE.Vector3();

  const rings = points.length;
  const position = new Float32Array(rings * (RADIAL + 1) * 3);
  const centre = new Float32Array(rings * (RADIAL + 1) * 3);
  const grow = new Float32Array(rings * (RADIAL + 1));
  const colour = new Float32Array(rings * (RADIAL + 1) * 3);

  /*
   * The colour ramp is the whole transformation. It starts on the root's own
   * pigment at the collar, passes through a pale, damp stem, and only arrives
   * at anything vegetal near the tip — and because it is a gradient along a
   * continuous run there is no frame in which the root "becomes" a stem. Sage,
   * not green: this is a seedling that has never seen light.
   */
  const collar = new THREE.Color("#4A3A26");
  const pale = new THREE.Color("#8E846A");
  const vegetal = new THREE.Color("#6A6749");
  const tone = new THREE.Color();

  for (let i = 0; i < rings; i++) {
    if (i === 0) tangent.copy(points[1]).sub(points[0]).normalize();
    else if (i === rings - 1) tangent.copy(points[i]).sub(points[i - 1]).normalize();
    else tangent.copy(points[i + 1]).sub(points[i - 1]).normalize();

    if (i === 0) normal.set(1, 0, 0).cross(tangent).normalize();
    else {
      rotation.setFromUnitVectors(previousTangent, tangent);
      normal.applyQuaternion(rotation).normalize();
    }
    previousTangent.copy(tangent);
    binormal.crossVectors(tangent, normal);

    const t = i / (rings - 1);
    // The vegetal end arrives late and never fully. A stem that has spent its
    // whole life in the dark is barely green at all.
    if (t < 0.5) tone.copy(collar).lerp(pale, t / 0.5);
    else tone.copy(pale).lerp(vegetal, Math.pow((t - 0.5) / 0.5, 1.4));

    for (let j = 0; j <= RADIAL; j++) {
      const angle = (j / RADIAL) * Math.PI * 2;
      const oval =
        1 +
        Math.sin(angle * 2 + t * 4.3 + PHASE) * 0.1 +
        Math.sin(angle * 3 - t * 2.7) * 0.055 +
        Math.sin(angle * 6 + t * 16.0) * 0.025;
      const r = radii[i] * oval;

      vertex
        .copy(points[i])
        .addScaledVector(normal, Math.cos(angle) * r)
        .addScaledVector(binormal, Math.sin(angle) * r);

      const index = i * (RADIAL + 1) + j;
      position[index * 3] = vertex.x;
      position[index * 3 + 1] = vertex.y;
      position[index * 3 + 2] = vertex.z;
      centre[index * 3] = points[i].x;
      centre[index * 3 + 1] = points[i].y;
      centre[index * 3 + 2] = points[i].z;
      grow[index] = growFrom + t;

      const lift = 0.5 + 0.5 * Math.max(0, Math.cos(angle) * 0.5 + 0.5);
      const crevice = 0.92 + 0.08 * Math.cos(angle * 6 + t * 16.0);
      colour[index * 3] = tone.r * lift * crevice;
      colour[index * 3 + 1] = tone.g * lift * crevice;
      colour[index * 3 + 2] = tone.b * lift * crevice;
    }
  }

  const indices: number[] = [];
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < RADIAL; j++) {
      const a = i * (RADIAL + 1) + j;
      const b = a + RADIAL + 1;
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

/**
 * The shared growth uniform. The roots' own track finishes at `1.06`, which is
 * below the shoot's first vertex — so nothing of the shoot exists until Act III
 * moves this past `SHOOT_GROW_FROM`, and nothing of the roots un-grows when it
 * does.
 */
export function shootUniform(rootGrowth: number, shootGrowth: number) {
  return rootGrowth + shootGrowth * 1.02;
}

/** Where along the shoot the growing tip currently is. Negative before it starts. */
export function shootParam(uniform: number) {
  return uniform - SHOOT_GROW_FROM;
}
