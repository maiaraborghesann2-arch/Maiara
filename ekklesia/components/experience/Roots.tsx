"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

import { track } from "@/lib/math";
import { palette } from "@/lib/palette";
import { stageProgress } from "@/lib/scroll/stage";
import { SEED_PLANTED_Y, germination } from "@/lib/scroll/choreography";

/** Where the shell opens, and therefore where the first root leaves it. */
const ORIGIN = new THREE.Vector3(0.022, SEED_PLANTED_Y - 0.068, 0.05);

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Segment = {
  curve: THREE.CatmullRomCurve3;
  /** Radius at the base and at the tip. */
  r0: number;
  r1: number;
  /** When this segment starts growing, and how long it takes. */
  birth: number;
  life: number;
  tubular: number;
};

/**
 * Builds the root system.
 *
 * Three rules keep it from looking mathematical. Every segment wanders on its
 * own low-frequency path rather than following its start direction; radius
 * tapers along each run and drops sharply between generations; and branch
 * points, angles and lengths are drawn from a seeded generator rather than
 * spaced evenly. Perfect symmetry is the single loudest tell that a root system
 * was computed, so nothing here is mirrored or regular.
 */
function buildSegments(): { segments: Segment[]; maxGrow: number } {
  const random = mulberry32(0x0017);
  const segments: Segment[] = [];

  function run(
    start: THREE.Vector3,
    direction: THREE.Vector3,
    length: number,
    r0: number,
    r1: number,
    birth: number,
    life: number,
    wander: number,
    steps: number,
  ) {
    const points: THREE.Vector3[] = [start.clone()];
    const forward = direction.clone().normalize();
    const phase = random() * 10;
    const point = start.clone();

    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const step = forward.clone().multiplyScalar(length / steps);

      // Low-frequency drift, plus gravity pulling every run downward over time.
      step.x += Math.sin(t * 4.3 + phase) * wander * (length / steps);
      step.z += Math.cos(t * 3.7 + phase * 1.4) * wander * (length / steps);
      step.y -= t * 0.35 * (length / steps);

      point.add(step);
      points.push(point.clone());
    }

    const curve = new THREE.CatmullRomCurve3(points);
    segments.push({ curve, r0, r1, birth, life, tubular: steps * 2 });
    return curve;
  }

  // The taproot. It leaves the shell and goes down; everything else hangs off it.
  // Barely off vertical. Over three units even a small initial bias compounds
  // into a system that visibly hangs to one side of the grain that made it,
  // and the whole piece has been built on a centre line.
  const taproot = run(
    ORIGIN,
    new THREE.Vector3(0.012, -1, 0.028),
    3.05,
    0.011,
    0.0028,
    0,
    0.44,
    0.34,
    24,
  );

  const laterals: { curve: THREE.CatmullRomCurve3; birth: number }[] = [];

  for (let i = 0; i < 9; i++) {
    const at = 0.1 + (i / 9) * 0.76 + (random() - 0.5) * 0.06;
    const start = taproot.getPointAt(Math.min(0.99, at));
    const angle = random() * Math.PI * 2;
    const drop = 0.35 + random() * 0.9;

    const birth = 0.12 + at * 0.34;
    const curve = run(
      start,
      new THREE.Vector3(Math.cos(angle), -drop, Math.sin(angle)),
      0.7 + random() * 1.05,
      0.006,
      0.0018,
      birth,
      0.3,
      0.75,
      14,
    );
    laterals.push({ curve, birth });
  }

  for (const lateral of laterals) {
    const branches = 1 + Math.floor(random() * 2.4);
    for (let i = 0; i < branches; i++) {
      const at = 0.3 + random() * 0.55;
      const start = lateral.curve.getPointAt(Math.min(0.99, at));
      const angle = random() * Math.PI * 2;

      run(
        start,
        new THREE.Vector3(Math.cos(angle) * 0.9, -0.5 - random() * 0.8, Math.sin(angle) * 0.9),
        0.24 + random() * 0.42,
        0.0028,
        0.0009,
        lateral.birth + 0.15 + at * 0.18,
        0.22,
        1.0,
        9,
      );
    }
  }

  const maxGrow = segments.reduce((m, s) => Math.max(m, s.birth + s.life), 0);
  return { segments, maxGrow };
}

