import * as THREE from "three";

import { palette } from "@/lib/palette";

/**
 * The grain.
 *
 * The previous pass read as a walnut, and the reason was one line of code: a
 * deep pole-to-pole suture on a tall ovoid. That is the silhouette of a stone
 * fruit pit. A mustard seed is the opposite kind of object — nearly round,
 * barely a millimetre across, dry, matte, the colour of dug earth, its surface
 * covered in a fine reticulate net of shallow grooves with one small scar
 * where it was attached.
 *
 * So: no seam, a near-spherical body pushed out of true by a few broad lumps,
 * a groove network too fine to model carried by the normal map, and a single
 * hilum dimple. Colour, roughness and normal are baked from the *same* relief
 * functions that displace the geometry, so painted detail and modelled detail
 * agree instead of fighting.
 *
 * Deterministic and dependency-free. To swap in a sculpted `.glb`, replace
 * `createSeedGeometry`/`createSeedMaps` — `Seed.tsx` only needs a mesh whose
 * half-height is `SEED_HALF_HEIGHT`.
 */

/** Broad lumps: what stops the silhouette from being a circle at any angle. */
function lumps(x: number, y: number, z: number): number {
  let r = 0.075 * Math.sin(1.9 * x + 0.7) * Math.cos(1.5 * y + 2.2);
  r += 0.055 * Math.sin(1.4 * y + 1.3) * Math.cos(2.1 * z + 0.5);
  r += 0.038 * Math.cos(2.6 * x + 2.1) * Math.sin(1.9 * z + 1.7);
  return r;
}

/**
 * Reticulate groove network. Returns 0 on a groove line and 1 on the plateaus
 * between them.
 *
 * The operator matters: `min` of the three ridge fields carves a groove wherever
 * *any* one of them is near zero, which is a net of intersecting lines. Summing
 * them instead only darkens where all three coincide — isolated blobs, which is
 * what a first pass here produced, and it read as mould rather than as texture.
 */
function reticulum(x: number, y: number, z: number): number {
  // Domain warp first. Evaluating the ridge fields on straight coordinates
  // gives a woven, basket-like regularity; bending the space they are measured
  // in is what turns the same three fields into an irregular net.
  const wx = x + 0.22 * Math.sin(3.9 * y + 1.2) + 0.14 * Math.cos(5.1 * z);
  const wy = y + 0.2 * Math.sin(4.4 * z + 2.6) + 0.13 * Math.cos(4.7 * x);
  const wz = z + 0.24 * Math.sin(3.6 * x + 0.4) + 0.12 * Math.cos(5.6 * y);

  /*
   * Fine. Act II puts the lens a hand's breadth from the grain, and at the
   * coarse spacing this net was first tuned at — legible from half a metre —
   * the grooves come out as long continuous lines across the shoulders and the
   * whole thing reads as a scribbled-on ball. A mustard seed's reticulum is
   * dense enough that at arm's length it is texture, not drawing.
   */
  const a = Math.abs(Math.sin(24.5 * wx + 6.8 * wy));
  const b = Math.abs(Math.sin(21.4 * wy - 9.4 * wz + 1.1));
  const c = Math.abs(Math.sin(28.3 * wz + 6.0 * wx + 2.4));
  return Math.min(1, Math.min(a, Math.min(b, c)) / 0.22);
}

/** Fine wrinkling on top of the net, for the normal map only. */
function wrinkle(x: number, y: number, z: number): number {
  let w = 0.6 * Math.sin(47 * x + 1.4) * Math.cos(43 * y);
  w += 0.3 * Math.sin(89 * y + 0.9) * Math.cos(97 * z);
  return w;
}

/** Direction of the hilum — the scar where the seed was attached. */
const HILUM = new THREE.Vector3(0.34, -0.52, 0.78).normalize();

function hilum(x: number, y: number, z: number): number {
  const dot = x * HILUM.x + y * HILUM.y + z * HILUM.z;
  const angle = Math.acos(Math.max(-1, Math.min(1, dot)));
  return Math.exp(-((angle / 0.2) ** 2));
}

/**
 * Barely off-round. A perfect sphere reads as a primitive; 7% of squash reads
 * as a thing that grew.
 */
const SQUASH = { x: 1.0, y: 0.93, z: 0.965 };

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

    let r = 1 + lumps(x, y, z);
    // Grooves are modelled shallowly and deepened by the normal map; cutting
    // them fully into geometry at this scale just produces shading noise.
    r -= 0.0035 * (1 - reticulum(x, y, z)) ** 1.5;
    r -= 0.05 * hilum(x, y, z);

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
  aoMap: THREE.CanvasTexture;
  dispose: () => void;
};

/**
 * Bakes colour, roughness, occlusion and normal in a single pass over the
 * sphere's UV space. One loop, four outputs — the height field is sampled once
 * and reused, which keeps this near a tenth of a second at 1024×512.
 */
