"use client";

import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { progressStore } from "@/lib/scroll/progressStore";
import { HERO_PAN_X, camera as choreo } from "@/lib/scroll/choreography";

/**
 * One camera, one continuous move, for the whole fifteen-frame journey.
 *
 * The look-at target carries the camera's own `x`, which makes the Act 04 move
 * a lateral dolly rather than a pan-and-rotate. That distinction matters: a
 * rotation would keep the grain pinned to the centre of frame, and the entire
 * point of the move is that the frame slides off the grain and leaves it on the
 * right while the type takes the space that opens on the left.
 *
 * It never cuts and never resets, because frame 06 has to pick up this same
 * camera still descending toward the soil.
 */
export function CameraRig() {
  const target = useMemo(() => new THREE.Vector3(), []);
  const aspect = useThree((state) => state.viewport.aspect);

  useFrame((state) => {
    const p = progressStore.get();
    const cam = state.camera;

    /*
     * Portrait reframes rather than pans. The Act 04 dolly is wider than a
     * phone's entire visible width, so at full strength it carries the grain
     * out of frame; instead the move is mostly given up and the camera looks
     * further down, which lifts the grain above the headline that now runs
     * full-width beneath it.
     */
    const portrait = aspect < 0.9;
    const panned = track(choreo.x, p);
    const throughPan = panned / HERO_PAN_X;

    const x = portrait ? panned * 0.18 : panned;
    const targetY = track(choreo.targetY, p) - (portrait ? throughPan * 0.44 : 0);

    cam.position.set(x, track(choreo.y, p), track(choreo.z, p));
    target.set(x, targetY, 0);
    cam.lookAt(target);
  });

  return null;
}
