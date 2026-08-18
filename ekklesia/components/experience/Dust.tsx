"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { clamp, track } from "@/lib/math";
import { progressStore } from "@/lib/scroll/progressStore";
import { LANDING_Y, dust } from "@/lib/scroll/choreography";

const COUNT = 340;

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
 * The earth displaced where the grain lands.
 *
 * Keyed to impact rather than release, and kept very small: a seed this size
 * moves almost nothing, and a generous puff would read as a much heavier object
 * than the one we spent the whole fall establishing. It is here to confirm
 * contact, not to perform it.
 *
 * Scrubbed, not simulated — each particle's position is a closed-form function
 * of progress, so dragging the scroll backwards pulls the dust back into the
 * ground instead of leaving it stranded mid-air. A stateful particle system
 * would break the moment the user scrolls up.
 */
export function Dust() {
  const ref = useRef<THREE.Points>(null);
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
      // Impact throws outward from the contact point, not upward from a cloud.
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
  }, []);

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

    const p = progressStore.get();
    const amount = track(dust.amount, p);

    points.visible = amount > 0.002;
    if (!points.visible) return;

    uniforms.uOpacity.value = amount * 0.8;
    uniforms.uScale.value = height * 0.0055;

    // Local time since impact, over the window the burst occupies.
    const t = clamp((p - 0.745) / 0.175);
    const attribute = geometry.attributes.position as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      const angle = specs[i * 4];
      const radius0 = specs[i * 4 + 1];
      const speed = specs[i * 4 + 2];
      const kick = specs[i * 4 + 3];

      const local = clamp((t - 0.04 * (1 - kick)) / 0.96);
      // Outward fast, then drag; it never travels far.
      const radius = radius0 + speed * (1 - Math.pow(1 - local, 2.4)) * 0.62;

      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = LANDING_Y + kick * local * 0.24 - 0.26 * local * local;
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
