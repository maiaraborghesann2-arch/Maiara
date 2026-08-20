"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { palette } from "@/lib/palette";
import { sceneState } from "@/lib/scene/sharedState";
import { stageProgress } from "@/lib/scroll/stage";
import { LANDING_Y, backdrop as choreo } from "@/lib/scroll/choreography";

/**
 * The sand is a photographed surface, not a fill.
 *
 * Five things are layered here, and each one is doing a job the flat colour
 * cannot: a vertical wash (light has a direction), a warm pool that follows the
 * grain (the object is lit by something), a broad haze band (there is air in
 * the room), a vignette (there is a lens), and a stretched fibre texture under
 * all of it (the surface is a material). Take any of them away and the frame
 * slides back toward "empty browser window".
 *
 * The pool and the cast shadow track the grain's *screen* position, which is
 * what binds object and typography in Act 04: both end up inside one lighting
 * environment instead of being two layers stacked on each other.
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
  const horizonPoint = useRef(new THREE.Vector3());

  const initialUniforms = useMemo(
    () => ({
      uSand: { value: new THREE.Color(palette.sand) },
      uSandLight: { value: new THREE.Color(palette.sandLight) },
      uSandWarm: { value: new THREE.Color(palette.sandWarm) },
      uShaftColor: { value: new THREE.Color(palette.shaft) },
      uSandDeep: { value: new THREE.Color(palette.sandDeep) },
      uEarth: { value: new THREE.Color(palette.earth) },
      uUnderground: { value: new THREE.Color(palette.soil) },
      uDepth: { value: 0 },
      uDeep: { value: 0 },
      uSeed: { value: new THREE.Vector2(0.5, 0.5) },
      uAspect: { value: 1 },
      uPool: { value: 0.42 },
      uPoolSize: { value: 30 },
      uCast: { value: 0 },
      uHaze: { value: 0.24 },
      uVignette: { value: 0.16 },
      uShaft: { value: 0.1 },
      uFloor: { value: 0 },
      uHorizon: { value: -1 },
      uGrain: { value: 0.013 },
      uFibre: { value: 0.03 },
    }),
    [],
  );

  useFrame(() => {
    const uniforms = material.current?.uniforms;
    if (!uniforms) return;

    const p = stageProgress();

    projected.current.copy(sceneState.seedPosition).project(camera);
    uniforms.uSeed.value.set(projected.current.x * 0.5 + 0.5, projected.current.y * 0.5 + 0.5);

    uniforms.uAspect.value = size.width / size.height;
    uniforms.uPool.value = track(choreo.pool, p);
    uniforms.uCast.value = track(choreo.cast, p);
    uniforms.uHaze.value = track(choreo.haze, p);
    uniforms.uVignette.value = track(choreo.vignette, p);
    uniforms.uShaft.value = track(choreo.shaft, p);
    uniforms.uFloor.value = track(choreo.floor, p);

    /*
     * Underground is read off the camera, not off a track. The moment the lens
     * passes the landing plane the world has to change, and tying that to the
     * camera's own height means it happens exactly on the crossing however the
     * descent is later retimed. `uDepth` closes the room quickly; `uDeep` is the
     * slower measure that lets the light from the surface recede over the whole
     * descent rather than snapping out.
     */
    /*
     * The darkening starts *above* the plane, not at it. A surface has no
     * thickness, so crossing one is a single frame — and if the world only
     * begins to change on that frame, the camera reads as passing through a
     * sheet of paper rather than pressing into a material. Beginning the
     * transition a little before contact is what gives the entry a body.
     */
    const below = LANDING_Y + 0.35 - camera.position.y;
    // Short. Soil is opaque — a hand's breadth under the surface it is already
    // dark, and a long ramp leaves the frame in a pale grey nowhere for the
    // whole crossing instead of putting us inside a material.
    uniforms.uDepth.value = Math.min(1, Math.max(0, below / 0.55));
    // The daylight seam should be gone within a hand's breadth of soil. It was
    // written for a backdrop that *was* the underground; the soil now has a
    // ceiling of its own, and any seam still burning behind it only shows in
    // the sliver the geometry does not cover.
    uniforms.uDeep.value = Math.min(1, Math.max(0, below / 0.75));
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
 * routing it through ACES would hand back a different colour; the grain still
 * gets the filmic curve, which is where it earns its keep.
 */
