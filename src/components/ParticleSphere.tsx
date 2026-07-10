import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import gsap from 'gsap';
import { sampleLogoPoints } from '../assets/logoPath';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useCanvasActive } from '../hooks/useCanvasActive';

/**
 * Glowing gold particle sphere — the Home hero centerpiece.
 *
 * States (all lerped between precomputed position arrays in the shader):
 *   A "sphere"  — even surface distribution, slow self-rotation, per-particle shimmer
 *   B "logo"    — on hover, particles morph into the LK monogram (shared
 *                 source of truth: src/assets/logoPath.ts), camera-facing
 *   C "expand"  — scroll-scrubbed (`expand.value` 0→1 from the hero timeline):
 *                 grows to fill the viewport while particles scatter into a
 *                 volumetric cloud, handing off to the global ParticleField
 *
 * Hover (B) is disabled on touch devices and under reduced motion; under
 * reduced motion the sphere renders static (no rotation, no shimmer).
 */

const FOV = 40;
const CAMERA_Z = 8;

const ROT_SPEED = 0.03; // rad/s
const EXPAND_SCALE = 2.2; // additional scale at full expansion

function tokenColor(name: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(raw || '#ffffff');
}

const VERTEX = /* glsl */ `
  attribute vec3 aSphere;
  attribute vec3 aLogo;
  attribute vec3 aScatter;
  attribute float aPhase;
  attribute float aSize;
  uniform float uRot;
  uniform float uMorph;
  uniform float uExpand;
  uniform float uTime;
  uniform float uStatic;
  uniform float uScaleFactor;
  varying float vShimmer;

  vec3 rotY(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  }

  void main() {
    vec3 sph = rotY(aSphere, uRot);
    vec3 sct = rotY(aScatter, uRot * 0.4);
    vec3 pos = mix(sph, aLogo, uMorph); // logo faces the camera, unrotated
    pos = mix(pos, sct, uExpand);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float shimmer = 0.75 + 0.25 * sin(uTime * (0.7 + aPhase) + aPhase * 6.2831);
    vShimmer = mix(shimmer, 0.9, uStatic);
    gl_PointSize = aSize * (0.8 + 0.4 * vShimmer) * uScaleFactor / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uOuter;
  uniform float uOpacity;
  varying float vShimmer;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.22, 0.0, d);
    float halo = smoothstep(0.5, 0.08, d);
    float a = (core + halo * 0.45) * vShimmer * uOpacity;
    if (a < 0.01) discard;
    vec3 col = uCore * core + uOuter * halo * 0.6;
    gl_FragColor = vec4(col * a, a);
  }
`;

interface SphereProps {
  count: number;
  radius: number;
  interactive: boolean;
  offsetX: number; // horizontal placement as fraction of viewport width (0 = center)
  expand: { value: number } | null; // scrubbed 0→1 by the hero ScrollTrigger timeline
  /** render as a simple static glowing orb (no rotation/shimmer) */
  forceStatic?: boolean;
}

