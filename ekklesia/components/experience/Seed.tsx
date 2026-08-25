"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { sceneState } from "@/lib/scene/sharedState";
import { stageProgress } from "@/lib/scroll/stage";
import {
  GROUND_Y,
  germination,
  plant,
  seed as choreo,
  shoot,
} from "@/lib/scroll/choreography";
import {
  SHOOT_SEED_START,
  shootParam,
  shootPointAt,
  shootUniform,
} from "./shootSystem";
import { SEED_HALF_HEIGHT, createSeedGeometry, createSeedMaps } from "./seedGeometry";

/**
 * Frames 01–04: the grain rests, turns, falls and lands.
 *
 * It never moves sideways. Everything the viewer reads as the grain "arriving
 * at the Home" is the camera panning left around an object that has not budged
 * since impact — which is the difference between a landing that causes the
 * Home and an object that slides into a layout.
 *
 * No `useState`, no prop carrying progress: the component pulls the stage clock
 * inside `useFrame` and writes straight to the object3D. React renders this once
 * and then stays out of the way for the rest of the session.
 */
export function Seed({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const split = useRef<{ uniforms: Record<string, { value: number }> } | null>(null);
  const lifted = useMemo(() => new THREE.Vector3(), []);
  const geometry = useMemo(() => createSeedGeometry(), []);
  const maps = useMemo(() => createSeedMaps(), []);

  // `aoMap` reads the second UV set, which SphereGeometry does not provide.
  useEffect(() => {
    geometry.setAttribute("uv1", geometry.attributes.uv);
  }, [geometry]);

  useEffect(
    () => () => {
      geometry.dispose();
      maps.dispose();
    },
    [geometry, maps],
  );

  useFrame((state) => {
    const mesh = ref.current;
    if (!mesh) return;

    const p = stageProgress();
    const time = state.clock.elapsedTime;
    const idle = reducedMotion ? 0 : track(choreo.idle, p);

    const scale = track(choreo.scale, p);
    /*
     * The coat is shed, not resized. Everywhere else in the piece the grain
     * holds a constant scale because apparent size is the lens's job — but at
     * the surface the thing on screen stops being a seed and becomes an empty
     * husk with two leaves pushing out of it, and a husk does shrink back and
     * slip down the stem as the cotyledons take the space. Without it the
     * leaves spend the whole beat behind an opaque ball.
     */
    const shed = track(shoot.cotyledon, p);
    // And then it falls off. A husk that rides the node through the plant's
    // whole growth stops reading as a discarded coat and starts reading as part
    // of the plant, which is the one thing it is not.
    const dropped = track(plant.shed, p);
    mesh.scale.setScalar(scale * (1 - shed * 0.46) * (1 - dropped));
    mesh.visible = dropped < 0.995;

    // Resting height derives from the current scale, so the grain stays welded
    // to the ledge however the scale is retuned.
    const resting = GROUND_Y + SEED_HALF_HEIGHT * scale;

    /*
     * Through Acts I and II the grain's height is the fall track. In Act III it
     * *rides the shoot's tip*, because that is what mustard actually does:
     * germination is epigeal, the hypocotyl arches up and carries the seed coat
     * out of the ground, and the coat then splits into the first two leaves.
     *
     * Which means the grain the viewer has followed since the opening frame is
     * the thing that breaks the surface. There is no substitution to hide and
     * no dissolve to time — the same object simply arrives somewhere else.
     *
     * The two are read from the same parameter the geometry is revealed by, so
     * the tip of the stem and the grain sitting on it cannot drift apart, in
     * either scroll direction.
     */
    const climb = shootParam(shootUniform(track(germination.growth, p), track(shoot.growth, p)));
    const drift = new THREE.Vector3(
      idle * Math.sin(time * 0.4) * 0.004,
      resting + track(choreo.fall, p) + idle * Math.sin(time * 0.61) * 0.005,
      0,
    );

    if (climb > SHOOT_SEED_START) {
      shootPointAt(climb, lifted);
      // A short blend across the hand-over. The two agree to about a millimetre
      // at the crossing, but "about" is not a thing to leave in a scrub.
      const onto = Math.min(1, (climb - SHOOT_SEED_START) / 0.02);
      mesh.position.lerpVectors(drift, lifted, onto);
      // Slips back down the stem as it empties.
      mesh.position.y -= shed * scale * 0.62;
    } else {
      mesh.position.copy(drift);
    }

    mesh.rotation.x = track(choreo.rotationX, p) + idle * Math.sin(time * 0.33) * 0.02;
    mesh.rotation.y = track(choreo.rotationY, p) + idle * time * 0.016;
    mesh.rotation.z = track(choreo.rotationZ, p) + idle * Math.cos(time * 0.27) * 0.014;

    /*
     * The shell parting. Zero everywhere in Act I — the uniform is driven off
     * the germination track, which does not leave zero until 1.46 — so the
     * grain Act I was approved on is bit-for-bit the closed one.
     */
    if (split.current) {
      // The coat parts a little to let the radicle out, and then all the way as
      // the cotyledons take over at the surface.
      split.current.uniforms.uSplit.value =
        track(germination.aperture, p) + track(shoot.cotyledon, p) * 2.6;
      split.current.uniforms.uSplitAxis.value = -mesh.rotation.y;
    }

    // Publish for the backdrop's light pool and the shadow rig.
    sceneState.seedPosition.copy(mesh.position);
    sceneState.seedScale = scale;
  });

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshStandardMaterial
        map={maps.map}
        roughnessMap={maps.roughnessMap}
        normalMap={maps.normalMap}
        aoMap={maps.aoMap}
        aoMapIntensity={0.85}
        normalScale={new THREE.Vector2(1.15, 1.15)}
        metalness={0}
        envMapIntensity={0.55}
        side={THREE.DoubleSide}
        onBeforeCompile={(shader) => {
          shader.uniforms.uSplit = { value: 0 };
          shader.uniforms.uSplitAxis = { value: 0 };
          split.current = shader as unknown as {
            uniforms: Record<string, { value: number }>;
          };

          shader.vertexShader =
            "uniform float uSplit;\nuniform float uSplitAxis;\n" + shader.vertexShader;
          /*
           * One seam, doing two jobs at two moments.
           *
           * While the grain is buried it barely opens — a few tenths of a
           * millimetre at the lower pole, which is where the radicle leaves.
           * At the surface the same seam carries the coat the rest of the way:
           * it splits the full height and the halves draw apart, because that
           * is what a seed coat does when the cotyledons inside it expand, and
           * because two shells opening is the only way the leaves have to get
           * out from behind a solid ball.
           */
          shader.vertexShader = shader.vertexShader.replace(
            "#include <begin_vertex>",
            `#include <begin_vertex>
             float lower = smoothstep(0.1, -0.85, transformed.y);
             float band = 1.0 - smoothstep(0.5, 1.0, abs(transformed.y));
             float part = uSplit * (lower * 0.055 + band * 0.085);
             /*
              * The seam is oriented in *world* terms, not in the grain's own.
              * The grain has been turning since the first act and ends up a
              * third of a turn round; a split applied along local x lands
              * edge-on to the lens and the coat reads as solid however far it
              * has opened. The uniform cancels the grain's own rotation so the
              * halves always draw apart across the frame.
              */
             float ca = cos(uSplitAxis);
             float sa = sin(uSplitAxis);
             float across = transformed.x * ca + transformed.z * sa;
             float side = sign(across + 0.0001) * part;
             transformed.x += ca * side;
             transformed.z += sa * side;
             transformed.y -= uSplit * lower * 0.02;`,
          );
        }}
      />
    </mesh>
  );
}
