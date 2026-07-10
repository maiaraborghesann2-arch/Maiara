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
 * The sphere is the permanent base shape. A second, invisible layer of
 * particles sampling the LK monogram sits inside it. On hover, particles
 * near the cursor's 3D intersection with the sphere are pushed outward
 * (a localized "hole"), and the monogram particles behind that hole fade
 * in — a partial, localized reveal that follows the cursor, not a global
 * shape swap. An independent coherent-noise idle drift keeps the sphere
 * breathing at rest; the hover displacement is applied on top of it.
 *
 * Hover is disabled on touch devices and under reduced motion; under
 * reduced motion the sphere renders static (no rotation, no idle drift).
 */

const FOV = 40;
const CAMERA_Z = 8;

const ROT_SPEED = 0.03; // rad/s
const EXPAND_SCALE = 2.2; // additional scale at full expansion
const IDLE_AMP = 0.035; // idle drift amplitude, fraction of radius
const HOVER_RADIUS_FACTOR = 0.55; // fraction of radius influenced by hover
const HOVER_PUSH_FACTOR = 0.42; // outward push at hover radius center, fraction of radius
const HOVER_EASE_MS = 500; // enter/leave ease duration

// mobile (<768px) resting placement — sphere sits in the top half of the
// pinned viewport, clear of the text block stacked below it
const MOBILE_OFFSET_Y = 0.25;

function tokenColor(name: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(raw || '#ffffff');
}

/** classic 3D simplex noise (Ashima Arts / Stefan Gustavson, public domain) */
const NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
  vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const ROTY_GLSL = /* glsl */ `
  vec3 rotY(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  }
`;

