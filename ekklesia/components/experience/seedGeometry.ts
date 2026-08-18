import * as THREE from "three";

import { palette } from "@/lib/palette";

/**
 * The seed as a physical object.
 *
 * Three things separate "a real thing sitting in light" from "a 3D sphere":
 * an asymmetric silhouette, surface relief that survives close inspection, and
 * a material that varies across that surface. This file produces all three
 * procedurally — geometry, plus colour / roughness / normal maps generated from
 * the *same* relief function, so the painted detail lines up with the modelled
 * detail instead of floating on top of it.
 *
 * Deterministic and dependency-free. Swap the whole file for a sculpted `.glb`
 * when art direction lands; `Seed.tsx` does not care where the mesh came from.
 */

/** Coarse shell relief — shared by the geometry and the texture maps. */
function shellRelief(x: number, y: number, z: number): number {
  let r = 0.045 * Math.sin(3.1 * x + 1.7) * Math.cos(2.6 * y + 0.9) * Math.sin(2.9 * z);
  r += 0.026 * Math.sin(6.7 * y + 0.4) * Math.cos(5.9 * z + 2.1);
  r += 0.013 * Math.cos(11.3 * x + 0.8) * Math.sin(9.8 * y + 1.4);
  r += 0.007 * Math.sin(19.1 * z) * Math.cos(17.4 * x);
  return r;
}

/** The suture running pole to pole, like the seam on a stone-fruit pit. */
function seamDepth(x: number, y: number): number {
  const seam = Math.exp(-((x / 0.13) ** 2));
  return 0.05 * seam * (1 - 0.4 * Math.abs(y));
}

/** Micro-relief: too fine to model, carried entirely by the normal map. */
function microRelief(x: number, y: number, z: number): number {
  let m = 0.5 * Math.sin(41 * x + 2.1) * Math.cos(37 * y) * Math.sin(43 * z + 1.2);
  m += 0.3 * Math.sin(79 * y + 0.7) * Math.cos(83 * z);
  m += 0.2 * Math.sin(151 * z + 1.9) * Math.cos(147 * x);
  return m;
}

/** Scattered pores, the pockmarks a dried shell picks up. */
function pores(x: number, y: number, z: number): number {
  const v = Math.sin(23.3 * x + 1.1) * Math.sin(21.7 * y + 2.6) * Math.sin(27.1 * z + 0.4);
  return Math.max(0, v - 0.74) / 0.26;
}

/** Anisotropic squash applied after the radial work. */
const SQUASH = { x: 0.88, y: 1.36, z: 0.95 };

/** Half-height of the unit seed, used to sit it on the ground plane. */
export const SEED_HALF_HEIGHT = SQUASH.y;

