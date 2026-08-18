"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { progressStore } from "@/lib/scroll/progressStore";
import { GROUND_Y, seed, shadow } from "@/lib/scroll/choreography";
import { createContactTexture } from "./seedGeometry";

/**
 * The surface the seed sits on — implied, never drawn.
 *
 * Two layers do the work. An invisible catcher plane receives the real shadow
 * map, so the shape on the sand is the seed's actual silhouette and it changes
 * as the seed turns. On top of it, a small gradient sprite supplies the tight
 * ambient occlusion right at the contact point, which a 1024px shadow map
 * cannot resolve and which is the detail that makes an object look *placed*
 * rather than hovering.
 *
 * Both fade out together as the seed breaks free in frame 03.
 */
export function GroundShadow() {
  const catcher = useRef<THREE.Mesh>(null);
  const contact = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createContactTexture(), []);

  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(() => {
    const catcherMesh = catcher.current;
    const contactMesh = contact.current;
    if (!catcherMesh || !contactMesh) return;

    const p = progressStore.get();
    const authority = track(shadow.opacity, p);

    catcherMesh.visible = authority > 0.002;
    contactMesh.visible = authority > 0.002;
    if (!catcherMesh.visible) return;

    (catcherMesh.material as THREE.ShadowMaterial).opacity = authority * 0.26;

    // Contact occlusion widens and softens as the seed lifts, the way a real
    // one loses its edge with distance.
    const scale = track(seed.scale, p);
    const lift = Math.max(0, track(seed.fall, p));
    (contactMesh.material as THREE.MeshBasicMaterial).opacity =
      authority * 0.9 * (1 - Math.min(1, lift * 6));
    contactMesh.scale.setScalar(scale * (6.5 + lift * 22));
  });

  return (
    <>
      <mesh
        ref={catcher}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, GROUND_Y, 0]}
        receiveShadow
      >
        <planeGeometry args={[6, 6]} />
        <shadowMaterial transparent opacity={0.26} color="#3A2A1A" />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y + 0.001, 0]} ref={contact}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={texture} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </>
  );
}
