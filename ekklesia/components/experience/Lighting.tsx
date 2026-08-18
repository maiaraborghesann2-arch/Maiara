"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { progressStore } from "@/lib/scroll/progressStore";
import { GROUND_Y, shadow } from "@/lib/scroll/choreography";
import { sceneState } from "@/lib/scene/sharedState";

/**
 * Soft studio lighting: a warm key from the upper right, a cool bounce filling
 * the shadow side, and a rim that lifts the seed off the sand.
 *
 * Only the key casts. The shadow camera is kept deliberately tight around the
 * seed — a wide frustum spreads the same 1024 texels over ten times the area
 * and the delicate contact shadow turns into a blocky smear.
 */
export function Lighting() {
  const key = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const light = key.current;
    if (!light) return;

    const p = progressStore.get();

    // Follow the seed so the shadow frustum stays tight around it, and fade the
    // cast once the seed has left the surface behind.
    light.target.position.set(sceneState.seedPosition.x, GROUND_Y, 0);
    light.target.updateMatrixWorld();
    light.position.set(sceneState.seedPosition.x + 1.9, 2.6, 1.7);
    light.castShadow = track(shadow.opacity, p) > 0.01;
  });

  return (
    <>
      <ambientLight intensity={0.5} color="#FFF4E6" />

      <directionalLight
        ref={key}
        position={[1.9, 2.6, 1.7]}
        intensity={2.4}
        color="#FFF2DE"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-0.55}
        shadow-camera-right={0.55}
        shadow-camera-top={0.55}
        shadow-camera-bottom={-0.55}
        shadow-camera-near={0.5}
        shadow-camera-far={7}
        shadow-radius={7}
        shadow-blurSamples={16}
        shadow-bias={-0.0008}
      />

      <directionalLight position={[-2.4, 0.5, 1.4]} intensity={0.45} color="#CFC2AE" />
      <directionalLight position={[-1.1, 1.6, -2.4]} intensity={0.7} color="#FFE7C9" />
    </>
  );
}
