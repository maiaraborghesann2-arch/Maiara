"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { progressStore } from "@/lib/scroll/progressStore";
import { seed as choreo } from "@/lib/scroll/choreography";
import { createSeedGeometry } from "./seedGeometry";

/**
 * Frames 01–04: the seed rests, turns, releases and arrives.
 *
 * Note there is no `useState` and no prop carrying progress — the component
 * pulls from `progressStore` inside `useFrame` and writes straight to the
 * object3D. React renders this once and then stays out of the way for the rest
 * of the session.
 */
export function Seed({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => createSeedGeometry(), []);
  const viewport = useThree((state) => state.viewport);

  /**
   * Where the seed comes to rest on the Home. Derived from the viewport rather
   * than hard-coded, because the composition of frame 04 — headline left, seed
   * right — only exists in landscape. In portrait the headline goes full width,
   * so the seed lifts clear of the text block instead of sitting on top of it.
   */
  const heroAnchor = useMemo(() => {
    const portrait = viewport.aspect < 0.9;
    return {
      x: Math.min(viewport.width * (portrait ? 0.22 : 0.3), 1.95),
      y: portrait ? viewport.height * 0.24 : 0,
    };
  }, [viewport.aspect, viewport.width, viewport.height]);

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;

    const p = progressStore.get();
    const time = state.clock.elapsedTime;
    const idle = reducedMotion ? 0 : track(choreo.idle, p);

    const scale = track(choreo.scale, p);
    mesh.scale.setScalar(scale);

    // The same 0→1 factor carries both axes, so the seed travels to its hero
    // anchor as one move rather than two that could desynchronise.
    const arrival = track(choreo.xFactor, p);
    mesh.position.x = arrival * heroAnchor.x + idle * Math.sin(time * 0.42) * 0.012;
    mesh.position.y =
      track(choreo.y, p) + arrival * heroAnchor.y + idle * Math.sin(time * 0.63) * 0.016;
    mesh.position.z = 0;

    mesh.rotation.x = track(choreo.rotationX, p) + idle * Math.sin(time * 0.37) * 0.05;
    mesh.rotation.y = track(choreo.rotationY, p) + idle * time * 0.045;
    mesh.rotation.z = track(choreo.rotationZ, p) + idle * Math.cos(time * 0.29) * 0.03;
  });

  return (
    <mesh ref={ref} geometry={geometry} castShadow={false} receiveShadow={false}>
      <meshStandardMaterial
        vertexColors
        roughness={0.78}
        metalness={0.02}
        envMapIntensity={0.35}
      />
    </mesh>
  );
}
