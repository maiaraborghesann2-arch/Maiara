"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { palette } from "@/lib/palette";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { Backdrop } from "./Backdrop";
import { CameraRig } from "./CameraRig";
import { Dust } from "./Dust";
import { Lighting } from "./Lighting";
import { Motes } from "./Motes";
import { GroundShadow } from "./GroundShadow";
import { Seed } from "./Seed";
import { StudioEnvironment } from "./StudioEnvironment";

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
        camera={{ fov: 34, near: 0.1, far: 100, position: [0, 0.3, 5.6] }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          // Fallback only — `Backdrop` paints over this every frame.
          scene.background = new THREE.Color(palette.sand);
        }}
      >
        <CameraRig />
        <StudioEnvironment />
        <Lighting />
        <Seed reducedMotion={reducedMotion} />
        <GroundShadow />
        <Dust />
        {!reducedMotion && <Motes />}
        {/* Last in the tree so its `useFrame` reads the seed's current-frame
            position; `renderOrder` still draws it first. */}
        <Backdrop />
      </Canvas>
    </div>
  );
}