const FRAGMENT = /* glsl */ `
  uniform vec3 uSand;
  uniform vec3 uSandLight;
  uniform vec3 uSandWarm;
  uniform vec3 uShaftColor;
  uniform vec3 uSandDeep;
  uniform vec3 uEarth;
  uniform vec3 uUnderground;
  uniform float uDepth;
  uniform float uDeep;
  uniform vec2 uSeed;
  uniform float uAspect;
  uniform float uPool;
  uniform float uPoolSize;
  uniform float uCast;
  uniform float uHaze;
  uniform float uVignette;
  uniform float uShaft;
  uniform float uFloor;
  uniform float uHorizon;
  uniform float uGrain;
  uniform float uFibre;

  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    vec2 uv = vUv;

    // Wash: light gathers toward the top, sand settles at the bottom.
    vec3 col = mix(uSandDeep, uSand, smoothstep(-0.3, 0.58, uv.y));
    col = mix(col, uSandLight, smoothstep(0.42, 1.0, uv.y) * 0.6);

    // Pool of light around the grain.
    vec2 d = uv - uSeed;
    d.x *= uAspect;
    col = mix(col, uSandWarm, exp(-dot(d, d) * uPoolSize) * uPool);

    // Atmospheric haze: a broad soft band across the upper middle, the way air
    // in a lit room lifts and flattens whatever sits behind it.
    float band = exp(-pow((uv.y - 0.64) * 1.75, 2.0) * 3.2);
    col = mix(col, uSandWarm, band * uHaze * 0.5);

    // Cast shadow on the page, offset away from the key light. Kept tight —
    // a small object throws a small shadow, and a broad one reads as a smudge.
    vec2 s = (uv - uSeed) - vec2(-0.03, -0.05);
    s.x *= uAspect;
    s.y *= 1.35;
    col *= 1.0 - exp(-dot(s, s) * 110.0) * uCast;

    // Warm shafts raking down from the upper left. More than anything else in
    // this shader, these are what make the room read as lit rather than filled.
    vec2 r = uv - vec2(0.02, 1.06);
    r.x *= uAspect;
    float ang = -0.58;
    vec2 rot = vec2(r.x * cos(ang) - r.y * sin(ang), r.x * sin(ang) + r.y * cos(ang));
    float shaft = pow(0.5 + 0.5 * sin(rot.x * 6.2), 3.0)
                * (0.55 + 0.45 * pow(0.5 + 0.5 * sin(rot.x * 2.3 + 1.7), 2.0));
    col = mix(col, uShaftColor, shaft * exp(-length(r) * 0.58) * uShaft);

    /*
     * The earth, receding into haze rather than ending at a line. Density rises
     * with the square of the distance below the horizon, which is roughly how a
     * ground plane reads through air: nothing at the vanishing line, unmistakable
     * at your feet.
     */
    float below = pow(clamp((uHorizon - uv.y) / max(0.12, uHorizon), 0.0, 1.0), 2.0);
    col = mix(col, uEarth, below * uFloor);

    vec2 c = (uv - 0.5) * vec2(uAspect, 1.0);
    col *= 1.0 - uVignette * smoothstep(0.2, 0.92, length(c));

    // Fibre: two octaves stretched vertically, so the surface reads as a
    // material with a grain direction rather than as a gradient.
    float fibre = vnoise(uv * vec2(180.0, 620.0)) * 0.62
                + vnoise(uv * vec2(70.0, 220.0)) * 0.38;
    // The floor carries a coarser tooth than the air above it.
    float grit = vnoise(uv * vec2(420.0, 160.0));
    col *= 1.0 + (fibre - 0.5) * uFibre
               + (grit - 0.5) * uFibre * 4.2 * below * uFloor;

    // Fine grain on top. Without it the wash bands visibly on wide displays.
    col += (hash21(uv * 1024.0) - 0.5) * uGrain;

    /*
     * Below the surface. Everything above was a lit room; this is the inside of
     * a material. The only light left is what comes back down through the hole
     * we fell in by, and it shrinks and dims the further we get from it.
     */
    if (uDepth > 0.001) {
      // Tight: a narrow band at the very top of frame reads as an opening we
      // are moving away from. Spread wide it just reads as fog.
      // A narrow seam of daylight at the very top of frame, and no more. Wider
      // than this it stops being an opening we are leaving behind and becomes
      // an overcast sky the soil is apparently lit by.
      float glow = exp(-pow((uv.y - 1.0) * 5.2, 2.0) * 2.6) * (1.0 - uDeep);
      vec3 under = mix(uUnderground, uSandWarm, glow * 0.34);
      col = mix(col, under, uDepth);
    }

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;
