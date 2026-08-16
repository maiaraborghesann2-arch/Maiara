"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { CameraRig } from "./CameraRig";
import { Dust } from "./Dust";
import { Lighting } from "./Lighting";
import { GroundShadow } from "./GroundShadow";
import { Seed } from "./Seed";

/**
 * The persistent stage.
 *
 * This canvas mounts once and is never unmounted or remounted for the rest of
 * the visit. The storyboard is a single unbroken camera move — seed, soil,
 * roots, trunk, canopy — so tearing down a WebGL context between chapters would
 * destroy the one thing the whole piece depends on. Later chapters add objects
 * to *this* scene; they do not get canvases of their own.
 */
export function ExperienceCanvas() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        camera={{ fov: 34, near: 0.1, far: 100, position: [0, 0.42, 5] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <CameraRig />
        <Lighting />
        <Seed reducedMotion={reducedMotion} />
        <GroundShadow />
        {!reducedMotion && <Dust />}
      </Canvas>
    </div>
  );
}
