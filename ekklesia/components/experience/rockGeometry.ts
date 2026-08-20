import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Stones, as they actually occur in a soil profile.
 *
 * The first pass used a `IcosahedronGeometry(1, 1)` per clod, and every one of
 * them read as exactly what it was: a deliberate polyhedron. Two things give
 * that away — a silhouette made of a countable number of straight edges, and
 * the fact that every stone in the frame is the *same* solid at a different
 * scale and rotation. Subdividing alone does not fix it; a smooth icosphere with
 * noise on it is a potato.
 *
 * So each stone here is built as: a dense sphere, displaced by three octaves of
 * value noise, squashed anisotropically along its own random axes, and then cut
 * by one or two cleave planes — because stones in soil are almost always broken
 * pieces of something larger, and a flat fracture face with a worn rim is the
 * single most recognisable thing about them. Crevice darkening is baked into
 * vertex colours from the same field that displaced the surface, so the shading
 * agrees with the shape instead of being a texture laid over it.
 */

function hash3(ix: number, iy: number, iz: number) {
  let h = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(iz, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function vnoise3(x: number, y: number, z: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = x - ix;
  const fy = y - iy;
  const fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const uz = fz * fz * (3 - 2 * fz);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (dx: number, dy: number, dz: number) => hash3(ix + dx, iy + dy, iz + dz);

  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), ux);
  const x10 = lerp(c(0, 1, 0), c(1, 1, 0), ux);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), ux);
  const x11 = lerp(c(0, 1, 1), c(1, 1, 1), ux);
  return lerp(lerp(x00, x10, uy), lerp(x01, x11, uy), uz);
}

function fbm3(x: number, y: number, z: number, octaves: number) {
  let value = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    value += amp * (vnoise3(x * freq, y * freq, z * freq) - 0.5) * 2;
    amp *= 0.5;
    freq *= 2.07;
  }
  return value;
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A family of distinct stones. Instancing needs one geometry per draw call, so
 * variety has to come from having several — one shape repeated two hundred
 * times is recognisable however you rotate it.
 */
export function createRockGeometries(count: number, seed: number): THREE.BufferGeometry[] {
  const random = mulberry32(seed);
  const rocks: THREE.BufferGeometry[] = [];

  const dark = new THREE.Color("#241A12");
  const light = new THREE.Color("#7A6449");
  const tone = new THREE.Color();

  for (let n = 0; n < count; n++) {
    const geometry = mergeVertices(new THREE.IcosahedronGeometry(1, 3));
    const position = geometry.attributes.position as THREE.BufferAttribute;

    const offset = new THREE.Vector3(random() * 40, random() * 40, random() * 40);
    // Anisotropy is what stops every stone reading as a ball. Real fragments are
    // flattish and longer on one axis than the others.
    const squash = new THREE.Vector3(
      0.8 + random() * 0.38,
      0.68 + random() * 0.4,
      0.78 + random() * 0.36,
    );
    const roughness = 0.16 + random() * 0.16;

    // Fracture faces. One or two, never more — a stone cut on every side is a
    // gemstone, which is the opposite of the note.
    const cleaves: { normal: THREE.Vector3; distance: number }[] = [];
    const cleaveCount = random() < 0.55 ? 1 : 2;
    for (let i = 0; i < cleaveCount; i++) {
      cleaves.push({
        normal: new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize(),
        distance: 0.6 + random() * 0.26,
      });
    }

    const colours = new Float32Array(position.count * 3);
    const p = new THREE.Vector3();

    for (let i = 0; i < position.count; i++) {
      p.fromBufferAttribute(position, i).normalize();

      const field =
        fbm3(p.x * 1.9 + offset.x, p.y * 1.9 + offset.y, p.z * 1.9 + offset.z, 4) * roughness +
        fbm3(p.x * 5.4 + offset.y, p.y * 5.4 + offset.z, p.z * 5.4 + offset.x, 3) * roughness * 0.4;

      p.multiplyScalar(1 + field).multiply(squash);

      for (const cleave of cleaves) {
        const d = p.dot(cleave.normal);
        // Worn, not machined: the rim rolls off over the last fraction rather
        // than meeting the fracture face at a hard edge.
        if (d > cleave.distance) {
          const over = d - cleave.distance;
          /*
           * Remove the overshoot, but only fully once it is deep. Removing a
           * fixed fraction of it — the first attempt — takes away *more* than
           * the overshoot on the deep vertices and hollows the face into a
           * dish, which is what gave the stones a scooped, bean-like read.
           */
          p.addScaledVector(cleave.normal, -over * (over / (over + 0.055)));
        }
      }

      position.setXYZ(i, p.x, p.y, p.z);

      /*
       * Crevices dark, exposed faces light, from the same field that made the
       * shape. Nothing in the scene can compute this occlusion at runtime, and
       * without it a stone is a flat silhouette however good the geometry is.
       */
      tone.copy(dark).lerp(light, Math.min(1, Math.max(0, 0.46 + field * 2.6)));
      colours[i * 3] = tone.r;
      colours[i * 3 + 1] = tone.g;
      colours[i * 3 + 2] = tone.b;
    }

    geometry.setAttribute("color", new THREE.BufferAttribute(colours, 3));
    geometry.computeVertexNormals();
    geometry.deleteAttribute("uv");
    rocks.push(geometry);
  }

  return rocks;
}
