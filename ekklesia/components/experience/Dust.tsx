"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { clamp, track } from "@/lib/math";
import { progressStore } from "@/lib/scroll/progressStore";
import { ACT_ONE, beatProgress } from "@/lib/scroll/acts";
import { GROUND_Y, dust } from "@/lib/scroll/choreography";

const COUNT = 260;

/** Deterministic PRNG so the burst is identical on every reload and on SSR. */
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
 * The puff of soil kicked up in frame 03 as the seed releases.
 *
 * Scrubbed, not simulated: each particle's position is a closed-form function
 * of the beat's progress, so dragging the scroll backwards pulls the dust back
 * into the ground instead of leaving it stranded mid-air. A stateful particle
 * system would break the moment the user scrolls up.
 */
export function Dust() {
  const ref = useRef<THREE.Points>(null);

  const { geometry, seeds } = useMemo(() => {
    const random = mulberry32(0x5eed);
    const positions = new Float32Array(COUNT * 3);
    const specs = new Float32Array(COUNT * 4);

    for (let i = 0; i < COUNT; i++) {
      const angle = random() * Math.PI * 2;
      specs[i * 4] = angle;
      // Start clustered near the contact point.
      specs[i * 4 + 1] = 0.01 + random() * 0.05;
      // Outward speed.
      specs[i * 4 + 2] = 0.08 + random() * 0.42;
      // Upward kick, plus a stagger so the burst does not fire as one wall.
      specs[i * 4 + 3] = 0.1 + random() * 0.55;
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return { geometry: buffer, seeds: specs };
  }, []);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const points = ref.current;
    if (!points) return;

    const p = progressStore.get();
    const amount = track(dust.amount, p);
    const material = points.material as THREE.PointsMaterial;

    points.visible = amount > 0.002;
    if (!points.visible) return;

    material.opacity = amount * 0.4;

    const t = beatProgress(ACT_ONE.queda, p);
    const attribute = geometry.attributes.position as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      const angle = seeds[i * 4];
      const radius0 = seeds[i * 4 + 1];
      const speed = seeds[i * 4 + 2];
      const kick = seeds[i * 4 + 3];

      // Stagger: particles with a stronger kick leave a touch earlier.
      const local = clamp((t - 0.05 * (1 - kick)) / 0.95);
      const radius = radius0 + speed * local * 0.75;

      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = GROUND_Y + kick * local * 0.34 - 0.42 * local * local;
      array[i * 3 + 2] = Math.sin(angle) * radius * 0.7;
    }

    attribute.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        size={0.011}
        sizeAttenuation
        color="#7A5A38"
        transparent
        opacity={0}
        depthWrite={false}
      />
    </points>
  );
}
