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
 * It stays on the centre line from the first frame to the last. There is no
 * lateral dolly: the composition of the Home is opened by aiming higher after
 * impact, not by sliding sideways. A sideways move would cut across the
 * trajectory the fall spent the whole act establishing, and the eye reads that
 * as a change of subject even when the object itself has not moved.
 *
 * It never cuts and never resets, because frame 06 has to pick up this same
 * camera still descending toward the soil.
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
