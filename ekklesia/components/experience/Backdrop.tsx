"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { palette } from "@/lib/palette";
import { sceneState } from "@/lib/scene/sharedState";
import { progressStore } from "@/lib/scroll/progressStore";
import { backdrop as choreo } from "@/lib/scroll/choreography";

/**
 * The sand is a lit surface, not a fill.
 *
 * A flat `#ECDACB` reads as an empty browser window; the same colour with a
 * vertical wash, a warm pool where the light lands, a vignette and a whisper of
 * grain reads as a photographed backdrop. That difference is most of what
 * separates "prototype" from "film still" here, and it costs one full-screen
 * quad.
 *
 * The pool and the cast shadow track the seed's *screen* position, so the
 * lighting follows the object through the whole act. In Act 04 that is what
 * ties the seed to the typography: both sit inside one lighting environment
 * instead of being two layers stacked on top of each other.
 */
export function Backdrop() {
  /**
   * Written through the material's own ref: the object passed to the `uniforms`
   * prop is not guaranteed to be the one the material ends up holding, and
   * writes to a detached copy fail silently.
   */
  const material = useRef<THREE.ShaderMaterial>(null);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const projected = useRef(new THREE.Vector3());

  const initialUniforms = useMemo(
    () => ({
      uSand: { value: new THREE.Color(palette.sand) },
      uSandLight: { value: new THREE.Color(palette.sandLight) },
      uSandWarm: { value: new THREE.Color(palette.sandWarm) },
      uSandDeep: { value: new THREE.Color(palette.sandDeep) },
      uSeed: { value: new THREE.Vector2(0.5, 0.5) },
      uAspect: { value: 1 },
      uPool: { value: 0.55 },
      uPoolSize: { value: 30 },
      uCast: { value: 0 },
      uVignette: { value: 0.17 },
      uGrain: { value: 0.014 },
    }),
    [],
  );

  useFrame(() => {
    const uniforms = material.current?.uniforms;
    if (!uniforms) return;

    const p = progressStore.get();

    projected.current.copy(sceneState.seedPosition).project(camera);
    uniforms.uSeed.value.set(
      projected.current.x * 0.5 + 0.5,
      projected.current.y * 0.5 + 0.5,
    );

    uniforms.uAspect.value = size.width / size.height;
    uniforms.uPool.value = track(choreo.pool, p);
    uniforms.uCast.value = track(choreo.cast, p);
    uniforms.uVignette.value = track(choreo.vignette, p);

    // The pool grows with the object, so the light always feels like it belongs
    // to the seed rather than being a fixed spot it happens to pass through.
    uniforms.uPoolSize.value = 0.42 / Math.max(0.04, sceneState.seedScale ** 1.55);
  });

  return (
    <mesh renderOrder={-1000} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        uniforms={initialUniforms}
        depthTest={false}
        depthWrite={false}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
      />
    </mesh>
  );
}

/** Screen-space quad: ignore the matrices entirely and draw straight to NDC. */
const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
  }
`;

/**
 * Deliberately not tone mapped. Art direction specified `#ECDACB` exactly, and
 * routing it through ACES would hand back a different colour; the seed still
 * gets the filmic curve, which is where it earns its keep.
 */
const FRAGMENT = /* glsl */ `
  uniform vec3 uSand;
  uniform vec3 uSandLight;
  uniform vec3 uSandWarm;
  uniform vec3 uSandDeep;
  uniform vec2 uSeed;
  uniform float uAspect;
  uniform float uPool;
  uniform float uPoolSize;
  uniform float uCast;
  uniform float uVignette;
  uniform float uGrain;

  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = vUv;

    // Vertical wash: light gathers toward the top, sand settles at the bottom.
    vec3 col = mix(uSandDeep, uSand, smoothstep(-0.3, 0.58, uv.y));
    col = mix(col, uSandLight, smoothstep(0.42, 1.0, uv.y) * 0.62);

    vec2 d = uv - uSeed;
    d.x *= uAspect;
    col = mix(col, uSandWarm, exp(-dot(d, d) * uPoolSize) * uPool);

    // Cast shadow, offset down and to the left of the key light. Kept tight:
    // a small object throws a small shadow, and a broad one reads as a smudge
    // on the page rather than as light being blocked.
    vec2 s = (uv - uSeed) - vec2(-0.03, -0.055);
    s.x *= uAspect;
    s.y *= 1.35;
    col *= 1.0 - exp(-dot(s, s) * 92.0) * uCast;

    vec2 c = (uv - 0.5) * vec2(uAspect, 1.0);
    col *= 1.0 - uVignette * smoothstep(0.2, 0.9, length(c));

    // Fine grain. Without it the gradient bands on wide displays and the whole
    // frame reads as vector art rather than something photographed.
    col += (hash(uv * 1024.0) - 0.5) * uGrain;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;