// ---------------- sphere (base shape) shader ----------------

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
  uniform float uIdleAmp;
  uniform float uHoverActive;
  uniform vec3 uHoverLocal;
  uniform float uHoverRadius;
  uniform float uHoverPush;
  varying float vShimmer;

  ${NOISE_GLSL}
  ${ROTY_GLSL}

  void main() {
    vec3 base = aSphere;
    vec3 normal = normalize(base);

    // idle organic drift — coherent noise evolving continuously over time,
    // no periodic reset
    float n = snoise(base * 1.6 + vec3(0.0, 0.0, uTime * 0.12));
    vec3 idlePos = base + normal * n * uIdleAmp * (1.0 - uStatic);

    // localized hover repulsion, applied on top of the idle base position
    float d = length(base - uHoverLocal);
    float push = uHoverActive * (1.0 - smoothstep(0.0, uHoverRadius, d));
    vec3 sph = idlePos + normal * push * uHoverPush;

    sph = rotY(sph, uRot);
    vec3 sct = rotY(aScatter, uRot * 0.4);
    vec3 pos = mix(sph, sct, uExpand);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float shimmer = 0.75 + 0.25 * sin(uTime * (0.7 + aPhase) + aPhase * 6.2831);
    vShimmer = mix(shimmer, 0.9, uStatic);
    gl_PointSize = aSize * (0.8 + 0.4 * vShimmer) * uScaleFactor / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const SPHERE_FRAGMENT = /* glsl */ `
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

// ---------------- logo (hidden reveal layer) shader ----------------

const LOGO_VERTEX = /* glsl */ `
  attribute vec3 aLogo;
  attribute vec3 aAnchor;
  attribute float aPhase;
  attribute float aSize;
  uniform float uRot;
  uniform float uExpand;
  uniform float uScaleFactor;
  uniform float uHoverActive;
  uniform vec3 uHoverLocal;
  uniform float uHoverRadius;
  varying float vReveal;

  ${ROTY_GLSL}

  void main() {
    vec3 pos = rotY(aLogo, uRot);
    vec3 anchor = rotY(aAnchor, 0.0); // anchor stays in aSphere-local space for the distance test

    float d = length(aAnchor - uHoverLocal);
    float reveal = uHoverActive * (1.0 - smoothstep(0.0, uHoverRadius, d));
    vReveal = reveal * (1.0 - uExpand);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uScaleFactor / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const LOGO_FRAGMENT = /* glsl */ `
  uniform vec3 uCore;
  uniform vec3 uOuter;
  varying float vReveal;

  void main() {
    if (vReveal < 0.01) discard;
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.22, 0.0, d);
    float halo = smoothstep(0.5, 0.08, d);
    float a = (core + halo * 0.45) * vReveal * 0.95;
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
  offsetY: number; // vertical placement as fraction of viewport height (0 = center)
  expand: { value: number } | null; // scrubbed 0→1 by the hero ScrollTrigger timeline
  /** render as a simple static glowing orb (no rotation/shimmer/idle/hover) */
  forceStatic?: boolean;
}

function SphereParticles({
  count,
  radius,
  interactive,
  offsetX,
  offsetY,
  expand,
  forceStatic = false,
}: SphereProps) {
  const { size, camera, viewport } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const sphereMatRef = useRef<THREE.ShaderMaterial>(null);
  const logoMatRef = useRef<THREE.ShaderMaterial>(null);
  const reduced = useMemo(() => prefersReducedMotion() || forceStatic, [forceStatic]);
  const narrow = size.width < 768;
  const rot = useRef(0);
  const time = useRef(0);

  // hover state: target (from raycasting) + eased current values
  const hoverOn = useRef(false);
  const hoverActive = useMemo(() => ({ value: 0 }), []);
  const hoverTargetLocal = useRef(new THREE.Vector3(1e6, 1e6, 1e6));
  const hoverCurrentLocal = useRef(new THREE.Vector3(1e6, 1e6, 1e6));

  const logoCount = useMemo(() => Math.round(count * 0.55), [count]);

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

    // LK monogram points — capped at 75% of the sphere's diameter, centered
    const logoPts = sampleLogoPoints(logoCount);
    const logoScale = radius * 1.5; // normalized coords span [-0.5, 0.5] → 1.5·radius = 0.75·diameter
    const logo = new Float32Array(logoCount * 3);
    const anchor = new Float32Array(logoCount * 3);
    const logoPhase = new Float32Array(logoCount);
    const logoSizes = new Float32Array(logoCount);
    const tmp = new THREE.Vector3();
    for (let i = 0; i < logoCount; i++) {
      const lx = logoPts[i * 2] * logoScale;
      const ly = logoPts[i * 2 + 1] * logoScale;
      const lz = (Math.random() - 0.5) * 0.12;
      logo[i * 3] = lx;
      logo[i * 3 + 1] = ly;
      logo[i * 3 + 2] = lz;

      tmp.set(lx, ly, lz || 0.001).normalize().multiplyScalar(radius);
      anchor[i * 3] = tmp.x;
      anchor[i * 3 + 1] = tmp.y;
      anchor[i * 3 + 2] = tmp.z;

      logoPhase[i] = Math.random();
      logoSizes[i] = 0.026 + Math.random() * 0.022;
    }

    return { sphere, scatter, phase, sizes, logo, anchor, logoPhase, logoSizes };
  }, [count, logoCount, radius]);

  const uniforms = useMemo(
    () => ({
      uRot: { value: 0 },
      uExpand: { value: 0 },
      uTime: { value: 0 },
      uStatic: { value: reduced ? 1 : 0 },
      uScaleFactor: { value: 1 },
      uOpacity: { value: 1 },
      uIdleAmp: { value: IDLE_AMP * radius },
      uHoverActive: { value: 0 },
      uHoverLocal: { value: new THREE.Vector3(1e6, 1e6, 1e6) },
      uHoverRadius: { value: radius * HOVER_RADIUS_FACTOR },
      uHoverPush: { value: radius * HOVER_PUSH_FACTOR },
      uCore: { value: tokenColor('--color-champagne-gold') },
      uOuter: { value: tokenColor('--color-brushed-gold') },
    }),
    [reduced, radius],
  );

  // raycast the cursor against the sphere each move; ease hover strength in/out
  useEffect(() => {
    if (!interactive || reduced) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const ndc = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    const oc = new THREE.Vector3();
    const hit = new THREE.Vector3();
    const local = new THREE.Vector3();

    const setActive = (on: boolean) => {
      if (on === hoverOn.current) return;
      hoverOn.current = on;
      gsap.to(hoverActive, {
        value: on ? 1 : 0,
        duration: HOVER_EASE_MS / 1000,
        ease: on ? 'power2.out' : 'power3.out',
        overwrite: true,
      });
    };

    const onMove = (e: PointerEvent) => {
      const group = groupRef.current;
      if (!group) return;
      const exp = expand?.value ?? 0;
      if (exp > 0.1) {
        setActive(false);
        return;
      }

      ndc.x = (e.clientX / size.width) * 2 - 1;
      ndc.y = -(e.clientY / size.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);

      const R = radius * group.scale.x;
      const O = raycaster.ray.origin;
      const D = raycaster.ray.direction;
      oc.copy(O).sub(group.position);
      const b = oc.dot(D);
      const c = oc.dot(oc) - R * R;
      const disc = b * b - c;

      if (disc >= 0) {
        const t = -b - Math.sqrt(disc);
        if (t > 0) {
          hit.copy(D).multiplyScalar(t).add(O).sub(group.position).divideScalar(group.scale.x);
          // counter-rotate by -rot.current around Y to map into aSphere-local space
          const a = -rot.current;
          const cosA = Math.cos(a);
          const sinA = Math.sin(a);
          local.set(hit.x * cosA + hit.z * sinA, hit.y, -hit.x * sinA + hit.z * cosA);
          hoverTargetLocal.current.copy(local);
          setActive(true);
          return;
        }
      }
      setActive(false);
    };

    const onLeave = () => setActive(false);

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      gsap.killTweensOf(hoverActive);
    };
  }, [interactive, reduced, camera, size.width, size.height, radius, expand, hoverActive]);

  useFrame((_, rawDelta) => {
    const group = groupRef.current;
    const sphereMat = sphereMatRef.current;
    const logoMat = logoMatRef.current;
    if (!group || !sphereMat || !logoMat) return;
    const dt = Math.min(rawDelta, 1 / 30);

    if (!reduced) {
      rot.current += ROT_SPEED * dt;
      time.current += dt;
    }

    // smooth chase toward the raycast hit point (the "hole" following the cursor)
    const chase = 1 - Math.exp(-10 * dt);
    hoverCurrentLocal.current.lerp(hoverTargetLocal.current, chase);

    const exp = expand?.value ?? 0;
    const viewWidth = 2 * CAMERA_Z * Math.tan((FOV * Math.PI) / 360) * viewport.aspect;
    const viewHeight = 2 * CAMERA_Z * Math.tan((FOV * Math.PI) / 360);
    const baseScale = narrow ? 0.72 : 1;

    group.position.x = (narrow ? 0 : offsetX) * viewWidth * (1 - exp);
    group.position.y = (narrow ? MOBILE_OFFSET_Y : offsetY) * viewHeight * (1 - exp);
    group.scale.setScalar(baseScale * (1 + exp * EXPAND_SCALE));

    const scaleFactor = (size.height * viewport.dpr) / (2 * Math.tan((FOV * Math.PI) / 360));

    sphereMat.uniforms.uRot.value = rot.current;
    sphereMat.uniforms.uTime.value = time.current;
    sphereMat.uniforms.uExpand.value = exp;
    sphereMat.uniforms.uScaleFactor.value = scaleFactor;
    sphereMat.uniforms.uHoverActive.value = hoverActive.value;
    sphereMat.uniforms.uHoverLocal.value.copy(hoverCurrentLocal.current);

    logoMat.uniforms.uRot.value = rot.current;
    logoMat.uniforms.uExpand.value = exp;
    logoMat.uniforms.uScaleFactor.value = scaleFactor;
    logoMat.uniforms.uHoverActive.value = hoverActive.value;
    logoMat.uniforms.uHoverLocal.value.copy(hoverCurrentLocal.current);
  });

  return (
    <group ref={groupRef}>
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
          fragmentShader={SPHERE_FRAGMENT}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[attrs.logo, 3]} />
          <bufferAttribute attach="attributes-aLogo" args={[attrs.logo, 3]} />
          <bufferAttribute attach="attributes-aAnchor" args={[attrs.anchor, 3]} />
          <bufferAttribute attach="attributes-aPhase" args={[attrs.logoPhase, 1]} />
          <bufferAttribute attach="attributes-aSize" args={[attrs.logoSizes, 1]} />
        </bufferGeometry>
        <shaderMaterial
          ref={logoMatRef}
          vertexShader={LOGO_VERTEX}
          fragmentShader={LOGO_FRAGMENT}
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
  /** bloom strength — soft luminous glow (spec: moderate) */
  bloom?: number;
}

/** Lazy-loaded (React.lazy) — only fetched where used (Home hero, Contact). */
export default function ParticleSphere({
  count,
  radius = 1.53, // +18% over the previous 1.3 baseline
  interactive = true,
  offsetX = 0,
  offsetY = 0,
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
          offsetY={offsetY}
          expand={expand}
          forceStatic={tiny}
        />
        <EffectComposer>
          <Bloom
            intensity={bloom}
            luminanceThreshold={0.12}
            luminanceSmoothing={0.25}
            mipmapBlur={false}
            radius={0.35}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
