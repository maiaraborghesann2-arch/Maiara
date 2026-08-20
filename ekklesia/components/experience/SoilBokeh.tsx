"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { LANDING_Y, SEED_PLANTED_Y } from "@/lib/scroll/choreography";

const COUNT = 46;

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
 * Out-of-focus soil between the lens and the subject.
 *
 * This is the one thing a scene of uniformly sharp geometry cannot fake, and
 * without it the roots read as a specimen photographed against a dark card
 * rather than as something buried. A real macro lens at this working distance
 * has a depth of field of a few millimetres: matter in front of the plane of
 * focus does not disappear, it becomes a large, soft, dark shape that occludes
 * part of the frame.
 *
 * So these are not particles. They are a handful of big, very soft, very dark
 * discs sitting in the corridor the camera travels down, off the centre line so
 * they never cover the grain. As the camera descends and pulls back, different
 * ones pass close to the lens and swell — which is also the only foreground
 * parallax in the chapter.
 *
 * Positions are fixed in world space, so like everything else here this is a
 * pure function of where the scroll has put the camera, and scrubs backwards
 * exactly.
 */
export function SoilBokeh() {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const height = useThree((state) => state.size.height);

  const geometry = useMemo(() => {
    const random = mulberry32(0x3ba1);
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const alphas = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      // Off-centre by construction. A blob crossing the middle of the frame
      // would obscure the subject rather than frame it.
      const side = random() < 0.5 ? -1 : 1;
      positions[i * 3] = side * (0.42 + random() * 2.3);
      positions[i * 3 + 1] = LANDING_Y - random() * 2.6;
      positions[i * 3 + 2] = 0.7 + random() * 4.4;

      sizes[i] = 0.05 + random() ** 2.6 * 0.62;
      alphas[i] = 0.3 + random() * 0.55;
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    buffer.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    buffer.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    return buffer;
  }, []);

  const uniforms = useMemo(
    () => ({
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color("#0C0803") },
      uScale: { value: 900 },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const camY = state.camera.position.y;
    const below = Math.min(1, Math.max(0, (LANDING_Y - 0.1 - camY) / 0.5));

    if (points.current) points.current.visible = below > 0.01;
    if (material.current) {
      material.current.uniforms.uOpacity.value = below * 0.55;
      material.current.uniforms.uScale.value = height;
    }
  });

  return (
    <points ref={points} geometry={geometry} visible={false} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
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
    float d = max(0.25, -mv.z);
    // Clamped hard: a blob that reaches the lens would black out the frame.
    gl_PointSize = clamp(aSize * uScale / d, 4.0, 420.0);
    gl_Position = projectionMatrix * mv;
  }
`;

/**
 * A defocus disc, not a Gaussian. A real out-of-focus point spreads into the
 * shape of the aperture — bright in the middle only for specular highlights;
 * for an occluding dark object it is a soft-edged, near-solid patch. Falling
 * off like a blur kernel instead makes it read as smoke.
 */
const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5)) * 2.0;
    float a = (1.0 - smoothstep(0.12, 1.0, d)) * vAlpha * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;
