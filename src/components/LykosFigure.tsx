import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';

const ROTATION_SPEED = 0.05; // rad/s — barely perceptible
const MAX_TILT = THREE.MathUtils.degToRad(8);

function tokenColor(name: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(raw || '#ffffff');
}

/** deterministic pseudo-random per vertex index, so facets are stable across mounts */
function seeded(i: number): number {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function Figure() {
  const meshRef = useRef<THREE.Mesh>(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);
  const tilt = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 });
  const spin = useRef(0);

  const colors = useMemo(
    () => ({
      base: tokenColor('--color-emerald-noir'),
      emissive: tokenColor('--color-brushed-gold'),
      light: tokenColor('--color-champagne-gold'),
    }),
    [],
  );

  // Icosahedron with irregular radial displacement per vertex → low-poly facets
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.15, 1).toNonIndexed();
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    // identical world-positions must displace identically to keep facets sealed,
    // so seed by quantised position rather than vertex index
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const key =
        Math.round(v.x * 1000) * 7 + Math.round(v.y * 1000) * 131 + Math.round(v.z * 1000) * 977;
      const r = 1 + (seeded(key) - 0.5) * 0.22;
      v.multiplyScalar(r);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state, rawDelta) => {
    const mesh = meshRef.current;
    if (!mesh || reduced) return;
    const dt = Math.min(rawDelta, 1 / 30);

    spin.current += ROTATION_SPEED * dt;

    // spring-damped parallax tilt toward the pointer
    const t = tilt.current;
    t.tx = state.pointer.y * MAX_TILT;
    t.ty = state.pointer.x * MAX_TILT;
    const k = 12;
    t.vx += (t.tx - t.x) * k * dt;
    t.vy += (t.ty - t.y) * k * dt;
    const damp = Math.exp(-4 * dt);
    t.vx *= damp;
    t.vy *= damp;
    t.x += t.vx * dt;
    t.y += t.vy * dt;

    mesh.rotation.set(t.x, spin.current + t.y, 0);
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      {/* single soft champagne point light, above-front */}
      <pointLight color={colors.light} position={[1.4, 2.8, 3.2]} intensity={15} decay={2} />
      <mesh ref={meshRef} geometry={geometry}>
        <meshPhysicalMaterial
          color={colors.base}
          emissive={colors.emissive}
          emissiveIntensity={0.08}
          flatShading
          roughness={0.3}
          metalness={0.6}
          clearcoat={1}
          clearcoatRoughness={0.35}
        />
      </mesh>
    </>
  );
}

/** Lazy-loaded (React.lazy) — only fetched once the Home hero mounts. */
export default function LykosFigure() {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 40 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
      aria-hidden="true"
    >
      <Figure />
    </Canvas>
  );
}
