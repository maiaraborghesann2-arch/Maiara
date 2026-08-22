"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { stageProgress } from "@/lib/scroll/stage";
import { backdrop as choreo } from "@/lib/scroll/choreography";
import { postAmount } from "@/lib/scene/depth";

/**
 * A vignette that lands on the *scene*, not on the backdrop.
 *
 * `Backdrop` paints its vignette into its own quad, which works for as long as
 * the backdrop is most of the frame — all of Act I. The moment the camera is
 * inside the soil the frame is geometry from edge to edge, the backdrop is
 * hidden behind it, and the containment goes with it: the underground came out
 * evenly lit corner to corner, which is a texture swatch, not a room.
 *
 * So: one multiply pass, drawn last, over everything. It is held at zero above
 * the surface so Act I is bit-for-bit what was approved.
 */
export function Grade() {
  const material = useRef<THREE.ShaderMaterial>(null);

  const initialUniforms = useMemo(
    () => ({
      uAmount: { value: 0 },
      uAspect: { value: 1 },
    }),
    [],
  );

  useFrame((state) => {
    const uniforms = material.current?.uniforms;
    if (!uniforms) return;

    /*
     * Gated on the lens crossing the plane rather than on a keyframe, for the
     * same reason everything else underground is: retime the descent and the
     * grade still arrives on the crossing.
     */
    const p = stageProgress();
    const below = postAmount(state.camera.position.y, p);
    /*
     * Also ramped in on the clock from the top of Act II, because the planting
     * happens *above* the surface: by then the ground fills the frame, the
     * backdrop is completely hidden behind it, and without this the shot is an
     * evenly lit carpet corner to corner. Zero anywhere in Act I.
     */
    const entered = Math.min(1, Math.max(0, (p - 1.06) / 0.14));
    /*
     * Released to `Focus` as the lens goes under. Below the surface the frame
     * is composited through the depth-of-field pass, which applies the same
     * vignette with the same curve — but in linear, before the tone curve,
     * which is where it physically belongs. Running both would double it.
     */
    uniforms.uAmount.value = Math.max(below, entered) * (1 - below) * track(choreo.vignette, p);
    uniforms.uAspect.value = state.size.width / state.size.height;
  });

  return (
    <mesh renderOrder={1000} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={material}
        uniforms={initialUniforms}
        transparent
        depthTest={false}
        depthWrite={false}
        blending={THREE.MultiplyBlending}
        // Required by three's state cache for multiply; the pass writes an
        // opaque grey it multiplies the frame by, so alpha never varies.
        premultipliedAlpha
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
      />
    </mesh>
  );
}

const VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uAmount;
  uniform float uAspect;
  varying vec2 vUv;

  void main() {
    vec2 c = (vUv - 0.5) * vec2(uAspect, 1.0);
    // Wide and soft. A tight vignette reads as a lens defect; this one is only
    // meant to say the room has walls we cannot see.
    float fall = smoothstep(0.16, 0.86, length(c));
    // A little extra weight along the top, where the earth overhead is.
    fall = min(1.0, fall + smoothstep(0.62, 1.0, vUv.y) * 0.22);
    float k = 1.0 - fall * uAmount;
    gl_FragColor = vec4(vec3(k), 1.0);
  }
`;
