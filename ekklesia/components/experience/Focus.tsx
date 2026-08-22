"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { sceneState } from "@/lib/scene/sharedState";
import { stageProgress } from "@/lib/scroll/stage";
import { backdrop as choreo } from "@/lib/scroll/choreography";
import { postAmount } from "@/lib/scene/depth";

/**
 * Depth of field, for real this time.
 *
 * The previous round faked it with dark soft sprites near the lens, and said so.
 * That gets you foreground occlusion and nothing else — the background stays
 * uniformly sharp, which is the tell that the frame is a 3D scene rather than a
 * photograph. A macro lens at this working distance has a depth of field of
 * millimetres; everything except the grain and the near roots should be losing
 * definition, and the loss should be gradual with distance.
 *
 * So this takes over the render: scene into a target with a depth buffer, a
 * circle-of-confusion computed per pixel from the distance to the grain, a
 * half-resolution disc gather weighted by each tap's own CoC (so sharp things
 * do not bleed outward into soft ones), and a composite that mixes the two.
 *
 * **Act I never goes through it.** Above the surface this renders exactly what
 * the default loop rendered — same call, same target, same state — because the
 * post chain has to apply tone mapping itself (three skips it when drawing into
 * a render target) and Act I's backdrop is deliberately *not* tone mapped. Any
 * pixel of Act I that went through the composite would come back a different
 * colour, and Act I is approved.
 */
export function Focus() {
  const { gl, scene, camera, size, viewport } = useThree();

  const targets = useMemo(() => {
    const colour = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      // Left linear on purpose: `linearToOutputTexel` is generated from the
      // *target's* colour space, so every material writes plain linear here and
      // the composite is the single place encoding happens.
      colorSpace: THREE.LinearSRGBColorSpace,
      depthBuffer: true,
    });
    colour.depthTexture = new THREE.DepthTexture(1, 1, THREE.UnsignedIntType);
    colour.depthTexture.format = THREE.DepthFormat;

    const blurred = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      colorSpace: THREE.LinearSRGBColorSpace,
      depthBuffer: false,
    });

    return { colour, blurred };
  }, []);

  const passes = useMemo(() => {
    const quad = new THREE.PlaneGeometry(2, 2);
    const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const shared = {
      tColour: { value: null as THREE.Texture | null },
      tDepth: { value: null as THREE.Texture | null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uNear: { value: 0.1 },
      uFar: { value: 100 },
      uFocus: { value: 2 },
      uNearRange: { value: 0.5 },
      uFarRange: { value: 3.2 },
      uRadius: { value: 9 },
    };

    const blurMaterial = new THREE.ShaderMaterial({
      uniforms: shared,
      vertexShader: QUAD_VERTEX,
      fragmentShader: BLUR_FRAGMENT,
      depthTest: false,
      depthWrite: false,
    });

    const compositeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        ...shared,
        tBlur: { value: null as THREE.Texture | null },
        uExposure: { value: 1.08 },
        uVignette: { value: 0 },
        uAspect: { value: 1 },
      },
      vertexShader: QUAD_VERTEX,
      fragmentShader: COMPOSITE_FRAGMENT,
      depthTest: false,
      depthWrite: false,
    });

    const blurScene = new THREE.Scene().add(new THREE.Mesh(quad, blurMaterial));
    const compositeScene = new THREE.Scene().add(new THREE.Mesh(quad, compositeMaterial));

    return { quad, quadCamera, shared, blurMaterial, compositeMaterial, blurScene, compositeScene };
  }, []);

  useEffect(
    () => () => {
      targets.colour.depthTexture?.dispose();
      targets.colour.dispose();
      targets.blurred.dispose();
      passes.quad.dispose();
      passes.blurMaterial.dispose();
      passes.compositeMaterial.dispose();
    },
    [targets, passes],
  );

  useEffect(() => {
    const width = Math.max(1, Math.floor(size.width * viewport.dpr));
    const height = Math.max(1, Math.floor(size.height * viewport.dpr));
    targets.colour.setSize(width, height);
    // Half resolution. A disc gather is quadratic in radius and the result is
    // blurred by definition — full resolution buys nothing you can see.
    targets.blurred.setSize(Math.max(1, width >> 1), Math.max(1, height >> 1));
    passes.shared.uResolution.value.set(width, height);
  }, [size, viewport.dpr, targets, passes]);

  /*
   * Priority 1 takes rendering away from the default loop for the whole
   * session, so this callback is responsible for drawing every frame — both
   * paths, not just the one it added.
   */
  useFrame((state) => {
    const p = stageProgress();
    const active = postAmount(state.camera.position.y, p);

    if (active <= 0.001) {
      gl.setRenderTarget(null);
      gl.render(scene, camera);
      return;
    }

    const perspective = camera as THREE.PerspectiveCamera;
    const { shared, compositeMaterial } = passes;

    shared.uNear.value = perspective.near;
    shared.uFar.value = perspective.far;
    // Focused on the grain, always. It is the subject of every frame down here,
    // and the roots hang within a stop of it.
    /*
     * Focused on whichever is nearer: the grain, or the axis itself.
     *
     * Locking onto the grain works for as long as the grain is the subject. It
     * stops working the moment the lens comes in beside the stem — there the
     * subject is the run of tube a few centimetres away, the grain is half a
     * metre off, and focusing on the grain puts the only thing in frame outside
     * the near limit. The axis is a vertical line through the origin, so its
     * distance is just the lens's own horizontal radius.
     */
    const toSeed = camera.position.distanceTo(sceneState.seedPosition);
    const toAxis = Math.hypot(camera.position.x, camera.position.z);
    const focus = Math.max(0.12, Math.min(toSeed, toAxis));
    shared.uFocus.value = focus;
    /*
     * Both ranges scale with the focus distance, because depth of field does.
     * Held at the macro figures, the wide shot that takes in the whole root
     * system puts its lower two thirds a couple of units past focus and
     * dissolves them — the frame that is supposed to *show* the root system.
     */
    shared.uNearRange.value = Math.max(0.3, focus * 0.3);
    shared.uFarRange.value = Math.max(1.3, focus * 1.25);
    shared.uRadius.value = (4 + active * 8) * Math.min(1.2, Math.max(0.5, 2.4 / focus));

    gl.setRenderTarget(targets.colour);
    gl.clear();
    gl.render(scene, camera);

    shared.tColour.value = targets.colour.texture;
    shared.tDepth.value = targets.colour.depthTexture;

    gl.setRenderTarget(targets.blurred);
    gl.render(passes.blurScene, passes.quadCamera);

    compositeMaterial.uniforms.tBlur.value = targets.blurred.texture;
    compositeMaterial.uniforms.uVignette.value = active * track(choreo.vignette, p);
    compositeMaterial.uniforms.uAspect.value = size.width / size.height;

    gl.setRenderTarget(null);
    gl.render(passes.compositeScene, passes.quadCamera);
  }, 1);

  return null;
}

