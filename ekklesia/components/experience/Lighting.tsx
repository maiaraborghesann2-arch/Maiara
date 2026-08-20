"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { stageProgress } from "@/lib/scroll/stage";
import { light } from "@/lib/scroll/choreography";
import { sceneState } from "@/lib/scene/sharedState";

/**
 * Soft studio lighting: a warm key from the upper right, a cool bounce filling
 * the shadow side, and a rim that lifts the grain off the sand.
 *
 * The key drifts a little in azimuth through the turn so the highlight travels
 * across the grain instead of sitting still while the geometry rotates under
 * it — the difference between an object being examined and a prop spinning.
 *
 * Nothing casts a shadow map. `GroundShadow` draws the contact shadow directly
 * — see the note there for why the map was dropped.
 */
export function Lighting() {
  const key = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const lamp = key.current;
    if (!lamp) return;

    const p = stageProgress();
    const azimuth = track(light.azimuth, p);
    const radius = 2.6;

    lamp.intensity = track(light.intensity, p);

    // Ride with the grain so the frustum never has to widen.
    const { x, y } = sceneState.seedPosition;
    lamp.position.set(
      x + Math.cos(0.72 - azimuth) * radius,
      y + 2.5,
      Math.sin(0.72 - azimuth) * radius + 1.1,
    );
    lamp.target.position.set(x, y - 0.4, 0);
    lamp.target.updateMatrixWorld();

    lamp.castShadow = false; /*DEBUG*/
  });

  return (
    <>
      <ambientLight intensity={0.46} color="#FFF3E4" />

      <directionalLight
        ref={key}
        position={[1.9, 2.6, 1.7]}
        intensity={2.2}
        color="#FFF1DB"
      />

      <directionalLight position={[-2.4, 0.4, 1.3]} intensity={0.4} color="#CBBEAB" />
      <directionalLight position={[-1.0, 1.5, -2.4]} intensity={0.62} color="#FFE6C6" />
    </>
  );
}
