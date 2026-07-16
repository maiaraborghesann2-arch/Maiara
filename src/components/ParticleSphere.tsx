import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import gsap from 'gsap';
import { sampleLogoPoints } from '../assets/logoPath';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useCanvasActive } from '../hooks/useCanvasActive';

/**
 * Glowing gold particle sphere — the Home hero centerpiece.
 *
 * States (all lerped between precomputed position arrays in the shader):
 *   A "sphere"  — even surface distribution, slow self-rotation, continuous
 *                 organic drift ("alive")
 *   B "logo"    — on hover, the ENTIRE point-cloud morphs into the LK
 *                 monogram (full morph: the sphere's shape becomes legible
 *                 as the mark, at the sphere's own scale and in the same
 *                 champagne/brushed golds), camera-facing
 *   C "expand"  — scroll-scrubbed (`expand.value` 0→1 from the hero
 *                 timeline): scatters into a volumetric cloud, handing off
 *                 to the global ParticleField
 *
 * Hover (B) is disabled on touch devices and under reduced motion; under
 * reduced motion the sphere renders static (no rotation, shimmer or drift).
 */

const FOV = 40;
const CAMERA_Z = 8;

const ROT_SPEED = 0.03; // rad/s
const EXPAND_SCALE = 2.2; // additional scale at full expansion
const MORPH_S = 0.8; // sphere↔logo morph duration (house easing family)
const MORPH_EASE = 'power2.inOut';

function tokenColor(name: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(raw || '#ffffff');
}

/* Cheap per-particle organic drift (phase-desynced sin field — noise-like,
   loopable, no texture fetch) */
const DRIFT = /* glsl */ `
  vec3 drift(vec3 p, float phase, float t, float amp) {
    return vec3(
      sin(t * 0.42 + phase * 21.7 + p.y * 2.3),
      sin(t * 0.35 + phase * 34.1 + p.x * 1.9),
      sin(t * 0.39 + phase * 27.3 + p.z * 2.1)
    ) * amp;
  }
`;

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
  ${DRIFT}

  vec3 rotY(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  }

  void main() {
    vec3 sph = rotY(aSphere, uRot);
    // organic breathing eases down while the mark is formed (keeps the glyph legible)
    float amp = mix(0.045, 0.012, uMorph) * (1.0 - uStatic);
    vec3 pos = mix(sph, aLogo, uMorph); // logo faces the camera, unrotated
    pos += drift(pos, aPhase, uTime, amp);
    vec3 sct = rotY(aScatter, uRot * 0.4);
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
    float core = smoothstep(0.2, 0.0, d);
    float halo = smoothstep(0.48, 0.05, d);
    float a = (core + halo * 0.5) * vShimmer * uOpacity;
    if (a < 0.012) discard;
    vec3 col = uCore * (core + halo * 0.25) + uOuter * halo * 0.6;
    gl_FragColor = vec4(col * a, a);
  }