/**
 * One merged mesh carrying the whole system, with two extra attributes:
 * `aGrow`, the moment each vertex comes into being, and `aCenter`, the point on
 * its own curve's axis. The vertex shader collapses every vertex to its axis
 * until its moment arrives, which makes the tube emerge tip-first out of
 * nothing rather than fading in whole.
 */
function buildGeometry() {
  const { segments, maxGrow } = buildSegments();
  const parts: THREE.BufferGeometry[] = [];
  const centre = new THREE.Vector3();
  const vertex = new THREE.Vector3();

  for (const segment of segments) {
    const radial = 10;
    const geometry = new THREE.TubeGeometry(
      segment.curve,
      segment.tubular,
      segment.r0,
      radial,
      false,
    );
    const position = geometry.attributes.position as THREE.BufferAttribute;
    const grow = new Float32Array(position.count);
    const centers = new Float32Array(position.count * 3);
    const ring = radial + 1;

    for (let i = 0; i < position.count; i++) {
      const u = Math.floor(i / ring) / segment.tubular;
      segment.curve.getPointAt(Math.min(1, u), centre);

      // Taper: the tube is built at a constant radius, so pull each ring in
      // toward its axis by however much thinner the root is at that point.
      const taper = 1 + (segment.r1 / segment.r0 - 1) * u;
      vertex.fromBufferAttribute(position, i).sub(centre).multiplyScalar(taper).add(centre);
      position.setXYZ(i, vertex.x, vertex.y, vertex.z);

      grow[i] = (segment.birth + u * segment.life) / maxGrow;
      centers[i * 3] = centre.x;
      centers[i * 3 + 1] = centre.y;
      centers[i * 3 + 2] = centre.z;
    }

    geometry.setAttribute("aGrow", new THREE.BufferAttribute(grow, 1));
    geometry.setAttribute("aCenter", new THREE.BufferAttribute(centers, 3));
    geometry.computeVertexNormals();
    geometry.deleteAttribute("uv");
    parts.push(geometry);
  }

  const merged = mergeGeometries(parts, false)!;
  for (const part of parts) part.dispose();
  return merged;
}

export function Roots() {
  const geometry = useMemo(() => buildGeometry(), []);
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const aperture = useRef<THREE.Mesh>(null);
  const injected = useRef<{ uniforms: Record<string, { value: number }> } | null>(null);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const p = stageProgress();
    const grow = track(germination.growth, p);

    if (injected.current) injected.current.uniforms.uGrow.value = grow;

    const opening = aperture.current;
    if (opening) {
      const value = track(germination.aperture, p);
      opening.visible = value > 0.01;
      opening.scale.setScalar(0.03 * value);
    }
  });

  return (
    <>
      {/*
        The shell splitting. It has its own beat before any root shows, because
        something has to happen *to the grain* first — otherwise the root reads
        as an object arriving rather than as the seed opening.
      */}
      <mesh ref={aperture} position={ORIGIN} visible={false}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color="#241708" roughness={1} metalness={0} />
      </mesh>

      <mesh geometry={geometry} frustumCulled={false}>
        <meshStandardMaterial
          ref={material}
          color={palette.rootLight}
          roughness={0.88}
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

            shader.vertexShader = shader.vertexShader.replace(
              "#include <begin_vertex>",
              `#include <begin_vertex>
               float g = 1.0 - smoothstep(uGrow - 0.06, uGrow, aGrow);
               vGrow = g;
               transformed = mix(aCenter, transformed, g);`,
            );

            shader.fragmentShader = "varying float vGrow;\n" + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
              "#include <clipping_planes_fragment>",
              `#include <clipping_planes_fragment>
               if (vGrow < 0.04) discard;`,
            );
          }}
        />
      </mesh>
    </>
  );
}
