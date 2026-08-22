import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Dead roots and organic matter, threaded through the soil.
 *
 * A soil profile is not stones in a void. Most of what you actually see in a
 * macro shot of one is *old* — fibre, dead rootlets, fragments of things that
 * grew there before — and it is what makes the medium read as having a history
 * rather than as a scatter of props. It also gives the depth-of-field pass
 * something at every distance to be soft about, which is most of how a shallow
 * plane of focus reads as a plane at all.
 *
 * Static, dark, and never lit as a subject: this is texture, not cast.
 */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type FilamentOptions = {
  count: number;
  seed: number;
  /** Vertical band the filaments occupy. */
  top: number;
  bottom: number;
  radius: number;
  /** Kept clear for the grain and its roots. */
  keepOut: number;
};

export function createFilaments({
  count,
  seed,
  top,
  bottom,
  radius,
  keepOut,
}: FilamentOptions) {
  const random = mulberry32(seed);
  const parts: THREE.BufferGeometry[] = [];

  const point = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const side = new THREE.Vector3();
  const up = new THREE.Vector3();
  const helper = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const distance = keepOut + random() ** 0.6 * (radius - keepOut);
    const origin = new THREE.Vector3(
      Math.cos(angle) * distance,
      top - random() * (top - bottom),
      Math.sin(angle) * distance,
    );

    // Mostly downward, because that is the direction things grew — but loosely,
    // and a few lie almost flat where a layer once was.
    forward
      .set(random() - 0.5, -0.35 - random() * 0.9, random() - 0.5)
      .normalize();
    helper.set(Math.abs(forward.y) > 0.94 ? 1 : 0, Math.abs(forward.y) > 0.94 ? 0 : 1, 0);
    side.crossVectors(forward, helper).normalize();
    up.crossVectors(side, forward).normalize();

    const length = 0.09 + random() ** 1.6 * 0.62;
    const thickness = 0.0009 + random() * random() * 0.0034;
    const phase = random() * 12;
    const steps = 7;

    const points: THREE.Vector3[] = [];
    for (let j = 0; j <= steps; j++) {
      const t = j / steps;
      point.copy(forward).multiplyScalar(length * t).add(origin);
      const sway = length * 0.3 * t;
      point.addScaledVector(side, Math.sin(t * 5.1 + phase) * sway);
      point.addScaledVector(up, Math.cos(t * 3.9 + phase * 1.4) * sway * 0.7);
      points.push(point.clone());
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const tube = new THREE.TubeGeometry(curve, steps * 2, thickness, 4, false);
    tube.deleteAttribute("uv");
    parts.push(tube);
  }

  const merged = mergeGeometries(parts, false)!;
  for (const part of parts) part.dispose();
  return merged;
}