export function createSeedGeometry(): THREE.BufferGeometry {
  // Indexed sphere, so `computeVertexNormals` yields smooth shading and the
  // built-in UVs stay usable for the maps below.
  const geometry = new THREE.SphereGeometry(1, 192, 128);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const n = new THREE.Vector3();

  for (let i = 0; i < position.count; i++) {
    n.fromBufferAttribute(position, i).normalize();
    const { x, y, z } = n;

    // Ovoid profile: fuller at the base, tapering to a blunt tip, with one
    // shoulder slightly heavier than the other so no two turns look alike.
    let r = 1 - 0.15 * y - 0.09 * y * y + 0.028 * x * (1 - y * y);
    r += shellRelief(x, y, z);
    r -= seamDepth(x, y);

    position.setXYZ(i, x * r * SQUASH.x, y * r * SQUASH.y, z * r * SQUASH.z);
  }

  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

const MAP_WIDTH = 1024;
const MAP_HEIGHT = 512;

/** Recovers the sphere direction a texel sits on, matching SphereGeometry's UVs. */
function directionAt(u: number, v: number, out: THREE.Vector3) {
  const phi = u * Math.PI * 2;
  const theta = (1 - v) * Math.PI;
  const sinTheta = Math.sin(theta);
  return out.set(-Math.cos(phi) * sinTheta, Math.cos(theta), Math.sin(phi) * sinTheta);
}

export type SeedMaps = {
  map: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  dispose: () => void;
};

/**
 * Bakes colour, roughness and normal in a single pass over the sphere's UV
 * space. One loop, three outputs — the height field is sampled once and reused,
 * which keeps this to roughly a tenth of a second at 1024×512.
 */
export function createSeedMaps(): SeedMaps {
  const count = MAP_WIDTH * MAP_HEIGHT;
  const height = new Float32Array(count);

  const colour = new ImageData(MAP_WIDTH, MAP_HEIGHT);
  const rough = new ImageData(MAP_WIDTH, MAP_HEIGHT);
  const normal = new ImageData(MAP_WIDTH, MAP_HEIGHT);

  const light = new THREE.Color(palette.bark);
  const mid = new THREE.Color(palette.barkMid);
  const deep = new THREE.Color(palette.barkDeep);
  const tone = new THREE.Color();
  const dir = new THREE.Vector3();

  for (let py = 0; py < MAP_HEIGHT; py++) {
    const v = (py + 0.5) / MAP_HEIGHT;
    for (let px = 0; px < MAP_WIDTH; px++) {
      const u = (px + 0.5) / MAP_WIDTH;
      const index = py * MAP_WIDTH + px;

      directionAt(u, v, dir);
      const { x, y, z } = dir;

      const coarse = shellRelief(x, y, z);
      const seam = seamDepth(x, y);
      const micro = microRelief(x, y, z);
      const pore = pores(x, y, z);

      height[index] = coarse * 9 + micro * 0.32 - seam * 11 - pore * 0.9;

      // Colour: crevices and the seam sink toward the deepest brown, raised
      // shoulders catch the lighter one. Pores punch darker still.
      const sink = Math.min(1, Math.max(0, 0.5 - coarse * 7 + seam * 9));
      tone.copy(light).lerp(mid, sink);
      tone.lerp(deep, Math.min(1, sink * 0.34 + pore * 0.26));

      // Fine mottling so no two square millimetres read identically.
      const mottle = 1 + micro * 0.055;
      const o = index * 4;
      colour.data[o] = Math.min(255, tone.r * 255 * mottle);
      colour.data[o + 1] = Math.min(255, tone.g * 255 * mottle);
      colour.data[o + 2] = Math.min(255, tone.b * 255 * mottle);
      colour.data[o + 3] = 255;

      // Rougher where the shell is pitted or creased, tighter on the polished
      // shoulders — this is what makes the highlight travel unevenly on turn.
      const roughness = Math.min(1, 0.56 + sink * 0.28 + pore * 0.14 - micro * 0.045);
      const r8 = roughness * 255;
      rough.data[o] = r8;
      rough.data[o + 1] = r8;
      rough.data[o + 2] = r8;
      rough.data[o + 3] = 255;
    }
  }

  // Normals from the height field's gradient. X wraps so the seam of the UV
  // sphere does not show as a hard line.
  const STRENGTH = 2.4;
  for (let py = 0; py < MAP_HEIGHT; py++) {
    const up = Math.max(0, py - 1);
    const down = Math.min(MAP_HEIGHT - 1, py + 1);
    for (let px = 0; px < MAP_WIDTH; px++) {
      const left = (px - 1 + MAP_WIDTH) % MAP_WIDTH;
      const right = (px + 1) % MAP_WIDTH;

      const dx = height[py * MAP_WIDTH + right] - height[py * MAP_WIDTH + left];
      const dy = height[down * MAP_WIDTH + px] - height[up * MAP_WIDTH + px];

      let nx = -dx * STRENGTH;
      let ny = -dy * STRENGTH;
      const nz = 1;
      const len = Math.hypot(nx, ny, nz);
      nx /= len;
      ny /= len;

      const o = (py * MAP_WIDTH + px) * 4;
      normal.data[o] = (nx * 0.5 + 0.5) * 255;
      normal.data[o + 1] = (ny * 0.5 + 0.5) * 255;
      normal.data[o + 2] = (nz / len) * 0.5 * 255 + 127.5;
      normal.data[o + 3] = 255;
    }
  }

  const toTexture = (data: ImageData, srgb: boolean) => {
    const canvas = document.createElement("canvas");
    canvas.width = MAP_WIDTH;
    canvas.height = MAP_HEIGHT;
    canvas.getContext("2d")!.putImageData(data, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.anisotropy = 8;
    return texture;
  };

  const map = toTexture(colour, true);
  const roughnessMap = toTexture(rough, false);
  const normalMap = toTexture(normal, false);

  return {
    map,
    roughnessMap,
    normalMap,
    dispose: () => {
      map.dispose();
      roughnessMap.dispose();
      normalMap.dispose();
    },
  };
}

/**
 * Soft elliptical darkening laid right under the seed. The real shadow comes
 * from the shadow map; this only supplies the tight ambient occlusion that a
 * shadow map cannot resolve at the contact point.
 */
export function createContactTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(74, 48, 26, 0.5)");
  gradient.addColorStop(0.28, "rgba(74, 48, 26, 0.24)");
  gradient.addColorStop(0.62, "rgba(74, 48, 26, 0.05)");
  gradient.addColorStop(1, "rgba(74, 48, 26, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
