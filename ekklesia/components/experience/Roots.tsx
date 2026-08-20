"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { stageProgress } from "@/lib/scroll/stage";
import { SEED_PLANTED_Y, germination } from "@/lib/scroll/choreography";
import { ROOT_DEPTH, buildRootGeometry } from "./rootSystem";
import { createRockGeometries } from "./rockGeometry";

/**
 * Where the radicle starts — *inside* the grain, a few centimetres above the
 * shell. Nothing between here and the shell is ever visible, which is the whole
 * point: the junction that made the last build read as "a tube stuck into a
 * sphere" now happens behind opaque geometry.
 */
const ORIGIN = new THREE.Vector3(0, SEED_PLANTED_Y - 0.035, 0);
/** The shell's lower pole, where the root actually breaks through. */
const APERTURE_Y = SEED_PLANTED_Y - 0.083;

const LITTER_COUNT = 240;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function Roots() {
  const { geometry } = useMemo(() => buildRootGeometry(ORIGIN), []);
  const aperture = useRef<THREE.Mesh>(null);
  const litter = useRef<THREE.InstancedMesh>(null);
  const litterMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const injected = useRef<{ uniforms: Record<string, { value: number }> } | null>(null);

  // One shape is enough here: these are grains of soil a few millimetres across
  // and they are never on screen long enough to be recognised.
  const litterGeometry = useMemo(() => createRockGeometries(1, 0x11ae)[0], []);

  useEffect(() => {
    const mesh = litter.current;
    if (!mesh) return;

    const random = mulberry32(0x7a03);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();

    for (let i = 0; i < LITTER_COUNT; i++) {
      /*
       * Deliberately *inside* the root volume, and deliberately including the
       * near side. Roots that are all perfectly visible read as a specimen on a
       * lab bench; a few crumbs of soil crossing in front of them is most of
       * what says they are buried.
       */
      const angle = random() * Math.PI * 2;
      const radius = 0.06 + random() ** 0.55 * 1.15;
      position.set(
        Math.cos(angle) * radius,
        SEED_PLANTED_Y - random() ** 0.75 * ROOT_DEPTH * 1.05,
        Math.sin(angle) * radius,
      );

      euler.set(random() * 6.28, random() * 6.28, random() * 6.28);
      quaternion.setFromEuler(euler);
      const size = 0.0035 + random() * random() * 0.016;
      scale.set(size, size * (0.7 + random() * 0.5), size * (0.8 + random() * 0.4));
      mesh.setMatrixAt(i, matrix.compose(position, quaternion, scale));
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useEffect(
    () => () => {
      geometry.dispose();
      litterGeometry.dispose();
    },
    [geometry, litterGeometry],
  );

  useFrame(() => {
    const p = stageProgress();
    const grow = track(germination.growth, p);

    if (injected.current) injected.current.uniforms.uGrow.value = grow;

    const opening = aperture.current;
    if (opening) {
      const value = track(germination.aperture, p);
      opening.visible = value > 0.01;
      opening.scale.set(0.032 * value, 0.013 * value, 0.032 * value);
    }

    // The soil around the roots is disturbed by them, so it arrives with them.
    if (litter.current) litter.current.visible = grow > 0.02;
    if (litterMaterial.current) litterMaterial.current.opacity = Math.min(1, grow * 2.2);
  });

  return (
    <>
      {/*
        The shell splitting. Its own beat before any root shows, because
        something has to happen *to the grain* first — otherwise the root reads
        as an object arriving rather than as the seed opening. Flattened, and
        sitting at the lower pole, so it reads as a parted seam rather than as a
        bead stuck to the bottom.
      */}
      <mesh ref={aperture} position={[0, APERTURE_Y, 0]} visible={false}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#150E06" roughness={1} metalness={0} />
      </mesh>

      <mesh geometry={geometry} frustumCulled={false}>
        <meshStandardMaterial
          vertexColors
          roughness={0.94}
          metalness={0}
          onBeforeCompile={(shader) => {
            shader.uniforms.uGrow = { value: 0 };
            injected.current = shader as unknown as {
              uniforms: Record<string, { value: number }>;
            };

            shader.vertexShader =
              `attribute float aGrow;
               attribute vec3 aCenter;
               uniform float uGrow;
               varying float vGrow;
              ` + shader.vertexShader;

            /*
             * Growth, as a pure function of the scroll clock. Each vertex knows
             * when it comes into being; before then it is collapsed onto its own
             * axis, so a run emerges tip-first out of nothing and thickens
             * behind the tip. Scrub backwards and it retracts the same way,
             * because nothing here is integrated over time.
             */
            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              `#include <begin_vertex>
               float g = 1.0 - smoothstep(uGrow - 0.045, uGrow, aGrow);
               vGrow = g;
               transformed = mix(aCenter, transformed, g);`,
            );

            shader.fragmentShader = "varying float vGrow;\n" + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <clipping_planes_fragment>",
              `#include <clipping_planes_fragment>
               if (vGrow < 0.03) discard;`,
            );
          }}
        />
      </mesh>

      <instancedMesh
        ref={litter}
        args={[litterGeometry, undefined, LITTER_COUNT]}
        visible={false}
        frustumCulled={false}
      >
        <meshStandardMaterial
          ref={litterMaterial}
          vertexColors
          color="#3A2E20"
          roughness={0.98}
          metalness={0}
          transparent
        />
      </instancedMesh>
    </>
  );
}
