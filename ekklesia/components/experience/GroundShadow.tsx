"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { clamp, track, type Keyframe } from "@/lib/math";
import { sceneState } from "@/lib/scene/sharedState";
import { stageProgress } from "@/lib/scroll/stage";
import { GROUND_Y, LANDING_Y, light, shadow } from "@/lib/scroll/choreography";

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
 *
 * It *multiplies*. That is not a detail. Drawn the obvious way — a dark brown
 * sprite over alpha blending — it is only a shadow for as long as the ground is
 * paler than the sprite. It was, on Act I's sand. Underground the soil renders
 * darker than any brown you would pick for a shadow, so the same sprite started
 * adding light: a warm halo around the grain exactly where it touches down,
 * which read as a lit plane cutting through the scene. Multiplying cannot
 * brighten anything, at any exposure, on any ground.
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
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => ({ uStrength: { value: 0 } }), []);

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
      /*
       * Just clear of the ground's relief. The soil surface is displaced
       * geometry either side of `planeY`: sit level with it and the quad sinks
       * under every ridge it crosses and comes back as a torn edge — but lift
       * it far enough to clear a *tall* relief and, at the macro distance the
       * planting is shot from, the shadow visibly detaches from the grain. The
       * displacement was flattened to make this margin small enough to hide.
       */
      planeY + 0.0028,
      -Math.sin(0.72 - azimuth) * gap * 0.42,
    );

    const spread = seedScale * (6.6 + rise * 26);
    // Foreshortened along the light, so it reads as cast rather than stamped.
    mesh.scale.set(spread * 1.18, spread, 1);

    uniforms.uStrength.value = weight * (1 - rise * 0.84) * 0.62;
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, planeY, 0]} renderOrder={6}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.MultiplyBlending}
        // Required by three's blending state for multiply. The pass writes an
        // opaque grey it multiplies the frame by, so alpha never varies.
        premultipliedAlpha
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
      />
    </mesh>
  );
}

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * A soft core with a long tail, matched to how a small object occludes a broad
 * sky: nearly opaque where it touches, gone within a couple of its own widths.
 * No hard edge anywhere, so there is nothing that can read as a circle.
 */
const FRAGMENT = /* glsl */ `
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float core = exp(-d * d * 7.0);
    float tail = exp(-d * d * 1.9) * 0.4;
    float occlusion = min(1.0, core + tail) * uStrength;
    gl_FragColor = vec4(vec3(1.0 - occlusion), 1.0);
  }
`;