function SphereParticles({
  count,
  radius,
  interactive,
  offsetX,
  expand,
  forceStatic = false,
}: SphereProps) {
  const { size, camera, viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const reduced = useMemo(() => prefersReducedMotion() || forceStatic, [forceStatic]);
  const narrow = size.width < 768;
  const morph = useMemo(() => ({ value: 0 }), []);
  const hovered = useRef(false);
  const rot = useRef(0);
  const time = useRef(0);

  const attrs = useMemo(() => {
    const sphere = new Float32Array(count * 3);
    const logo = new Float32Array(count * 3);
    const scatter = new Float32Array(count * 3);
    const phase = new Float32Array(count);
    const sizes = new Float32Array(count);

    // even sphere-surface distribution (Fibonacci lattice)
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const theta = golden * i;
      sphere[i * 3] = Math.cos(theta) * r * radius;
      sphere[i * 3 + 1] = y * radius;
      sphere[i * 3 + 2] = Math.sin(theta) * r * radius;

      // expanded volumetric cloud
      const dir = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
      ).normalize();
      const dist = radius * (1.2 + Math.random() * 4.2);
      scatter[i * 3] = dir.x * dist;
      scatter[i * 3 + 1] = dir.y * dist * 0.8;
      scatter[i * 3 + 2] = dir.z * dist * 0.6;

      phase[i] = Math.random();
      sizes[i] = 0.028 + Math.random() * 0.026;
    }

    // LK monogram points (shared path source), sized to the sphere's footprint
    const pts = sampleLogoPoints(count);
    const logoScale = radius * 2.5;
    for (let i = 0; i < count; i++) {
      logo[i * 3] = pts[i * 2] * logoScale;
      logo[i * 3 + 1] = pts[i * 2 + 1] * logoScale;
      logo[i * 3 + 2] = (Math.random() - 0.5) * 0.12;
    }

    return { sphere, logo, scatter, phase, sizes };
  }, [count, radius]);

  const uniforms = useMemo(
    () => ({
      uRot: { value: 0 },
      uMorph: { value: 0 },
      uExpand: { value: 0 },
      uTime: { value: 0 },
      uStatic: { value: reduced ? 1 : 0 },
      uScaleFactor: { value: 1 },
      uOpacity: { value: 1 },
      uCore: { value: tokenColor('--color-champagne-gold') },
      uOuter: { value: tokenColor('--color-brushed-gold') },
    }),
    [reduced],
  );

  // hover detection over the sphere's projected bounding circle
  useEffect(() => {
    if (!interactive || reduced || !window.matchMedia('(pointer: fine)').matches) return;

    const onMove = (e: PointerEvent) => {
      const group = groupRef.current;
      if (!group) return;
      const exp = expand?.value ?? 0;
      if (exp > 0.1) {
        if (hovered.current) {
          hovered.current = false;
          gsap.to(morph, { value: 0, duration: 0.4, ease: 'power2.out', overwrite: true });
        }
        return;
      }
      const center = new THREE.Vector3(group.position.x, group.position.y, 0).project(camera);
      const edge = new THREE.Vector3(group.position.x + radius * group.scale.x, 0, 0).project(
        camera,
      );
      const rect = { w: size.width, h: size.height };
      const cx = (center.x * 0.5 + 0.5) * rect.w;
      const cy = (-center.y * 0.5 + 0.5) * rect.h;
      const rPx = Math.abs((edge.x - center.x) * 0.5 * rect.w);
      const within = Math.hypot(e.clientX - cx, e.clientY - cy) < rPx * 1.25;

      if (within && !hovered.current) {
        hovered.current = true;
        gsap.to(morph, { value: 1, duration: 0.8, ease: 'power2.inOut', overwrite: true });
      } else if (!within && hovered.current) {
        hovered.current = false;
        gsap.to(morph, { value: 0, duration: 0.8, ease: 'power2.inOut', overwrite: true });
      }
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      gsap.killTweensOf(morph);
    };
  }, [interactive, reduced, camera, size.width, size.height, radius, morph, expand]);

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    const mat = matRef.current;
    if (!group || !mat) return;
    const dt = Math.min(rawDelta, 1 / 30);

    if (!reduced) {
      rot.current += ROT_SPEED * dt;
      time.current += dt;
    }

    const exp = expand?.value ?? 0;
    const viewWidth = 2 * CAMERA_Z * Math.tan((FOV * Math.PI) / 360) * viewport.aspect;
    const baseScale = narrow ? 0.72 : 1;

    group.position.x = (narrow ? 0 : offsetX) * viewWidth * (1 - exp);
    group.scale.setScalar(baseScale * (1 + exp * EXPAND_SCALE));

    mat.uniforms.uRot.value = rot.current;
    mat.uniforms.uTime.value = time.current;
    mat.uniforms.uExpand.value = exp;
    // scroll expansion takes over: hover morph fades out as expansion begins
    mat.uniforms.uMorph.value = morph.value * (1 - Math.min(exp * 2.5, 1));
    mat.uniforms.uScaleFactor.value =
      (size.height * viewport.dpr) / (2 * Math.tan((FOV * Math.PI) / 360));
  });

  return (
    <group ref={groupRef}>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[attrs.sphere, 3]} />
          <bufferAttribute attach="attributes-aSphere" args={[attrs.sphere, 3]} />
          <bufferAttribute attach="attributes-aLogo" args={[attrs.logo, 3]} />
          <bufferAttribute attach="attributes-aScatter" args={[attrs.scatter, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[attrs.phase, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[attrs.sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={matRef}
          vertexShader={VERTEX}
          fragmentShader={FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

export interface ParticleSphereProps {
  count?: number;
  radius?: number;
  interactive?: boolean;
  offsetX?: number;
  expand?: { value: number } | null;
  /** bloom strength — soft luminous glow (spec: moderate) */
  bloom?: number;
}

/** Lazy-loaded (React.lazy) — only fetched where used (Home hero, Contact). */
export default function ParticleSphere({
  count,
  radius = 1.3,
  interactive = true,
  offsetX = 0,
  expand = null,
  bloom = 1.1,
}: ParticleSphereProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameloop = useCanvasActive(wrapRef);
  // small screens (<480px): simpler static glowing orb — no morph states,
  // fewer particles (State C scroll expansion still applies via uniforms)
  const tiny = typeof window !== 'undefined' && window.innerWidth < 480;
  const resolvedCount =
    count ?? (tiny ? 900 : typeof window !== 'undefined' && window.innerWidth < 768 ? 1800 : 3200);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <Canvas
        frameloop={frameloop}
        camera={{ position: [0, 0, CAMERA_Z], fov: FOV }}
        dpr={[1, 1.75]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <SphereParticles
          count={resolvedCount}
          radius={radius}
          interactive={interactive && !tiny}
          offsetX={offsetX}
          expand={expand}
          forceStatic={tiny}
        />
        <EffectComposer>
          <Bloom
            intensity={bloom}
            luminanceThreshold={0.12}
            luminanceSmoothing={0.25}
            mipmapBlur
            radius={0.72}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
