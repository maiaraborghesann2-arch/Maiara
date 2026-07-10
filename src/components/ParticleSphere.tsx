import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sampleLogoPoints } from '../assets/logoPath';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useCanvasActive } from '../hooks/useCanvasActive';

/**
 * Glowing gold particle sphere — the Home hero centerpiece.
 *
 * Two coexisting point layers occupy the same spatial volume:
 *   a) the visible sphere shell — slow rotation + continuous noise-driven
 *      organic drift ("alive"), particles near the cursor are repelled
 *      outward (opening gaps), and the whole layer scatters into a
 *      volumetric cloud during the scroll-scrubbed expansion
 *   b) a hidden LK monogram point set (shared source: src/assets/logoPath.ts,
 *      fitted INSIDE the sphere at ~90% of its diameter) rendered at
 *      near-zero opacity; particles near the cursor brighten, so the mark
 *      is only ever glimpsed through the gaps the cursor opens — a
 *      peek-through reveal, never a full morph
 *
 * No backing shape: each particle carries only its own core+halo glow and
 * the bloom pass is kept tight so no silhouette/blob forms behind the cloud.
 *
 * Touch devices: reveal disabled (sphere + scroll expansion only).
 * Reduced motion / <480px: static glowing orb (no rotation, shimmer, drift).
 */

const FOV = 40;
const CAMERA_Z = 8;

const ROT_SPEED = 0.03; // rad/s
const EXPAND_SCALE = 2.2; // additional scale at full expansion
const REVEAL_RADIUS_PX = 55; // cursor proximity that parts the sphere / lights the mark
const PUSH_UNITS = 0.34; // max outward displacement of repelled sphere particles
const LOGO_BASE_ALPHA = 0.05; // hidden-layer resting opacity
const LOGO_REVEAL_ALPHA = 0.9;

function tokenColor(name: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(raw || '#ffffff');
}

/* Shared GLSL: cheap per-particle organic drift (phase-desynced sin field —
   noise-like, loopable, no texture fetch) */
const DRIFT = /* glsl */ `
  vec3 drift(vec3 p, float phase, float t, float amp) {
    return vec3(
      sin(t * 0.42 + phase * 21.7 + p.y * 2.3),
      sin(t * 0.35 + phase * 34.1 + p.x * 1.9),
      sin(t * 0.39 + phase * 27.3 + p.z * 2.1)
    ) * amp;
  }
`;

