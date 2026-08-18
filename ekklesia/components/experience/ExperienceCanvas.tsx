"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { palette } from "@/lib/palette";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { Backdrop } from "./Backdrop";
import { CameraRig } from "./CameraRig";
import { Dust } from "./Dust";
import { Lighting } from "./Lighting";
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
        camera={{ fov: 34, near: 0.1, far: 100, position: [0, 0.4, 5.05] }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.08;
          gl.shadowMap.enabled = true;
          // VSM is the only built-in type that honours `shadow.radius`, and a
          // genuinely soft edge is the whole point of this shadow.
          gl.shadowMap.type = THREE.VSMShadowMap;
          // Fallback only — `Backdrop` paints over this every frame.
          scene.background = new THREE.Color(palette.sand);
        }}
      >
        <CameraRig />
        <StudioEnvironment />
        <Lighting />
        <Seed reducedMotion={reducedMotion} />
        <GroundShadow />
        {!reducedMotion && <Dust />}
        {/* Last in the tree so its `useFrame` reads the seed's current-frame
            position; `renderOrder` still draws it first. */}
        <Backdrop />
      </Canvas>
    </div>
  );
}