const QUAD_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/** Shared by both passes, so the composite mixes against the same CoC the blur
 *  gathered with. */
const COC = /* glsl */ `
  uniform sampler2D tColour;
  uniform sampler2D tDepth;
  uniform vec2 uResolution;
  uniform float uNear;
  uniform float uFar;
  uniform float uFocus;
  uniform float uNearRange;
  uniform float uFarRange;
  uniform float uRadius;

  varying vec2 vUv;

  float viewDistance(vec2 uv) {
    float depth = texture2D(tDepth, uv).x;
    // Nothing was drawn: treat it as infinitely far rather than as touching
    // the lens, which is what the raw 1.0 would decode to.
    if (depth >= 1.0) return uFar;
    float z = (2.0 * uNear * uFar) / (uFar + uNear - (depth * 2.0 - 1.0) * (uFar - uNear));
    return z;
  }

  float coc(vec2 uv) {
    float d = viewDistance(uv);
    // Asymmetric on purpose. Foreground goes soft fast, the way it does through
    // a macro lens; the background is allowed to fall off over a long distance
    // so the soil recedes instead of dropping off a shelf.
    float near = clamp((uFocus - d) / uNearRange, 0.0, 1.0);
    float far = clamp((d - uFocus) / uFarRange, 0.0, 1.0);
    return max(near * 1.0, far * 0.85);
  }
`;

const TAPS = 22;

const BLUR_FRAGMENT = /* glsl */ `
  ${COC}

  void main() {
    float centre = coc(vUv);
    float radius = centre * uRadius;

    vec3 total = vec3(0.0);
    float weight = 0.0;

    for (int i = 0; i < ${TAPS}; i++) {
      float t = (float(i) + 0.5) / float(${TAPS});
      // Golden-angle spiral with a square-root radius: uniform density over the
      // disc, and no ring artefacts the way concentric sampling gives.
      float angle = float(i) * 2.39996;
      vec2 offset = vec2(cos(angle), sin(angle)) * sqrt(t) * radius / uResolution;
      vec2 uv = clamp(vUv + offset, vec2(0.0), vec2(1.0));

      /*
       * Weighted by the *tap's* own circle of confusion, not the centre's. A
       * sharp object in front of a blurred one has no business spreading into
       * it — weighting by the centre is what produces the halo of background
       * smeared over foreground edges that gives cheap depth of field away.
       */
      float w = max(coc(uv), 0.015);
      total += texture2D(tColour, uv).rgb * w;
      weight += w;
    }

    gl_FragColor = vec4(total / max(weight, 0.0001), 1.0);
  }
`;

/**
 * Tone mapping lives here because three skips it entirely when drawing into a
 * render target — the scene arrives linear and un-mapped. This is ACES fitted,
 * matching `ACESFilmicToneMapping` and the same 1.08 exposure the direct path
 * uses, so a pixel that never touches the blur comes back unchanged.
 */
const COMPOSITE_FRAGMENT = /* glsl */ `
  ${COC}

  uniform sampler2D tBlur;
  uniform float uExposure;
  uniform float uVignette;
  uniform float uAspect;

  vec3 aces(vec3 x) {
    const float a = 2.51;
    const float b = 0.03;
    const float c = 2.43;
    const float d = 0.59;
    const float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }

  void main() {
    vec3 sharp = texture2D(tColour, vUv).rgb;
    vec3 soft = texture2D(tBlur, vUv).rgb;
    float amount = smoothstep(0.02, 0.55, coc(vUv));

    vec3 colour = mix(sharp, soft, amount);

    // The room's walls, applied in linear before the curve — the same order the
    // light itself would arrive in.
    vec2 centred = (vUv - 0.5) * vec2(uAspect, 1.0);
    float fall = smoothstep(0.16, 0.86, length(centred));
    fall = min(1.0, fall + smoothstep(0.62, 1.0, vUv.y) * 0.22);
    colour *= 1.0 - fall * uVignette;

    gl_FragColor = vec4(aces(colour * uExposure), 1.0);
    #include <colorspace_fragment>
  }
`;
