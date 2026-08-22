"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { stageProgress } from "@/lib/scroll/stage";
import { LANDING_Y, light } from "@/lib/scroll/choreography";
import { sceneState } from "@/lib/scene/sharedState";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

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
  const fill = useRef<THREE.DirectionalLight>(null);
  const filtered = useRef<THREE.HemisphereLight>(null);
  const reducedMotion = usePrefersReducedMotion();

  useFrame((state) => {
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

    /*
     * Below the surface the key is no use on its own: it comes from above and
     * there is nothing down here for it to come *from*. Two lights take over,
     * both gated on depth so Act I never sees a photon of either.
     *
     * The hemisphere is the important one. It is light that has already been
     * scattered — warm from the direction of the surface, almost nothing from
     * below — which is exactly what daylight does a few centimetres into soil,
     * and being a gradient rather than a direction it *cannot* produce a hard
     * edge. It also gets weaker and flatter with depth on its own, because the
     * ratio it is scaled by does.
     *
     * The lens-side fill is small and only there so the near face of the grain
     * is not a silhouette. The note is "escura e terrosa", not unreadable.
     */
    const below = Math.min(1, Math.max(0, (LANDING_Y + 0.2 - state.camera.position.y) / 0.5));
    const depth = Math.max(0, LANDING_Y - state.camera.position.y);
    // Breath: the pause is the one moment nothing moves, and a frame that is
    // *perfectly* still reads as a still. Environment only, never the growth,
    // and it stops at the door if the visitor asked for less motion.
    const breath =
      p > 1.88 && !reducedMotion ? Math.sin(state.clock.elapsedTime * 0.42) * 0.035 : 0;

    const scattered = filtered.current;
    if (scattered) {
      scattered.intensity = below * (0.88 / (1 + depth * 0.42)) * (1 + breath);
    }

    const under = fill.current;
    if (under) {
      under.intensity = below * 0.3 * (1 + breath);
      under.position.copy(state.camera.position).add(new THREE.Vector3(0.9, 0.5, 0.2));
      under.target.position.set(0, y, 0);
      under.target.updateMatrixWorld();
    }
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

      <hemisphereLight ref={filtered} intensity={0} color="#D3B187" groundColor="#0D0905" />
      <directionalLight ref={fill} intensity={0} color="#E4D2B6" />
    </>
  );
}
