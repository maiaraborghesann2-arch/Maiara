"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { progressStore } from "@/lib/scroll/progressStore";
import { GROUND_Y, groundShadow, seed } from "@/lib/scroll/choreography";
import { createShadowTexture } from "./seedGeometry";

/**
 * The soft ellipse under the seed in frames 01–02.
 *
 * A real shadow map would need a floor mesh to catch it, and the storyboard has
 * no visible floor — just a shadow floating on cream. So this is a gradient
 * sprite laid flat: cheaper, softer, and it lets the "surface" stay implied.
 */
export function GroundShadow() {
  const ref = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createShadowTexture(), []);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const p = progressStore.get();
    const material = mesh.material as THREE.MeshBasicMaterial;
    const opacity = track(groundShadow.opacity, p);

    mesh.visible = opacity > 0.001;
    if (!mesh.visible) return;

    material.opacity = opacity;

    // Widen and soften as the seed lifts off, the way a real contact shadow
    // loses its edge with distance.
    const lift = Math.max(0, track(seed.y, p) - -0.199);
    mesh.scale.setScalar(track(seed.scale, p) * (7.5 + lift * 9));
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}
