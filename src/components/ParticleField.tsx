import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';

/**
 * Ambient constellation of gold dots linked by faint lines.
 * Mounted ONCE at the app root (behind everything, z: var(--z-background))
 * so it runs seamlessly from the loading screen into every page.
 */

const MAX_PARTICLES = 80; // hard cap for mid-range hardware (desktop)
const MOBILE_MAX_PARTICLES = 35; // hard cap under 768px viewports
const LINK_DIST = 130; // px — link particles closer than this
const MOUSE_RADIUS = 150; // px — particles inside are pushed away
const MOUSE_PUSH = 46; // px — max displacement of pushed particles
const MAX_LINKS = 2200;
const LINE_MAX_ALPHA = 0.2; // brightness pass: 0.12–0.22 — clearer constellation, still ambient

/**
 * Scroll-scrubbed tuning channel. The hero timeline tweens `energy` 0→1
 * while pinned, which subtly raises link reach and brightness without
 * re-allocating particles.
 */
export const particleTuning = { energy: 0 };

function tokenColor(name: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(raw || '#ffffff');
}

/** soft radial-gradient sprite so each dot has a luminous falloff */
function makeGlowTexture(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

interface ParticlesProps {
  density: number;
}

function Particles({ density }: ParticlesProps) {
  const { size } = useThree();
  const reduced = useMemo(() => prefersReducedMotion(), []);

  const count = useMemo(() => {
    const cap = size.width < 768 ? MOBILE_MAX_PARTICLES : MAX_PARTICLES;
    const byArea = Math.floor((size.width * size.height) / 26000);
    return Math.max(24, Math.min(cap, Math.round(byArea * density)));
  }, [size.width, size.height, density]);

  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
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
  const linePositions = useMemo(() => new Float32Array(MAX_LINKS * 2 * 3), []);
  const lineColors = useMemo(() => new Float32Array(MAX_LINKS * 2 * 3), []);

  const colors = useMemo(
    () => ({
      dot: tokenColor('--color-champagne-gold'),
      line: tokenColor('--color-brushed-gold'),
    }),
    [],
  );
  const glowMap = useMemo(() => makeGlowTexture(), []);

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

    // connect neighbours; brightness encodes proximity (additive blend fades to invisible)
    const energy = particleTuning.energy;
    const linkDist = LINK_DIST * (1 + 0.2 * energy);
    const lineAlpha = LINE_MAX_ALPHA * (1 + 0.35 * energy);
    let seg = 0;
    for (let i = 0; i < count && seg < MAX_LINKS; i++) {
      const ax = pointPositions[i * 3];
      const ay = pointPositions[i * 3 + 1];
      for (let j = i + 1; j < count && seg < MAX_LINKS; j++) {
        const bx = pointPositions[j * 3];
        const by = pointPositions[j * 3 + 1];
        const dx = ax - bx;
        const dy = ay - by;
        if (Math.abs(dx) > linkDist || Math.abs(dy) > linkDist) continue;
        const d = Math.hypot(dx, dy);
        if (d > linkDist) continue;
        const alpha = (1 - d / linkDist) * lineAlpha;
        const v = seg * 6;
        linePositions[v] = ax;
        linePositions[v + 1] = ay;
        linePositions[v + 2] = 0;
        linePositions[v + 3] = bx;
        linePositions[v + 4] = by;
        linePositions[v + 5] = 0;
        lineColors[v] = colors.line.r * alpha;
        lineColors[v + 1] = colors.line.g * alpha;
        lineColors[v + 2] = colors.line.b * alpha;
        lineColors[v + 3] = lineColors[v];
        lineColors[v + 4] = lineColors[v + 1];
        lineColors[v + 5] = lineColors[v + 2];
        seg++;
      }
    }

    const points = pointsRef.current;
    const lines = linesRef.current;
    if (points) {
      const attr = points.geometry.getAttribute('position') as THREE.BufferAttribute;
      attr.needsUpdate = true;
      points.geometry.setDrawRange(0, count);
    }
    if (lines) {
      const pos = lines.geometry.getAttribute('position') as THREE.BufferAttribute;
      const col = lines.geometry.getAttribute('color') as THREE.BufferAttribute;
      pos.needsUpdate = true;
      col.needsUpdate = true;
      lines.geometry.setDrawRange(0, seg * 2);
    }
  });

  return (
    <>
      <points ref={pointsRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[pointPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={colors.dot}
          map={glowMap}
          size={3.4}
          sizeAttenuation={false}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <lineSegments ref={linesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
          <bufferAttribute attach="attributes-color" args={[lineColors, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          vertexColors
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </>
  );
}

interface ParticleFieldProps {
  /** 1 = default density; the loading screen uses the same instance, so this rarely changes */
  density?: number;
}

export function ParticleField({ density = 1 }: ParticleFieldProps) {
  return (
    <div className="particle-field" aria-hidden="true">
      <Canvas
        orthographic
        camera={{ position: [0, 0, 10], zoom: 1 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      >
        <Particles density={density} />
        <EffectComposer>
          <Bloom
            intensity={0.55}
            luminanceThreshold={0.1}
            luminanceSmoothing={0.3}
            mipmapBlur
            radius={0.6}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
