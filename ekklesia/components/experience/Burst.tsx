"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { clamp, track, type Keyframe } from "@/lib/math";
import { stageProgress } from "@/lib/scroll/stage";

type Props = {
  /** World height the grains are thrown from. */
  originY: number;
  /** Visibility over the stage clock. */
  amount: Keyframe[];
  /** Stage-clock position where the burst begins. */
  from: number;
  /** How much of the stage clock the burst's own motion occupies. */
  span: number;
  /** How far the grains travel outward, in world units. */
  reach?: number;
  count?: number;
  seed?: number;
};

/** Deterministic PRNG so a burst is identical on every reload. */
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
 * Earth displaced by contact — the landing in Act I, the planting in Act II.
 *
 * Kept very small in both. A seed this size moves almost nothing, and a
 * generous puff would read as a much heavier object than the one the fall spent
 * an entire act establishing. It is here to confirm contact, not to perform it.
 *
 * Scrubbed, not simulated: each grain's position is a closed-form function of
 * progress, so dragging the scroll backwards pulls the dust back into the
 * ground instead of leaving it stranded mid-air. A stateful particle system
 * would break the moment the user scrolls up.
 */
export function Burst({
  originY,
  amount,
  from,
  span,
  reach = 0.62,
  count = 340,
  seed = 0x5eed,
}: Props) {
  const ref = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const height = useThree((state) => state.size.height);

  const { geometry, specs } = useMemo(() => {
    const random = mulberry32(seed);
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const table = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
      table[i * 4] = random() * Math.PI * 2;
      // Contact throws grains outward from the point, not upward from a cloud.
      table[i * 4 + 1] = 0.004 + random() * 0.02;
      table[i * 4 + 2] = 0.07 + random() * 0.34;
      table[i * 4 + 3] = 0.05 + random() * 0.4;

      // Mostly fine haze with a few coarse grains among it.
      sizes[i] = 0.9 + random() * random() * 5.4;
      alphas[i] = 0.25 + random() * 0.75;
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    buffer.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    buffer.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    return { geometry: buffer, specs: table };
  }, [count, seed]);

  const initialUniforms = useMemo(
    () => ({
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color("#6B4A2A") },
      uScale: { value: 5 },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const points = ref.current;
    const uniforms = material.current?.uniforms;
    if (!points || !uniforms) return;

    const p = stageProgress();
    const weight = track(amount, p);

    points.visible = weight > 0.002;
    if (!points.visible) return;

    uniforms.uOpacity.value = weight * 0.8;
    uniforms.uScale.value = height * 0.0055;

    const t = clamp((p - from) / span);
    const attribute = geometry.attributes.position as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const angle = specs[i * 4];
      const radius0 = specs[i * 4 + 1];
      const speed = specs[i * 4 + 2];
      const kick = specs[i * 4 + 3];

      const local = clamp((t - 0.04 * (1 - kick)) / 0.96);
      // Outward fast, then drag; it never travels far.
      const radius = radius0 + speed * (1 - Math.pow(1 - local, 2.4)) * reach;

      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = originY + kick * local * 0.24 - 0.26 * local * local;
      array[i * 3 + 2] = Math.sin(angle) * radius * 0.72;
    }

    attribute.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={initialUniforms}
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
    // Ascending edges: smoothstep with edge0 >= edge1 is undefined in GLSL.
    float a = (1.0 - smoothstep(0.08, 0.5, d)) * vAlpha * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;
