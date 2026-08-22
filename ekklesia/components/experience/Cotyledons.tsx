"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { sceneState } from "@/lib/scene/sharedState";
import { stageProgress } from "@/lib/scroll/stage";
import { shoot } from "@/lib/scroll/choreography";

/**
 * The first two leaves.
 *
 * Deliberately barely there. They are what the seed coat becomes as it splits
 * at the surface — the note for this stage is *a sprout*, not a seedling with
 * foliage, and everything about them is sized so the next act still has
 * somewhere to go: two blades a third of the grain's width, folded almost shut,
 * opening to something under forty degrees.
 *
 * They ride the grain rather than the world, because the grain is riding the
 * stem: one position, published by `Seed` each frame, keeps all three welded
 * together however the scroll is scrubbed.
 */
export function Cotyledons() {
  const group = useRef<THREE.Group>(null);
  const left = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => createBlade(), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const node = group.current;
    if (!node) return;

    const open = track(shoot.cotyledon, stageProgress());
    node.visible = open > 0.004;
    if (!node.visible) return;

    const { seedPosition, seedScale } = sceneState;
    // Sat on the grain's upper pole; the coat is what they are made of.
    /*
     * Anchored above the coat, which is slipping down as they expand — so they
     * read as the thing pushing it off rather than as two ears behind a nut.
     */
    node.position.set(seedPosition.x, seedPosition.y + seedScale * 0.5, seedPosition.z);
    node.scale.setScalar(0.55 + open * 0.65);

    /*
     * Still closing over each other at the start. A pair that begins at ninety
     * degrees reads as a plant that has been up for a week; the whole point of
     * the beat is that this one broke through a moment ago.
     */
    // Barely apart. A pair opened wide reads as a plant that has been up for a
    // week; this one broke through a moment ago.
    const angle = 0.07 + open * 0.38;
    if (left.current) left.current.rotation.z = angle;
    if (right.current) right.current.rotation.z = -angle;
  });

  return (
    <group ref={group} visible={false}>
      {/*
        Both blades face the lens and lean apart across the frame. Turned to
        face each other instead — the obvious build — one of them spends the
        whole beat behind the coat.
      */}
      <mesh ref={left} geometry={geometry} rotation={[0, 0.3, 0.13]}>
        <meshStandardMaterial
          vertexColors
          roughness={0.78}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={right} geometry={geometry} rotation={[0, -0.3, -0.13]}>
        <meshStandardMaterial
          vertexColors
          color="#DCD8CC"
          roughness={0.8}
          metalness={0}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

/**
 * One blade: a lanceolate strip, cupped along its length and drooping a little
 * under its own weight. Built by hand rather than from a plane because the
 * silhouette is the whole of it at this size — a rectangle with a leaf texture
 * would read as a rectangle.
 */
function createBlade() {
  const ALONG = 14;
  const ACROSS = 5;
  const LENGTH = 0.125;
  const HALF_WIDTH = 0.036;

  const position = new Float32Array((ALONG + 1) * (ACROSS + 1) * 3);
  const colour = new Float32Array((ALONG + 1) * (ACROSS + 1) * 3);
  const indices: number[] = [];

  /*
   * Shaded per vertex, like everything else here. A blade this size gets no
   * useful modelling from three lights and a flat albedo — it comes out as cut
   * paper. Darker where it leaves the coat, barely paler and warmer at the
   * edges where a real cotyledon is thin enough to pass light.
   */
  const root = new THREE.Color("#5E6440");
  const edge = new THREE.Color("#909067");
  const tone = new THREE.Color();

  for (let i = 0; i <= ALONG; i++) {
    const v = i / ALONG;
    // Widest a third of the way out, drawn to a soft point.
    const width = HALF_WIDTH * Math.pow(Math.sin(Math.PI * Math.pow(v, 0.78)), 0.8);
    // A young cotyledon is not flat: it is still creased from the coat.
    const cup = 0.3 * width;
    const droop = -0.16 * v * v * LENGTH;

    for (let j = 0; j <= ACROSS; j++) {
      const u = (j / ACROSS) * 2 - 1;
      const index = (i * (ACROSS + 1) + j) * 3;
      position[index] = u * width;
      position[index + 1] = v * LENGTH + droop;
      position[index + 2] = (1 - u * u) * cup;

      tone.copy(root).lerp(edge, Math.min(1, v * 0.75 + Math.abs(u) * 0.42));
      colour[index] = tone.r;
      colour[index + 1] = tone.g;
      colour[index + 2] = tone.b;
    }
  }

  for (let i = 0; i < ALONG; i++) {
    for (let j = 0; j < ACROSS; j++) {
      const a = i * (ACROSS + 1) + j;
      const b = a + ACROSS + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(position, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colour, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
