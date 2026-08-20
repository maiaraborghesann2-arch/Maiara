"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { sceneState } from "@/lib/scene/sharedState";
import { stageProgress } from "@/lib/scroll/stage";
import { GROUND_Y, seed as choreo } from "@/lib/scroll/choreography";
import { SEED_HALF_HEIGHT, createSeedGeometry, createSeedMaps } from "./seedGeometry";

/**
 * Frames 01–04: the grain rests, turns, falls and lands.
 *
 * It never moves sideways. Everything the viewer reads as the grain "arriving
 * at the Home" is the camera panning left around an object that has not budged
 * since impact — which is the difference between a landing that causes the
 * Home and an object that slides into a layout.
 *
 * No `useState`, no prop carrying progress: the component pulls the stage clock
 * inside `useFrame` and writes straight to the object3D. React renders this once
 * and then stays out of the way for the rest of the session.
 */
export function Seed({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => createSeedGeometry(), []);
  const maps = useMemo(() => createSeedMaps(), []);

  // `aoMap` reads the second UV set, which SphereGeometry does not provide.
  useEffect(() => {
    geometry.setAttribute("uv1", geometry.attributes.uv);
  }, [geometry]);

  useEffect(
    () => () => {
      geometry.dispose();
      maps.dispose();
    },
    [geometry, maps],
  );

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;

    const p = stageProgress();
    const time = state.clock.elapsedTime;
    const idle = reducedMotion ? 0 : track(choreo.idle, p);

    const scale = track(choreo.scale, p);
    mesh.scale.setScalar(scale);

    // Resting height derives from the current scale, so the grain stays welded
    // to the ledge however the scale is retuned.
    const resting = GROUND_Y + SEED_HALF_HEIGHT * scale;

    mesh.position.set(
      idle * Math.sin(time * 0.4) * 0.004,
      resting + track(choreo.fall, p) + idle * Math.sin(time * 0.61) * 0.005,
      0,
    );

    mesh.rotation.x = track(choreo.rotationX, p) + idle * Math.sin(time * 0.33) * 0.02;
    mesh.rotation.y = track(choreo.rotationY, p) + idle * time * 0.016;
    mesh.rotation.z = track(choreo.rotationZ, p) + idle * Math.cos(time * 0.27) * 0.014;

    // Publish for the backdrop's light pool and the shadow rig.
    sceneState.seedPosition.copy(mesh.position);
    sceneState.seedScale = scale;
  });

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshStandardMaterial
        map={maps.map}
        roughnessMap={maps.roughnessMap}
        normalMap={maps.normalMap}
        aoMap={maps.aoMap}
        aoMapIntensity={0.85}
        normalScale={new THREE.Vector2(1.15, 1.15)}
        metalness={0}
        envMapIntensity={0.55}
      />
    </mesh>
  );
}
