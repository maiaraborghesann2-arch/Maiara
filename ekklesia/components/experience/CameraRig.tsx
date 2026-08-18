"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { progressStore } from "@/lib/scroll/progressStore";
import { camera as choreo } from "@/lib/scroll/choreography";

/**
 * One camera, one continuous move, for the whole fifteen-frame journey.
 *
 * Act I only asks it to ease in on the turn and then follow the seed down — but
 * the reason it is a persistent rig rather than per-scene cameras is frame 06,
 * where the lens has to pass *through* the soil surface without a cut. That only
 * works if the camera arriving at the end of Act I is the same object that keeps
 * descending into Act II.
 */
export function CameraRig() {
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame((state) => {
    const p = progressStore.get();
    const cam = state.camera;

    cam.position.set(0, track(choreo.y, p), track(choreo.z, p));
    target.set(0, track(choreo.targetY, p), 0);
    cam.lookAt(target);
  });

  return null;
}
