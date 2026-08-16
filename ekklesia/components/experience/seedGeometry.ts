import * as THREE from "three";

import { palette } from "@/lib/palette";

/**
 * Builds the seed as real geometry rather than a billboarded image.
 *
 * Frame 02 of the storyboard asks for "um giro suave revela sua forma" — a turn
 * that *discloses* the object. That only reads if there is a form to disclose,
 * so the silhouette has to change as it rotates. Hence a displaced sphere with
 * an asymmetric profile, a suture seam and a lumpy shell.
 *
 * The displacement is a stack of trigonometric octaves rather than a noise
 * library: it is deterministic, dependency-free, and every term is tweakable by
 * eye. Swap this whole file for a sculpted `.glb` when art direction lands — the
 * choreography in `Seed.tsx` does not care where the geometry came from.
 */
export function createSeedGeometry(): THREE.BufferGeometry {
  // Indexed sphere, so `computeVertexNormals` yields smooth shading.
  const geometry = new THREE.SphereGeometry(1, 128, 96);
  const position = geometry.attributes.position as THREE.BufferAttribute;

  const colors = new Float32Array(position.count * 3);
  const light = new THREE.Color(palette.bark);
  const deep = new THREE.Color(palette.barkDeep);
  const scratch = new THREE.Color();

  const n = new THREE.Vector3();

  for (let i = 0; i < position.count; i++) {
    n.fromBufferAttribute(position, i).normalize();
    const { x, y, z } = n;

    // Ovoid profile: fuller at the base, tapering to a blunt tip.
    let r = 1 - 0.15 * y - 0.09 * y * y;

    // Shell relief, coarse to fine.
    let relief = 0.045 * Math.sin(3.1 * x + 1.7) * Math.cos(2.6 * y + 0.9) * Math.sin(2.9 * z);
    relief += 0.026 * Math.sin(6.7 * y + 0.4) * Math.cos(5.9 * z + 2.1);
    relief += 0.013 * Math.cos(11.3 * x + 0.8) * Math.sin(9.8 * y + 1.4);
    relief += 0.007 * Math.sin(19.1 * z) * Math.cos(17.4 * x);
    r += relief;

    // Suture: a crease running pole to pole, like the seam on a stone fruit pit.
    const seam = Math.exp(-((x / 0.13) ** 2));
    const seamDepth = 0.05 * seam * (1 - 0.4 * Math.abs(y));
    r -= seamDepth;

    // Anisotropic squash applied after the radial work, so the relief does not
    // stretch with it.
    position.setXYZ(i, x * r * 0.9, y * r * 1.34, z * r * 0.96);

    // Bake tonal variation: crevices and the seam read darker.
    const shade = Math.min(1, Math.max(0, 0.5 - relief * 7 + seamDepth * 9));
    scratch.copy(light).lerp(deep, shade * 0.75);
    colors[i * 3] = scratch.r;
    colors[i * 3 + 1] = scratch.g;
    colors[i * 3 + 2] = scratch.b;
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  return geometry;
}

/** Half-height of the unit seed, used to sit it on the ground plane. */
export const SEED_HALF_HEIGHT = 1.34;

/** Radial-gradient sprite standing in for a soft contact shadow. */
export function createShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(58, 42, 26, 0.55)");
  gradient.addColorStop(0.35, "rgba(58, 42, 26, 0.28)");
  gradient.addColorStop(0.7, "rgba(58, 42, 26, 0.06)");
  gradient.addColorStop(1, "rgba(58, 42, 26, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
