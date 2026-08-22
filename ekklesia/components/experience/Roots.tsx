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

const LITTER_COUNT = 300;

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
  const { geometry, strands } = useMemo(() => buildRootGeometry(ORIGIN), []);
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
       * Placed *on the roots*, not near them.
       *
       * Scattering crumbs through a cylinder around the system leaves the roots
       * themselves clean — the grains sit in the space between the branches and
       * nothing ever crosses one. Sampling a random point on a random strand and
       * offsetting it by a little more than that strand's own radius puts soil
       * against the root, lodged in the crotches and lying over the runs, which
       * is where soil actually collects on something growing through it. A
       * fraction sit proud of the surface toward the lens, so a few branches are
       * genuinely interrupted rather than merely shaded.
       */
      const strand = strands[Math.floor(random() * strands.length)];
      const at = Math.floor(random() * strand.points.length);
      const anchor = strand.points[at];
      const radius = strand.radii[at];

      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const reach = radius * (0.9 + random() * random() * 4.2);
      position.set(
        anchor.x + Math.sin(phi) * Math.cos(theta) * reach,
        anchor.y + Math.cos(phi) * reach * 0.8,
        anchor.z + Math.sin(phi) * Math.sin(theta) * reach,
      );

      euler.set(random() * 6.28, random() * 6.28, random() * 6.28);
      quaternion.setFromEuler(euler);
      const size = radius * (0.22 + random() * random() * 1.1);
      scale.set(size, size * (0.65 + random() * 0.5), size * (0.75 + random() * 0.45));
      mesh.setMatrixAt(i, matrix.compose(position, quaternion, scale));
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [strands]);

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
      opening.scale.set(0.022 * value, 0.009 * value, 0.022 * value);
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
               float g = 1.0 - smoothstep(uGrow - 0.022, uGrow, aGrow);
               vGrow = g;
               /*
                * A rounded cap, not a point. Collapsing linearly toward the
                * axis draws the growing end out into a long needle — the
                * radicle ends in a thorn, which is the one shape a root tip
                * never has. A circular profile over the same band gives an
                * advancing dome instead: still full width a moment behind the
                * front, and closed at it.
                */
               float cap = sqrt(max(0.0, 1.0 - (1.0 - g) * (1.0 - g)));
               transformed = mix(aCenter, transformed, cap);`,
            );

            shader.vertexShader = shader.vertexShader.replace(
              "#include <worldpos_vertex>",
              `#include <worldpos_vertex>
               vRootPos = transformed;`,
            );
            shader.vertexShader =
              "varying vec3 vRootPos;\n" + shader.vertexShader;

            shader.fragmentShader =
              `varying float vGrow;
               varying vec3 vRootPos;

               float rootHash(vec3 p) {
                 p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
                 p *= 17.0;
                 return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
               }

               float rootNoise(vec3 x) {
                 vec3 i = floor(x);
                 vec3 f = fract(x);
                 f = f * f * (3.0 - 2.0 * f);
                 return mix(
                   mix(mix(rootHash(i), rootHash(i + vec3(1,0,0)), f.x),
                       mix(rootHash(i + vec3(0,1,0)), rootHash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(rootHash(i + vec3(0,0,1)), rootHash(i + vec3(1,0,1)), f.x),
                       mix(rootHash(i + vec3(0,1,1)), rootHash(i + vec3(1,1,1)), f.x), f.y),
                   f.z);
               }
              ` + shader.fragmentShader;

            /*
             * Soil over the root, and grain in it.
             *
             * A root grown *through* soil is not cleanly visible along its whole
             * length — it is smeared, half-covered, and in places it vanishes
             * behind a crumb and picks up again further along. Without that it
             * does not matter how good the geometry is: it reads as a model
             * placed into a set. The covering is a low-frequency field sampled
             * in the root's own space, so the same run is buried in the same
             * places from every angle; the fine octave on top is skin.
             */
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <color_fragment>",
              `#include <color_fragment>
               float cover = rootNoise(vRootPos * 5.0) * 0.7
                           + rootNoise(vRootPos * 11.5 + 11.0) * 0.3;
               cover = smoothstep(0.4, 0.78, cover);
               float skin = rootNoise(vRootPos * 41.0) * 0.5
                          + rootNoise(vRootPos * 97.0 + 3.0) * 0.5;
               diffuseColor.rgb *= 0.86 + skin * 0.28;
               diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.055, 0.038, 0.022), cover * 0.88);`,
            );

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
          // Soil, not soot. Darker than this and the crumbs read as burnt
          // specks stuck on the root rather than as earth lying against it.
          color="#7A6244"
          roughness={0.98}
          metalness={0}
          transparent
        />
      </instancedMesh>
    </>
  );
}