export function createSeedMaps(): SeedMaps {
  const count = MAP_WIDTH * MAP_HEIGHT;
  const height = new Float32Array(count);

  const colour = new ImageData(MAP_WIDTH, MAP_HEIGHT);
  const rough = new ImageData(MAP_WIDTH, MAP_HEIGHT);
  const occlusion = new ImageData(MAP_WIDTH, MAP_HEIGHT);
  const normal = new ImageData(MAP_WIDTH, MAP_HEIGHT);

  const light = new THREE.Color(palette.grainLight);
  const mid = new THREE.Color(palette.grainMid);
  const deep = new THREE.Color(palette.grainDeep);
  const tone = new THREE.Color();
  const dir = new THREE.Vector3();

  for (let py = 0; py < MAP_HEIGHT; py++) {
    const v = (py + 0.5) / MAP_HEIGHT;
    for (let px = 0; px < MAP_WIDTH; px++) {
      const u = (px + 0.5) / MAP_WIDTH;
      const index = py * MAP_WIDTH + px;

      directionAt(u, v, dir);
      const { x, y, z } = dir;

      const broad = lumps(x, y, z);
      const net = reticulum(x, y, z);
      const groove = (1 - net) ** 1.5;
      const scar = hilum(x, y, z);
      const fine = wrinkle(x, y, z);

      height[index] = broad * 7 - groove * 0.8 - scar * 4.2 + fine * 0.22;

      /*
       * Two independent darkeners. Grooves and the scar sink toward umber
       * because they hold shadow; the broad lumps shift tone slightly so the
       * grain does not look uniformly dyed. Earth pigment, not stain.
       */
      const inGroove = Math.min(1, groove * 0.7 + scar * 0.7);
      const facing = Math.min(1, Math.max(0, 0.5 - broad * 6));

      tone.copy(light).lerp(mid, facing);
      tone.lerp(deep, inGroove * 0.24);

      const mottle = 1 + fine * 0.045;
      const o = index * 4;
      colour.data[o] = Math.min(255, tone.r * 255 * mottle);
      colour.data[o + 1] = Math.min(255, tone.g * 255 * mottle);
      colour.data[o + 2] = Math.min(255, tone.b * 255 * mottle);
      colour.data[o + 3] = 255;

      /*
       * Uniformly matte would look like clay, uniformly glossy like plastic.
       * A dry seed is matte with faintly burnished high points, and letting
       * roughness vary is what makes the highlight crawl unevenly on the turn
       * rather than sliding across like a bead on glass.
       */
      const roughness = Math.min(1, 0.74 + inGroove * 0.16 - Math.max(0, broad) * 1.1 - fine * 0.03);
      const r8 = Math.max(0, roughness) * 255;
      rough.data[o] = r8;
      rough.data[o + 1] = r8;
      rough.data[o + 2] = r8;
      rough.data[o + 3] = 255;

      // Baked occlusion in the groove network — the contact shadow of the
      // surface against itself, which no light in the scene can produce.
      const ao = Math.max(0, 1 - inGroove * 0.24) * 255;
      occlusion.data[o] = ao;
      occlusion.data[o + 1] = ao;
      occlusion.data[o + 2] = ao;
      occlusion.data[o + 3] = 255;
    }
  }

  // Normals from the height field's gradient. X wraps so the UV sphere's seam
  // does not show as a hard line.
  const STRENGTH = 1.35;
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
      const len = Math.hypot(nx, ny, 1);
      nx /= len;
      ny /= len;

      const o = (py * MAP_WIDTH + px) * 4;
      normal.data[o] = (nx * 0.5 + 0.5) * 255;
      normal.data[o + 1] = (ny * 0.5 + 0.5) * 255;
      normal.data[o + 2] = (1 / len) * 0.5 * 255 + 127.5;
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
  const aoMap = toTexture(occlusion, false);
  const normalMap = toTexture(normal, false);

  return {
    map,
    roughnessMap,
    normalMap,
    aoMap,
    dispose: () => {
      map.dispose();
      roughnessMap.dispose();
      normalMap.dispose();
      aoMap.dispose();
    },
  };
}

/**
 * Soft elliptical darkening laid right under the seed. The real shadow comes
 * from the shadow map; this only supplies the tight ambient occlusion at the
 * contact point that a shadow map cannot resolve, and which is the difference
 * between an object resting on a surface and one hovering above it.
 */
export function createContactTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(63, 43, 24, 0.55)");
  gradient.addColorStop(0.24, "rgba(63, 43, 24, 0.26)");
  gradient.addColorStop(0.58, "rgba(63, 43, 24, 0.05)");
  gradient.addColorStop(1, "rgba(63, 43, 24, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
