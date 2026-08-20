"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { clamp, track, type Keyframe } from "@/lib/math";
import { sceneState } from "@/lib/scene/sharedState";
import { stageProgress } from "@/lib/scroll/stage";
import { GROUND_Y, LANDING_Y, light, shadow } from "@/lib/scroll/choreography";
import { createContactTexture } from "./seedGeometry";

/**
 * The surfaces the grain meets — implied, never drawn.
 *
 * These are projected contact shadows, not shadow maps. A real map was tried,
 * and looked right while the grain sat still, but VSM — the only built-in type
 * that honours a blur radius — bled badly once the light started riding a
 * falling object through a tight frustum, and parked a detached grey oval on
 * the sand during the landing. At a subject that reads sixty pixels tall the
 * silhouette detail a map buys is invisible; the artefact was not. Drawing the
 * shadow directly also removes a whole render pass per frame.
 *
 * Everything physical about it comes from one number: the gap between the grain
 * and the surface. The shadow slides away from the key light as that gap opens,
 * spreads and thins with it, and tightens back down on contact. That is the cue
 * that tells the eye how far the fall still has to go — and the difference
 * between an object resting on a surface and one hovering above it.
 */
export function GroundShadow() {
  return (
    <>
      <ContactShadow planeY={GROUND_Y} authority={shadow.ledge} />
      <ContactShadow planeY={LANDING_Y} authority={shadow.earth} />
    </>
  );
}

function ContactShadow({ planeY, authority }: { planeY: number; authority: Keyframe[] }) {
  const ref = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createContactTexture(), []);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const p = stageProgress();
    const weight = track(authority, p);

    mesh.visible = weight > 0.002;
    if (!mesh.visible) return;

    const { seedPosition, seedScale } = sceneState;
    const gap = Math.max(0, seedPosition.y - seedScale - planeY);
    const rise = clamp(gap * 1.5, 0, 1);

    // Slide away from the key light as it lifts, the way a real cast shadow
    // separates from its object.
    const azimuth = track(light.azimuth, p);
    mesh.position.set(
      seedPosition.x - Math.cos(0.72 - azimuth) * gap * 0.42,
      planeY + 0.002,
      -Math.sin(0.72 - azimuth) * gap * 0.42,
    );

    const spread = seedScale * (6.6 + rise * 26);
    // Foreshortened along the light, so it reads as cast rather than stamped.
    mesh.scale.set(spread * 1.18, spread, 1);

    (mesh.material as THREE.MeshBasicMaterial).opacity = weight * (1 - rise * 0.84);
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, planeY, 0]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}