`;

interface SphereProps {
  count: number;
  radius: number;
  interactive: boolean;
  offsetX: number; // horizontal placement as fraction of the visible width (0 = center)
  offsetY: number; // vertical placement as fraction of the visible height (0 = center)
  expand: { value: number } | null; // scrubbed 0→1 by the hero ScrollTrigger timeline
  mobileLayout: 'hero' | 'center';
  forceStatic: boolean;
}

function SphereParticles({
  count,
  radius,
  interactive,
  offsetX,
  offsetY,
  expand,
  mobileLayout,
  forceStatic,
}: SphereProps) {
  const { size, viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const reduced = useMemo(() => prefersReducedMotion() || forceStatic, [forceStatic]);

  const rot = useRef(0);
  const time = useRef(0);
  const pointer = useRef({ x: 1e6, y: 1e6, active: false });
  const hovered = useRef(false);
  const morph = useMemo(() => ({ value: 0 }), []);
  // becomes true once a placement has been computed from a real (non-zero)
  // canvas size — the group stays hidden until then so the sphere never
  // paints a frame at the wrong (centered) position
  const placed = useRef(false);

  /** resting placement (State A) — shared by the mount effect and the frame loop */
  const applyPlacement = (group: THREE.Group, exp: number) => {
    const visH = 2 * CAMERA_Z * Math.tan((FOV * Math.PI) / 360);
    const visW = visH * viewport.aspect;
    const isNarrow = size.width < 768;
    const baseScale = isNarrow ? (mobileLayout === 'hero' ? 0.6 : 0.72) : 1;
    const targetX = isNarrow ? 0 : offsetX * visW;
    const targetY = isNarrow ? (mobileLayout === 'hero' ? -0.24 * visH : 0) : offsetY * visH;
    group.position.x = targetX * (1 - exp);
    group.position.y = targetY * (1 - exp);
    group.scale.setScalar(baseScale * (1 + exp * EXPAND_SCALE));
    return visH;
  };

  // set the final resting position synchronously on mount (before first paint)
  useLayoutEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    if (import.meta.env.DEV) {
      // dev-only diagnostics for the "wrong initial position" class of bug —
      // see resize={{ offsetSize: true }} on the <Canvas> for the root cause
      // this surfaced (transformed-ancestor measurements).
      // eslint-disable-next-line no-console
      console.log('[ParticleSphere] measure', {
        sizeW: Math.round(size.width),
        sizeH: Math.round(size.height),
        aspect: +viewport.aspect.toFixed(4),
        offsetX,
        alreadyPlaced: placed.current,
      });
    }
    if (size.width > 0) {
      applyPlacement(group, expand?.value ?? 0);
      placed.current = true;
      group.visible = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size.width, size.height, viewport.aspect]);

  // pointer tracking (fine pointers only — no hover morph on touch)
  useEffect(() => {
    if (!interactive || reduced) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      pointer.current.x = e.clientX;
      pointer.current.y = e.clientY;
      pointer.current.active = true;
    };
    const onLeave = () => {
      pointer.current.active = false;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(morph);
    };
  }, [interactive, reduced, morph]);

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

    // LK monogram targets — full morph: the mark occupies the SAME visual
    // footprint as the sphere (glyph max dimension = sphere diameter).
    // sampleLogoPoints returns bbox-centered coords in [-0.5, 0.5], so the
    // glyph's optical center lands exactly on the sphere's center.
    const pts = sampleLogoPoints(count);
    const logoScale = radius * 2;
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
    const visH = applyPlacement(group, exp);
    if (!placed.current && size.width > 0) {
      placed.current = true;
      group.visible = true;
    }

    // hover: cursor inside the sphere's screen-space circle → full morph
    const p = pointer.current;
    const visW = visH * viewport.aspect;
    const wx = (p.x / size.width - 0.5) * visW;
    const wy = -(p.y / size.height - 0.5) * visH;
    const within =
      p.active &&
      exp < 0.1 &&
      !reduced &&
      Math.hypot(wx - group.position.x, wy - group.position.y) <= radius * group.scale.x * 1.15;
    if (within && !hovered.current) {
      hovered.current = true;
      gsap.to(morph, { value: 1, duration: MORPH_S, ease: MORPH_EASE, overwrite: true });
    } else if (!within && hovered.current) {
      hovered.current = false;
      gsap.to(morph, { value: 0, duration: MORPH_S, ease: MORPH_EASE, overwrite: true });
    }

    mat.uniforms.uRot.value = rot.current;
    mat.uniforms.uTime.value = time.current;
    mat.uniforms.uExpand.value = exp;
    // scroll expansion takes over: the morph releases as expansion begins
    mat.uniforms.uMorph.value = morph.value * (1 - Math.min(exp * 2.5, 1));
    mat.uniforms.uScaleFactor.value =
      (size.height * viewport.dpr) / (2 * Math.tan((FOV * Math.PI) / 360));
  });

  return (
    <group ref={groupRef} visible={false}>
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
  offsetY?: number;
  expand?: { value: number } | null;
  /** 'hero': below-copy placement + 60% scale on mobile; 'center': centered */
  mobileLayout?: 'hero' | 'center';
}

/** Lazy-loaded (React.lazy) — only fetched where used (Home hero, Contact). */
export default function ParticleSphere({
  count,
  radius = 1.6,
  interactive = true,
  offsetX = 0,
  offsetY = 0,
  expand = null,
  mobileLayout = 'center',
}: ParticleSphereProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameloop = useCanvasActive(wrapRef);
  // small screens (<480px): simpler static glowing orb — no morph, no drift
  const tiny = typeof window !== 'undefined' && window.innerWidth < 480;
  const resolvedCount =
    count ?? (tiny ? 900 : typeof window !== 'undefined' && window.innerWidth < 768 ? 1800 : 3200);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: '100%' }} aria-hidden="true">
      <Canvas
        frameloop={frameloop}
        camera={{ position: [0, 0, CAMERA_Z], fov: FOV }}
        dpr={[1, 1.75]}
        // offsetSize: measure LAYOUT dimensions, not getBoundingClientRect —
        // rect sizes are scaled by route-transition transforms on the page
        // root, which fed a wrong aspect into the first placement.
        resize={{ offsetSize: true }}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      >
        <SphereParticles
          count={resolvedCount}
          radius={radius}
          interactive={interactive && !tiny}
          offsetX={offsetX}
          offsetY={offsetY}
          expand={expand}
          mobileLayout={mobileLayout}
          forceStatic={tiny}
        />
        {/* Glow is per-particle in the fragment shader (core + halo);
            no composer bloom (it aggregated into a blob silhouette). */}
      </Canvas>
    </div>
  );
}
