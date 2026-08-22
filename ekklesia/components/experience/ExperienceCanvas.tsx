"use client";

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";

import { palette } from "@/lib/palette";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import { Backdrop } from "./Backdrop";
import { Grade } from "./Grade";
import { Focus } from "./Focus";
import { CameraRig } from "./CameraRig";
import { Burst } from "./Burst";
import { Lighting } from "./Lighting";
import { Motes } from "./Motes";
import { Roots } from "./Roots";
import { Soil } from "./Soil";
import { GroundShadow } from "./GroundShadow";
import { Seed } from "./Seed";
import { LANDING_Y, dust } from "@/lib/scroll/choreography";
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
      {/*
        `near` is 0.02, not the usual tenth of a unit. The crossing takes the
        lens to within a few centimetres of the ground plane, and at a tenth the
        near plane slices the ground away across the lower third of the frame —
        the shot opens onto whatever is behind it, which read as a hard straight
        edge with the underground showing through. `far` comes in to match so
        the depth buffer keeps its precision for the depth-of-field pass, which
        reads it.
      */}
      <Canvas
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false }}
        camera={{ fov: 34, near: 0.02, far: 60, position: [0, 0.3, 5.6] }}
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
        <Soil />
        <Roots />

        {/* Act I's landing, then Act II's planting. Same component, two beats. */}
        <Burst originY={LANDING_Y} amount={dust.impact} from={0.745} span={0.175} />
        <Burst
          originY={LANDING_Y}
          amount={dust.plant}
          from={1.13}
          span={0.2}
          reach={0.42}
          count={220}
          seed={0x91a2}
        />

        {!reducedMotion && <Motes />}
        {/* Last in the tree so its `useFrame` reads the seed's current-frame
            position; `renderOrder` still draws it first. */}
        <Backdrop />
        {/* Drawn over everything, so the vignette contains the soil too. */}
        <Grade />
        {/* Takes over the render once the lens is under the surface. */}
        <Focus />
      </Canvas>
    </div>
  );
}
