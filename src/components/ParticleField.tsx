import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useCanvasActive } from '../hooks/useCanvasActive';

/**
 * Ambient drift of glowing gold dots — visually "scattered fragments" of the
 * hero ParticleSphere (same core+halo glow treatment, no connecting lines).
 * Mounted ONCE at the app root (behind everything, z: var(--z-background))
 * so it runs seamlessly from the loading screen into every page.
 */

// QA visibility pass 2: the previous bump raised the CAPS (80→120) but the
// area-based count below (/18000) never actually reached them (~94 dots at
// 1440×900), so the change read as no change. Caps doubled AND the area
// divisor halved so the density genuinely lands near the caps now.
const MAX_PARTICLES = 240; // hard cap for mid-range hardware (desktop)
const MOBILE_MAX_PARTICLES = 104; // hard cap under 768px viewports
const MOUSE_RADIUS = 150; // px — particles inside are pushed away
const MOUSE_PUSH = 46; // px — max displacement of pushed particles
const BASE_SIZE = 4.6; // px — nominal dot size; per-particle sizes vary 60%–160% of this
const BASE_OPACITY = 0.95; // was 0.85 — the field must read as present, not faint

/**
 * Scroll-scrubbed tuning channel. The hero timeline tweens `energy` 0→1
 * while pinned, which subtly raises particle brightness.
 */
export const particleTuning = { energy: 0 };

function tokenColor(name: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(raw || '#ffffff');
}

/* Per-particle sizes need a tiny custom shader (PointsMaterial is single-size).
   The fragment reproduces the same soft core+halo glow the sphere uses. */
const FIELD_VERTEX = /* glsl */ `
  attribute float aSize;
  uniform float uDpr;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uDpr;
    gl_Position = projectionMatrix * mv;
  }
`;

const FIELD_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.25, 0.0, d);
    float halo = smoothstep(0.5, 0.05, d);
    float a = (core + halo * 0.5) * uOpacity;
    if (a < 0.012) discard;
    gl_FragColor = vec4(uColor * a, a);
  }
`;

interface ParticlesProps {
  density: number;
}

function Particles({ density }: ParticlesProps) {
  const { size } = useThree();
  const reduced = useMemo(() => prefersReducedMotion(), []);

  const count = useMemo(() => {
    const cap = size.width < 768 ? MOBILE_MAX_PARTICLES : MAX_PARTICLES;
    const byArea = Math.floor((size.width * size.height) / 9000); // halved again — see caps note
    return Math.max(40, Math.min(cap, Math.round(byArea * density)));
  }, [size.width, size.height, density]);

  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef({ x: 1e6, y: 1e6 }); // far away until first move
  const bounds = useRef({ w: size.width, h: size.height });
  bounds.current = { w: size.width, h: size.height };

  // Simulation state (px, origin at viewport center, y up)
  const sim = useMemo(() => {
    const base = new Float32Array(MAX_PARTICLES * 2);
    const vel = new Float32Array(MAX_PARTICLES * 2);
    const off = new Float32Array(MAX_PARTICLES * 2);
    const offVel = new Float32Array(MAX_PARTICLES * 2);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      base[i * 2] = (Math.random() - 0.5) * size.width;
      base[i * 2 + 1] = (Math.random() - 0.5) * size.height;
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6; // px/s — near-static drift
      vel[i * 2] = Math.cos(angle) * speed;
      vel[i * 2 + 1] = Math.sin(angle) * speed;
    }
    return { base, vel, off, offVel };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pointPositions = useMemo(() => new Float32Array(MAX_PARTICLES * 3), []);
  // per-particle size variation: 60%–160% of the base — a natural mix of
  // small "distant" dots and larger "closer" ones
  const pointSizes = useMemo(() => {
    const s = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) s[i] = BASE_SIZE * (0.6 + Math.random());
    return s;
  }, []);
  const uniforms = useMemo(
    () => ({
      uColor: { value: tokenColor('--color-champagne-gold') },
      uOpacity: { value: BASE_OPACITY },
      uDpr: { value: Math.min(window.devicePixelRatio || 1, 2) },
    }),
    [],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.x = e.clientX - bounds.current.w / 2;
      mouse.current.y = bounds.current.h / 2 - e.clientY;
    };
    const onLeave = () => {
      mouse.current.x = 1e6;
      mouse.current.y = 1e6;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const { base, vel, off, offVel } = sim;
    const { w, h } = bounds.current;
    const halfW = w / 2 + 20;
    const halfH = h / 2 + 20;
    const mx = mouse.current.x;
    const my = mouse.current.y;

    for (let i = 0; i < count; i++) {
      const ix = i * 2;
      if (!reduced) {
        base[ix] += vel[ix] * dt;
        base[ix + 1] += vel[ix + 1] * dt;
        // wrap around viewport edges
        if (base[ix] > halfW) base[ix] = -halfW;
        else if (base[ix] < -halfW) base[ix] = halfW;
        if (base[ix + 1] > halfH) base[ix + 1] = -halfH;
        else if (base[ix + 1] < -halfH) base[ix + 1] = halfH;

        // magnetized displacement away from the cursor, spring return
        const px = base[ix] + off[ix];
        const py = base[ix + 1] + off[ix + 1];
        const dx = px - mx;
        const dy = py - my;
        const d = Math.hypot(dx, dy);
        let tx = 0;
        let ty = 0;
        if (d < MOUSE_RADIUS && d > 0.001) {
          const strength = (1 - d / MOUSE_RADIUS) * MOUSE_PUSH;
          tx = (dx / d) * strength;
          ty = (dy / d) * strength;
        }
        const k = 18; // spring stiffness
        offVel[ix] += (tx - off[ix]) * k * dt;
        offVel[ix + 1] += (ty - off[ix + 1]) * k * dt;
        const damp = Math.exp(-5 * dt);
        offVel[ix] *= damp;
        offVel[ix + 1] *= damp;
        off[ix] += offVel[ix] * dt;
        off[ix + 1] += offVel[ix + 1] * dt;
      }

      pointPositions[i * 3] = base[ix] + off[ix];
      pointPositions[i * 3 + 1] = base[ix + 1] + off[ix + 1];
      pointPositions[i * 3 + 2] = 0;
    }

    const points = pointsRef.current;
    if (points) {
      const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
      attr.needsUpdate = true;
      points.geometry.setDrawRange(0, count);
    }
    // hero scroll energy gently brightens the field
    const mat = materialRef.current;
    if (mat) mat.uniforms.uOpacity.value = BASE_OPACITY * (1 + 0.1 * particleTuning.energy);
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pointPositions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[pointSizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={FIELD_VERTEX}
        fragmentShader={FIELD_FRAGMENT}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

interface ParticleFieldProps {
  /** 1 = default density; the Home hero raises it slightly */
  density?: number;
}

export function ParticleField({ density = 1 }: ParticleFieldProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  // pause the render loop when the tab is hidden (the field is fixed, so
  // viewport intersection only matters for the tab-visibility half)
  const frameloop = useCanvasActive(wrapRef);
  return (
    <div ref={wrapRef} className="particle-field" aria-hidden="true">
      <Canvas
        frameloop={frameloop}
        orthographic
        camera={{ position: [0, 0, 10], zoom: 1 }}
        dpr={[1, 2]}
        resize={{ offsetSize: true }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      >
        {/* glow lives in the sprite texture (core + halo), matching the
            ParticleSphere's per-particle treatment — no composer pass */}
        <Particles density={density} />
      </Canvas>
    </div>
  );
}
