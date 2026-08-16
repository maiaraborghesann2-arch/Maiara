"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { palette } from "@/lib/palette";
import { progressStore } from "@/lib/scroll/progressStore";
import { background, camera as choreo } from "@/lib/scroll/choreography";

/**
 * One camera, one continuous move, for the whole fifteen-frame journey.
 *
 * Act I only asks it to hold and then follow the seed down — but the reason it
 * is a persistent rig rather than per-scene cameras is frame 06, where the lens
 * has to pass *through* the soil surface without a cut. That only works if the
 * camera arriving at the end of Act I is the same object that keeps descending
 * into Act II.
 */
export function CameraRig() {
  const scene = useThree((state) => state.scene);

  const colors = useMemo(
    () => ({
      bone: new THREE.Color(palette.bone),
      dusk: new THREE.Color(palette.dusk),
      sand: new THREE.Color(palette.sand),
      current: new THREE.Color(palette.bone),
    }),
    [],
  );

  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const p = progressStore.get();
    const cam = state.camera;

    cam.position.set(0, track(choreo.y, p), track(choreo.z, p));
    target.set(0, track(choreo.targetY, p), 0);
    cam.lookAt(target);

    // Background wash across three stops: bone → dusk → sand.
    const mix = track(background.mix, p);
    if (mix <= 1) {
      colors.current.copy(colors.bone).lerp(colors.dusk, mix);
    } else {
      colors.current.copy(colors.dusk).lerp(colors.sand, mix - 1);
    }
    scene.background = colors.current;
  });

  return null;
}