const SPHERE_VERTEX = /* glsl */ `
  attribute vec3 aSphere;
  attribute vec3 aScatter;
  attribute float aPhase;
  attribute float aSize;
  uniform float uRot;
  uniform float uExpand;
  uniform float uTime;
  uniform float uStatic;
  uniform float uScaleFactor;
  uniform vec3 uPointer;   // cursor in group-local units
  uniform float uPointerR; // reveal radius in group-local units
  uniform float uPresence; // eased hover presence 0..1
  varying float vShimmer;
  ${DRIFT}

  vec3 rotY(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  }

  void main() {
    vec3 sph = rotY(aSphere, uRot);
    sph += drift(sph, aPhase, uTime, 0.045) * (1.0 - uStatic); // continuous organic breathing
    vec3 sct = rotY(aScatter, uRot * 0.4);
    vec3 pos = mix(sph, sct, uExpand);

    // cursor repulsion — open gaps in the shell near the pointer
    vec3 away = pos - uPointer;
    float d = length(away);
    float f = smoothstep(uPointerR, 0.0, d) * uPresence * (1.0 - uExpand);
    pos += (away / max(d, 0.0001)) * f * ${PUSH_UNITS.toFixed(2)};

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float shimmer = 0.75 + 0.25 * sin(uTime * (0.7 + aPhase) + aPhase * 6.2831);
    vShimmer = mix(shimmer, 0.9, uStatic);
    gl_PointSize = aSize * (0.8 + 0.4 * vShimmer) * uScaleFactor / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const LOGO_VERTEX = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  uniform float uExpand;
  uniform float uTime;
  uniform float uStatic;
  uniform float uScaleFactor;
  uniform vec3 uPointer;
  uniform float uPointerR;
  uniform float uPresence;
  varying float vShimmer;
  ${DRIFT}

  void main() {
    vec3 pos = position + drift(position, aPhase, uTime, 0.012) * (1.0 - uStatic);

    // brighten only where the cursor has parted the sphere above
    float d = distance(pos, uPointer);
    float reveal = smoothstep(uPointerR * 1.15, 0.0, d) * uPresence;
    float alpha = mix(${LOGO_BASE_ALPHA.toFixed(2)}, ${LOGO_REVEAL_ALPHA.toFixed(2)}, reveal);
    vShimmer = alpha * (1.0 - uExpand); // hidden layer dissolves during expansion

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (0.9 + 0.5 * reveal) * uScaleFactor / -mv.z;
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
  offsetX: number; // horizontal placement as fraction of viewport width (0 = center)
  expand: { value: number } | null; // scrubbed 0→1 by the hero ScrollTrigger timeline
  mobileLayout: 'hero' | 'center';
  forceStatic: boolean;
}

function SphereParticles({
  count,
  radius,
  interactive,
  offsetX,
  expand,
  mobileLayout,
  forceStatic,
}: SphereProps) {
  const { size, viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const sphereMatRef = useRef<THREE.ShaderMaterial>(null);
  const logoMatRef = useRef<THREE.ShaderMaterial>(null);
  const reduced = useMemo(() => prefersReducedMotion() || forceStatic, [forceStatic]);
  const narrow = size.width < 768;

  const rot = useRef(0);
  const time = useRef(0);
  const pointer = useRef({ x: 1e6, y: 1e6, active: false });
  const presence = useRef(0);
  const smooth = useRef(new THREE.Vector3(1e6, 1e6, 0));

  const attrs = useMemo(() => {
    const sphere = new Float32Array(count * 3);
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

    // hidden LK monogram layer — fitted INSIDE the sphere (~90% of diameter)
    const logoCount = Math.floor(count * 0.85);
    const pts = sampleLogoPoints(logoCount);
    const logo = new Float32Array(logoCount * 3);
    const logoPhase = new Float32Array(logoCount);
    const logoSizes = new Float32Array(logoCount);
    const logoScale = radius * 2 * 0.9; // bounding box ≤ sphere diameter
    for (let i = 0; i < logoCount; i++) {
      logo[i * 3] = pts[i * 2] * logoScale;
      logo[i * 3 + 1] = pts[i * 2 + 1] * logoScale;
      logo[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
      logoPhase[i] = Math.random();
      logoSizes[i] = 0.026 + Math.random() * 0.022;
    }

    return { sphere, scatter, phase, sizes, logo, logoPhase, logoSizes };
  }, [count, radius]);

  const makeUniforms = () => ({
    uRot: { value: 0 },
    uExpand: { value: 0 },
    uTime: { value: 0 },
    uStatic: { value: reduced ? 1 : 0 },
    uScaleFactor: { value: 1 },
    uOpacity: { value: 1 },
    uPointer: { value: new THREE.Vector3(1e6, 1e6, 0) },
    uPointerR: { value: 0.4 },
    uPresence: { value: 0 },
    uCore: { value: tokenColor('--color-champagne-gold') },
    uOuter: { value: tokenColor('--color-brushed-gold') },
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sphereUniforms = useMemo(makeUniforms, [reduced]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const logoUniforms = useMemo(makeUniforms, [reduced]);

  // pointer tracking for the peek-through reveal (fine pointers only)
  useEffect(() => {
    if (!interactive || reduced || !window.matchMedia('(pointer: fine)').matches) return;
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
    };
  }, [interactive, reduced]);

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    const sphereMat = sphereMatRef.current;
    const logoMat = logoMatRef.current; // null when the hidden layer isn't rendered
    if (!group || !sphereMat) return;
    const dt = Math.min(rawDelta, 1 / 30);

    if (!reduced) {
      rot.current += ROT_SPEED * dt;
      time.current += dt;
    }

    const exp = expand?.value ?? 0;
    const visH = 2 * CAMERA_Z * Math.tan((FOV * Math.PI) / 360);
    const visW = visH * viewport.aspect;
    const unitsPerPx = visH / size.height;

    // placement: right column on desktop; below the copy on mobile hero
    const baseScale = narrow ? (mobileLayout === 'hero' ? 0.6 : 0.72) : 1;
    const targetX = narrow ? 0 : offsetX * visW;
    const targetY = narrow && mobileLayout === 'hero' ? -0.24 * visH : 0;
    group.position.x = targetX * (1 - exp);
    group.position.y = targetY * (1 - exp);
    group.scale.setScalar(baseScale * (1 + exp * EXPAND_SCALE));

    // cursor → group-local units
    const p = pointer.current;
    const targetPresence = p.active && exp < 0.1 && !reduced ? 1 : 0;
    // eased in, springs back out a touch slower
    const rate = targetPresence > presence.current ? 7 : 3.5;
    presence.current += (targetPresence - presence.current) * Math.min(1, rate * dt);

    const wx = (p.x / size.width - 0.5) * visW;
    const wy = -(p.y / size.height - 0.5) * visH;
    const lx = (wx - group.position.x) / group.scale.x;
    const ly = (wy - group.position.y) / group.scale.x;
    // smooth the pointer so displaced particles ease rather than snap
    smooth.current.x += (lx - smooth.current.x) * Math.min(1, 9 * dt);
    smooth.current.y += (ly - smooth.current.y) * Math.min(1, 9 * dt);

    const pointerR = (REVEAL_RADIUS_PX * unitsPerPx) / group.scale.x;

    const mats = logoMat ? [sphereMat, logoMat] : [sphereMat];
    for (const mat of mats) {
      mat.uniforms.uRot.value = rot.current;
      mat.uniforms.uTime.value = time.current;
      mat.uniforms.uExpand.value = exp;
      mat.uniforms.uPointer.value.set(smooth.current.x, smooth.current.y, 0);
      mat.uniforms.uPointerR.value = pointerR;
      mat.uniforms.uPresence.value = presence.current;
      mat.uniforms.uScaleFactor.value =
        (size.height * viewport.dpr) / (2 * Math.tan((FOV * Math.PI) / 360));
    }
  });

  return (
    <group ref={groupRef}>
      {/* layer a — visible sphere shell */}
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[attrs.sphere, 3]} />
          <bufferAttribute attach="attributes-aSphere" args={[attrs.sphere, 3]} />
          <bufferAttribute attach="attributes-aScatter" args={[attrs.scatter, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[attrs.phase, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[attrs.sizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={sphereMatRef}
          vertexShader={SPHERE_VERTEX}
          fragmentShader={FRAGMENT}
          uniforms={sphereUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      {/* layer b — hidden monogram, revealed only through cursor-opened gaps */}
      {interactive && !reduced && (
        <points frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[attrs.logo, 3]} />
            <bufferAttribute attach="attributes-aPhase" args={[attrs.logoPhase, 1]} />
            <bufferAttribute attach="attributes-aSize" args={[attrs.logoSizes, 1]} />
          </bufferGeometry>
          <shaderMaterial
            ref={logoMatRef}
            vertexShader={LOGO_VERTEX}
            fragmentShader={FRAGMENT}
            uniforms={logoUniforms}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </points>
      )}
    </group>
  );
}

export interface ParticleSphereProps {
  count?: number;
  radius?: number;
  interactive?: boolean;
  offsetX?: number;
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
  expand = null,
  mobileLayout = 'center',
}: ParticleSphereProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const frameloop = useCanvasActive(wrapRef);
  // small screens (<480px): simpler static glowing orb — no reveal, no drift
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
          mobileLayout={mobileLayout}
          forceStatic={tiny}
        />
        {/* Glow is per-particle in the fragment shader (core + halo).
            A composer Bloom pass was removed deliberately: it zeroed the
            transparent canvas's alpha AND aggregated into a blob silhouette —
            the exact halo artifact this design forbids. */}
      </Canvas>
    </div>
  );
}
