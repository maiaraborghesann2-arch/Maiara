"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { LANDING_Y } from "@/lib/scroll/choreography";

const COUNT = 130;

/** Deterministic PRNG so the field is identical on every reload. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Motes hanging in the light.
 *
 * These are almost invisible by design — a handful of specks at eight per cent
 * opacity. Their job is not to be seen but to give the empty frame a *depth*:
 * particles at different distances drift at different apparent speeds as the
 * camera moves, and that parallax is the only cue in an otherwise featureless
 * void that tells the eye there is space between it and the backdrop.
 *
 * They occupy a slab tall enough to cover the whole fall, so the camera passes
 * through the field rather than dragging it along.
 *
 * Unlike the narrative, these drift on time rather than scroll. They carry no
 * story, so they do not need to rewind — and a completely frozen field would
 * read as dirt on the lens.
 */
export function Motes() {
  const ref = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const height = useThree((state) => state.size.height);

  const { geometry, home } = useMemo(() => {
    const random = mulberry32(0x11055);
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const alphas = new Float32Array(COUNT);
    const anchors = new Float32Array(COUNT * 4);

    for (let i = 0; i < COUNT; i++) {
      const x = (random() - 0.5) * 6.4;
      const y = 1.4 - random() * 4.6;
      const z = (random() - 0.5) * 3.4;

      anchors[i * 4] = x;
      anchors[i * 4 + 1] = y;
      anchors[i * 4 + 2] = z;
      // Drift phase, so they do not rise in lockstep.
      anchors[i * 4 + 3] = random() * Math.PI * 2;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      sizes[i] = 0.7 + random() * random() * 3.4;
      // Nearer motes are a touch brighter; it reinforces the depth read.
      alphas[i] = (0.35 + random() * 0.65) * (0.6 + (z + 1.7) / 3.4 * 0.4);
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    buffer.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    buffer.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    return { geometry: buffer, home: anchors };
  }, []);

  const initialUniforms = useMemo(
    () => ({
      uOpacity: { value: 0.08 },
      uColor: { value: new THREE.Color("#8A6C4C") },
      uScale: { value: 5 },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const points = ref.current;
    const uniforms = material.current?.uniforms;
    if (!points || !uniforms) return;

    uniforms.uScale.value = height * 0.0052;

    /*
     * Motes belong to the lit room above. Underground there is no shaft of
     * light for dust to hang in, and leaving them on washes out the dark the
     * whole chapter depends on.
     */
    const below = Math.max(0, LANDING_Y + 0.3 - state.camera.position.y);
    uniforms.uOpacity.value = 0.08 * Math.max(0, 1 - below / 0.8);

    const time = state.clock.elapsedTime;
    const attribute = geometry.attributes.position as THREE.BufferAttribute;
    const array = attribute.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      const phase = home[i * 4 + 3];
      array[i * 3] = home[i * 4] + Math.sin(time * 0.09 + phase) * 0.075;
      array[i * 3 + 1] = home[i * 4 + 1] + Math.sin(time * 0.06 + phase * 1.7) * 0.055;
      array[i * 3 + 2] = home[i * 4 + 2] + Math.cos(time * 0.07 + phase) * 0.06;
    }

    attribute.needsUpdate = true;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={initialUniforms}
        transparent
        depthWrite={false}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
      />
    </points>
  );
}

const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uScale;
  varying float vAlpha;

  void main() {
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Clamped. Act II flies the camera straight through this field, and an
    // unclamped mote passing within centimetres of the lens covers a third of
    // the frame in pale haze — which is exactly what buried the underground.
    gl_PointSize = min(18.0, aSize * uScale / max(0.1, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    // Ascending edges: smoothstep with edge0 >= edge1 is undefined in GLSL.
    float a = (1.0 - smoothstep(0.05, 0.5, d)) * vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;
