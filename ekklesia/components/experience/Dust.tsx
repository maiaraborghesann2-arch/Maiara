"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { clamp, track } from "@/lib/math";
import { progressStore } from "@/lib/scroll/progressStore";
import { ACT_ONE, beatProgress } from "@/lib/scroll/acts";
import { GROUND_Y, dust } from "@/lib/scroll/choreography";

const COUNT = 520;

/** Deterministic PRNG so the burst is identical on every reload. */
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
 * The soil kicked up as the seed releases in frame 03.
 *
 * Scrubbed, not simulated: each particle's position is a closed-form function
 * of the beat's progress, so dragging the scroll backwards pulls the dust back
 * into the ground instead of leaving it stranded mid-air. A stateful particle
 * system would break the moment the user scrolls up.
 *
 * The custom material exists for two reasons `PointsMaterial` cannot serve:
 * per-particle size and opacity (a cloud of identical dots reads as a texture,
 * not as dust), and a soft circular falloff instead of the hard square sprite
 * that made the first pass look like grit.
 */
export function Dust() {
  const ref = useRef<THREE.Points>(null);
  /**
   * Uniforms are mutated through the material's own ref rather than through the
   * object handed to the `uniforms` prop. Those are not always the same object,
   * and when they diverge the writes land on a detached copy — the burst then
   * renders at its initial values (opacity zero) and vanishes without an error.
   */
  const material = useRef<THREE.ShaderMaterial>(null);
  const height = useThree((state) => state.size.height);

  const { geometry, specs } = useMemo(() => {
    const random = mulberry32(0x5eed);
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const alphas = new Float32Array(COUNT);
    const table = new Float32Array(COUNT * 4);

    for (let i = 0; i < COUNT; i++) {
      table[i * 4] = random() * Math.PI * 2;
      // Start clustered near the contact point.
      table[i * 4 + 1] = 0.008 + random() * 0.045;
      // Outward speed.
      table[i * 4 + 2] = 0.06 + random() * 0.4;
      // Upward kick, plus a stagger so the burst does not fire as one wall.
      table[i * 4 + 3] = 0.08 + random() * 0.6;

      // Wide size spread: a few coarse grains among a lot of fine haze.
      sizes[i] = 0.8 + random() * random() * 5.4;
      alphas[i] = 0.3 + random() * 0.7;
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    buffer.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    buffer.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    return { geometry: buffer, specs: table };
  }, []);

  const uniforms = useMemo(
    () => ({
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color("#71482A") },
      uScale: { value: 5 },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const points = ref.current;
    const uniforms = material.current?.uniforms;
    if (!points || !uniforms) return;

    const p = progressStore.get();
    const amount = track(dust.amount, p);

    points.visible = amount > 0.002;
    if (!points.visible) return;

    uniforms.uOpacity.value = amount * 0.8;
    // Pixels per world unit at the seed's depth. Tuned by eye rather than
    // derived: the point size that reads as airborne soil is a look, not a
    // projection.
    uniforms.uScale.value = height * 0.0055;

    const t = beatProgress(ACT_ONE.queda, p);
    const attribute = geometry.attributes.position as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      const angle = specs[i * 4];
      const radius0 = specs[i * 4 + 1];
      const speed = specs[i * 4 + 2];
      const kick = specs[i * 4 + 3];

      // Stagger: particles with a stronger kick leave a touch earlier.
      const local = clamp((t - 0.05 * (1 - kick)) / 0.95);
      const radius = radius0 + speed * local * 0.72;

      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = GROUND_Y + kick * local * 0.3 - 0.4 * local * local;
      array[i * 3 + 2] = Math.sin(angle) * radius * 0.7;
    }

    attribute.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
      />
    </points>
  );
}

const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uScale;
  varying float vAlpha;

  void main() {
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(0.1, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    // Ascending edges: smoothstep with edge0 >= edge1 is undefined in GLSL and
    // some drivers simply return 0, which silently erases the whole burst.
    float a = (1.0 - smoothstep(0.1, 0.5, d)) * vAlpha * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;
