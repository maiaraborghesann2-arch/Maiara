"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { track } from "@/lib/math";
import { palette } from "@/lib/palette";
import { stageProgress } from "@/lib/scroll/stage";
import { LANDING_Y, soil as choreo } from "@/lib/scroll/choreography";
import { createRockGeometries } from "./rockGeometry";
import { createFilaments } from "./soilDetritus";

const GRAIN_COUNT = 5200;
/** Stones per shape family. Six families, so no silhouette repeats nearby. */
const ROCK_SHAPES = 6;
const ROCK_PER_SHAPE = 34;
/**
 * Stones in the corridor the lens travels down. These exist to be *out of
 * focus*: real geometry passing centimetres from the camera, which the
 * depth-of-field pass turns into soft occluding shapes on its own. The previous
 * round faked this with dark sprites; with a real lens in the chain the fake is
 * both unnecessary and doubled.
 */
const NEAR_COUNT = 40;
/** How far down the volume extends. Deeper than the roots ever reach. */
const FLOOR_Y = -8.5;
/** Radius of the body of earth the descent happens inside. */
const SHAFT_R = 9;
/** Its centre — roughly the middle of the stretch the camera travels. */
const SHAFT_CENTRE_Y = -3.2;

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The earth as a volume, not a brown plane.
 *
 * Four layers, and the reason for each is the same: a flat texture cannot
 * produce parallax, and parallax is the only thing that tells the eye it is
 * travelling *through* something rather than past a picture of it.
 *
 *   - a surface disc, so the ground the grain is pressed into has relief
 *   - a shaft of earth around the descent, banded into strata, which is what
 *     stops the underground reading as clods floating in an empty fog
 *   - clods with real silhouettes, filling the sides at every distance
 *   - suspended grains, which stream past as the camera falls
 *
 * All of it is held back until Act II. The surface in Act I is painted by the
 * backdrop shader and is already approved; this fades in over the top of it as
 * the camera closes, so the earth gains texture rather than being replaced.
 */
export function Soil() {
  const surface = useRef<THREE.Mesh>(null);
  const shaft = useRef<THREE.Mesh>(null);
  const grains = useRef<THREE.Points>(null);
  const grainMaterial = useRef<THREE.ShaderMaterial>(null);
  const rocks = useRef<(THREE.InstancedMesh | null)[]>([]);
  const near = useRef<THREE.InstancedMesh>(null);
  const fibre = useRef<THREE.Mesh>(null);
  const height = useThree((state) => state.size.height);

  const fog = useMemo(() => new THREE.FogExp2(palette.soil, 0), []);
  /*
   * Two dressings of the same height field. The ground the grain is pressed
   * into is *sand* — it has to leave Act I's `earth` where Act I left it, or
   * the textured plane fading in reads as a colour cut. The dark, banded
   * version belongs on the inside of the shaft, where soil actually is dark.
   */
  const surfaceMaps = useMemo(
    () => createSoilMaps({
      light: palette.tilth,
      dark: palette.tilthDeep,
      repeat: 62,
      contrast: 0.34,
      ridged: false,
    }),
    [],
  );
  const wallMaps = useMemo(
    () =>
      createSoilMaps({
        light: palette.tilthDeep,
        dark: palette.soilDark,
        repeat: 10,
        repeatY: 5,
        strata: true,
      }),
    [],
  );

  const surfaceGeometry = useMemo(() => createSurfaceGeometry(), []);
  /*
   * A sphere, not a shaft with a lid.
   *
   * The obvious build — cylindrical walls with a ceiling across the top — puts a
   * rim where the two meet, and from a lens sitting just under that rim the rim
   * is a dead straight line across the upper frame. Every version of it read as
   * a horizon at dusk rather than as earth overhead, which is the one thing the
   * underground must never look like. A sphere the camera lives inside has no
   * rim anywhere, so there is no line to misread.
   */
  const shaftGeometry = useMemo(() => new THREE.SphereGeometry(SHAFT_R, 64, 44), []);
  const rockGeometries = useMemo(() => createRockGeometries(ROCK_SHAPES, 0x5710), []);
  const filamentGeometry = useMemo(
    () =>
      createFilaments({
        count: 130,
        seed: 0x0f1b,
        top: LANDING_Y - 0.05,
        bottom: FLOOR_Y + 1.5,
        radius: 5.2,
        // Clear of the root system. Old growth crossing the living roots at the
        // same value reads as debris on the lens, and worse, competes with the
        // one thing the frame is about.
        keepOut: 1.75,
      }),
    [],
  );

  const grainGeometry = useMemo(() => {
    const random = mulberry32(0x5011);
    const positions = new Float32Array(GRAIN_COUNT * 3);
    const sizes = new Float32Array(GRAIN_COUNT);
    const alphas = new Float32Array(GRAIN_COUNT);

    for (let i = 0; i < GRAIN_COUNT; i++) {
      const angle = random() * Math.PI * 2;
      const radius = 0.15 + random() * random() * 5.2;
      positions[i * 3] = Math.cos(angle) * radius;
      // Denser near the surface, thinning with depth, the way disturbed soil is.
      positions[i * 3 + 1] = LANDING_Y - 0.05 - random() ** 0.8 * (LANDING_Y - FLOOR_Y);
      positions[i * 3 + 2] = Math.sin(angle) * radius;

      sizes[i] = 0.5 + random() * random() * 4.6;
      alphas[i] = 0.2 + random() * 0.8;
    }

    const buffer = new THREE.BufferGeometry();
    buffer.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    buffer.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    buffer.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    return buffer;
  }, []);

  const grainUniforms = useMemo(
    () => ({
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color(palette.grainMid) },
      uScale: { value: 5 },
    }),
    [],
  );

  /*
   * The surface is a disc, not a landscape. Left as a hard-edged 20-unit plane
   * it draws its own horizon across the upper frame and the whole shot reads as
   * desert; dissolving its alpha with radius hands the far field back to the
   * backdrop's painted earth, which is what Act I was approved on.
   */
  const dissolveSurface = useMemo(
    () => (shader: THREE.WebGLProgramParametersWithUniforms) => {
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying float vRadius;")
        .replace(
          "#include <begin_vertex>",
          "#include <begin_vertex>\nvRadius = length(position.xy);",
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vRadius;")
        .replace(
          "#include <dithering_fragment>",
          "#include <dithering_fragment>\ngl_FragColor.a *= 1.0 - smoothstep(1.5, 4.4, vRadius);",
        );
    },
    [],
  );

  // Stones are placed once: they are scenery, not animation.
  useEffect(() => {
    const random = mulberry32(0xc10d);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const euler = new THREE.Euler();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const tint = new THREE.Color();
    const pocket = new THREE.Vector3();

    for (const mesh of rocks.current) {
      if (!mesh) continue;
      for (let i = 0; i < ROCK_PER_SHAPE; i++) {
        /*
         * Two exclusions, both learned the hard way. The central column stays
         * clear because that is where the grain and its roots live. And nothing
         * sits in the corridor at positive z, because that is where the camera
         * itself travels — a stone placed there ends up centimetres from the
         * lens and fills a third of the frame.
         */
        /*
         * Pockets, not a sprinkle. Every few stones share a centre and sit
         * within a hand's breadth of each other, the way stones in a soil
         * profile actually occur — an even scatter of similar pebbles is the
         * one arrangement that reads as placed by hand.
         */
        if (i % 4 === 0) {
          const pocketAngle = random() * Math.PI * 2;
          const pocketRadius = 1.3 + random() ** 0.65 * 4.6;
          pocket.set(
            Math.cos(pocketAngle) * pocketRadius,
            LANDING_Y - 0.12 - random() * (LANDING_Y - FLOOR_Y) * 0.95,
            Math.sin(pocketAngle) * pocketRadius,
          );
        }
        const x = pocket.x + (random() - 0.5) * 0.9;
        const z = pocket.z + (random() - 0.5) * 0.9;
        if (z > 0.6 && Math.abs(x) < 1.35) {
          i -= 1;
          continue;
        }
        const radius = Math.hypot(x, z);
        position.set(x, pocket.y + (random() - 0.5) * 0.7, z);
        euler.set(random() * 6.28, random() * 6.28, random() * 6.28);
        quaternion.setFromEuler(euler);

        /*
         * Small, and skewed smaller still. The distribution here used to have a
         * long tail, and a handful of stones came out large enough to hold the
         * frame — which puts them in competition with a grain that is the whole
         * subject of the piece. Anything the eye stops on down here should be
         * the seed.
         */
        const size = 0.011 + random() ** 2.6 * 0.058 + radius * 0.009;
        scale.set(size, size * (0.62 + random() * 0.5), size * (0.75 + random() * 0.45));
        mesh.setMatrixAt(i, matrix.compose(position, quaternion, scale));

        // Mineral rather than uniform earth: some stones are paler and greyer,
        // some are the colour of the soil they are sitting in.
        const grey = random() * random();
        tint.setRGB(
          0.6 + grey * 0.2 + random() * 0.1,
          0.58 + grey * 0.2 + random() * 0.08,
          0.54 + grey * 0.24 + random() * 0.07,
        );
        mesh.setColorAt(i, tint);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }

    const front = near.current;
    if (front) {
      for (let i = 0; i < NEAR_COUNT; i++) {
        /*
         * Off the centre line by construction — these are meant to graze the
         * edges of the frame as the camera falls past them, not to sit in front
         * of the subject. Spread along the whole corridor so something is
         * always close to the lens at every depth.
         */
        const sign = random() < 0.5 ? -1 : 1;
        position.set(
          sign * (0.34 + random() * 1.7),
          LANDING_Y - 0.1 - random() * 2.7,
          0.55 + random() * 4.5,
        );
        euler.set(random() * 6.28, random() * 6.28, random() * 6.28);
        quaternion.setFromEuler(euler);
        const size = 0.014 + random() ** 1.8 * 0.062;
        scale.set(size, size * (0.6 + random() * 0.55), size * (0.72 + random() * 0.5));
        front.setMatrixAt(i, matrix.compose(position, quaternion, scale));
      }
      front.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useEffect(
    () => () => {
      surfaceMaps.dispose();
      wallMaps.dispose();
      surfaceGeometry.dispose();
      shaftGeometry.dispose();
      for (const rock of rockGeometries) rock.dispose();
      filamentGeometry.dispose();
      grainGeometry.dispose();
    },
    [
      surfaceMaps,
      wallMaps,
      surfaceGeometry,
      shaftGeometry,
      rockGeometries,
      filamentGeometry,
      grainGeometry,
    ],
  );

  useFrame((state) => {
    const laid = track(choreo.surface, stageProgress());

    const camY = state.camera.position.y;
    const below = Math.min(1, Math.max(0, (LANDING_Y + 0.15 - camY) / 0.45));

    if (surface.current) {
      const material = surface.current.material as THREE.MeshStandardMaterial;
      // Hidden once we are properly under it. Soil is opaque; catching the lit
      // relief of the surface from a metre below reads as a glitch.
      surface.current.visible = laid > 0.002 && LANDING_Y - camY < 1.3;
      material.opacity = laid;
    }

    /*
     * Everything buried is gated on the camera actually being underground,
     * not on a keyframe. Tie it to the lens crossing the plane and the soil
     * appears exactly when it should however the descent is later retimed —
     * and never shows through the surface from above.
     */
    const under = camY < LANDING_Y - 0.01;
    if (shaft.current) shaft.current.visible = under;
    for (const mesh of rocks.current) if (mesh) mesh.visible = below > 0.01;
    if (near.current) near.current.visible = below > 0.01;
    if (fibre.current) fibre.current.visible = below > 0.01;
    if (grains.current) grains.current.visible = below > 0.01;

    if (grainMaterial.current) {
      grainMaterial.current.uniforms.uOpacity.value = below * 0.45;
      grainMaterial.current.uniforms.uScale.value = height * 0.0055;
    }

    /*
     * Fog, but only underground.
     *
     * This is what turns a set of floating props into a volume: matter fades
     * into the dark with distance, so near clods read as near and far ones
     * disappear entirely. Above the surface the density is zero, so Act I never
     * sees it.
     */
    if (!state.scene.fog) state.scene.fog = fog;
    /*
     * Gentle. Exponential-squared fog compounds fast: at 0.34 the root system
     * is 97 per cent erased by the time the camera pulls back to take it in,
     * which is not depth, it is an empty frame.
     */
    fog.density = below * 0.11;
  });

  return (
    <>
      <mesh
        ref={surface}
        geometry={surfaceGeometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, LANDING_Y, 0]}
        visible={false}
      >
        <meshStandardMaterial
          map={surfaceMaps.map}
          normalMap={surfaceMaps.normalMap}
          // Restrained. At a hand's breadth from the lens a strong normal turns
          // fine tilth into cracked desert hardpan.
          normalScale={new THREE.Vector2(0.32, 0.32)}
          roughness={0.96}
          metalness={0}
          transparent
          opacity={0}
          onBeforeCompile={dissolveSurface}
        />
      </mesh>

      {/*
        The body of earth the descent happens inside. Without it the underground
        is clods hanging in a gradient — and no amount of particles reads as
        being *in* a material when there is nothing enclosing you.
      */}
      <mesh
        ref={shaft}
        geometry={shaftGeometry}
        position={[0, SHAFT_CENTRE_Y, 0]}
        visible={false}
        frustumCulled={false}
      >
        <meshStandardMaterial
          map={wallMaps.map}
          normalMap={wallMaps.normalMap}
          normalScale={new THREE.Vector2(0.9, 0.9)}
          roughness={0.98}
          metalness={0}
          side={THREE.BackSide}
        />
      </mesh>

      {rockGeometries.map((rock, index) => (
        <instancedMesh
          key={index}
          ref={(mesh) => {
            rocks.current[index] = mesh;
          }}
          args={[rock, undefined, ROCK_PER_SHAPE]}
          visible={false}
          frustumCulled={false}
        >
          <meshStandardMaterial
            // The crevice shading is baked per vertex; `color` is the family
            // tint the per-instance colour multiplies into.
            vertexColors
            color={palette.soilLight}
            roughness={0.97}
            metalness={0}
          />
        </instancedMesh>
      ))}

      {/* The near field: real matter for the lens to be soft about. */}
      <instancedMesh
        ref={near}
        args={[rockGeometries[0], undefined, NEAR_COUNT]}
        visible={false}
        frustumCulled={false}
      >
        <meshStandardMaterial
          vertexColors
          // Near enough to the lens to be lit like a subject if you let it.
          // These are silhouettes; anything brighter reads as dirt on the glass.
          color="#20140A"
          roughness={1}
          metalness={0}
          envMapIntensity={0.15}
        />
      </instancedMesh>

      {/* Old growth: dead rootlets and fibre threaded through the profile. */}
      <mesh ref={fibre} geometry={filamentGeometry} visible={false} frustumCulled={false}>
        <meshStandardMaterial color="#2A1F14" roughness={1} metalness={0} />
      </mesh>

      <points ref={grains} geometry={grainGeometry} visible={false} frustumCulled={false}>
        <shaderMaterial
          ref={grainMaterial}
          uniforms={grainUniforms}
          transparent
          depthWrite={false}
          vertexShader={GRAIN_VERTEX}
          fragmentShader={GRAIN_FRAGMENT}
        />
      </points>
    </>
  );
}

/**
 * A disc with enough relief that the contact point is not perfectly flat — and
 * no more. The grain is a fifth of a unit across; relief the eye can read from
 * two metres up is, at that scale, a range of hills.
 */
function createSurfaceGeometry() {
  const geometry = new THREE.PlaneGeometry(20, 20, 160, 160);
  const position = geometry.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    let h = 0.0013 * Math.sin(x * 6.2 + 1.3) * Math.cos(y * 5.4);
    h += 0.0006 * Math.sin(x * 15.8 + 0.4) * Math.cos(y * 16.6 + 2.2);
    h += 0.0003 * Math.sin(x * 38.2) * Math.cos(y * 34.6 + 1.1);
    position.setZ(i, h);
  }

  geometry.computeVertexNormals();
  return geometry;
}

/** Tileable value noise. Wrapping the hash by the octave's own period is what
 *  lets the map repeat without a seam. */
function hash2(ix: number, iy: number, period: number) {
  const x = ((ix % period) + period) % period;
  const y = ((iy % period) + period) % period;
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function vnoise2(x: number, y: number, period: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);

  const a = hash2(ix, iy, period);
  const b = hash2(ix + 1, iy, period);
  const c = hash2(ix, iy + 1, period);
  const d = hash2(ix + 1, iy + 1, period);

  return (a * (1 - ux) + b * ux) * (1 - uy) + (c * (1 - ux) + d * ux) * uy;
}

type SoilMapOptions = {
  light: string;
  dark: string;
  repeat: number;
  repeatY?: number;
  /** Bakes horizontal bands into the colour — the shaft's layers of earth. */
  strata?: boolean;
  /** How far the colour swings between the two tones. Low for the surface: at
   *  macro range, tonal variation is what makes a tiled map's period visible. */
  contrast?: number;
  /** A ridged first octave reads as aggregates. Wanted on the shaft wall, not
   *  on the ground the grain is pressed into. */
  ridged?: boolean;
};

/** Colour and normal, tiled. Generated, never downloaded. */
function createSoilMaps({
  light,
  dark,
  repeat,
  repeatY,
  strata,
  contrast = 1,
  ridged = true,
}: SoilMapOptions) {
  const size = 512;
  const height = new Float32Array(size * size);

  const colour = new ImageData(size, size);
  const normal = new ImageData(size, size);

  const darkColor = new THREE.Color(dark);
  const midColor = new THREE.Color(light);
  const tone = new THREE.Color();

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size;
      const v = y / size;

      /*
       * Fractal noise, not stacked sine waves. The trig version produced a
       * regular scale pattern that read as woven fabric the moment the map was
       * tiled — soil is aggregates of every size with no period at all.
       *
       * Starts high and stays subtle. A low base frequency gives the map one
       * dominant motif, and at forty-odd repeats across the ground that motif
       * becomes a visible lattice — the eye finds the period immediately. Fine
       * octaves with only the first one ridged read as mottling instead.
       */
      let h = 0;
      let amp = 0.5;
      let freq = ridged ? 16 : 32;
      for (let octave = 0; octave < 5; octave++) {
        const n = vnoise2(u * freq, v * freq, freq);
        h += amp * (octave === 0 && ridged ? 1 - Math.abs(n * 2 - 1) : n);
        amp *= 0.55;
        freq *= 2;
      }
      h = h - 0.5;

      const i = y * size + x;
      height[i] = h;

      let t = Math.min(1, Math.max(0, 0.5 + (0.02 - h * 1.5) * contrast));
      if (strata) {
        /*
         * Layers. The shaft is a real object in world space, so bands baked
         * into its map are pinned to the earth rather than to the frame — they
         * slide past as the camera descends, which is the only honest way to
         * say "we are moving down through something".
         */
        const band =
          0.5 + 0.5 * Math.sin(v * Math.PI * 2 * 3 + Math.sin(v * Math.PI * 2 * 7) * 0.6);
        t = Math.min(1, Math.max(0, t + (band - 0.5) * 0.5));
      }

      tone.copy(midColor).lerp(darkColor, t);
      const o = i * 4;
      colour.data[o] = tone.r * 255;
      colour.data[o + 1] = tone.g * 255;
      colour.data[o + 2] = tone.b * 255;
      colour.data[o + 3] = 255;
    }
  }

  const STRENGTH = 22;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const left = height[y * size + ((x - 1 + size) % size)];
      const right = height[y * size + ((x + 1) % size)];
      const up = height[((y - 1 + size) % size) * size + x];
      const down = height[((y + 1) % size) * size + x];

      let nx = -(right - left) * STRENGTH;
      let ny = -(down - up) * STRENGTH;
      const len = Math.hypot(nx, ny, 1);
      nx /= len;
      ny /= len;

      const o = (y * size + x) * 4;
      normal.data[o] = (nx * 0.5 + 0.5) * 255;
      normal.data[o + 1] = (ny * 0.5 + 0.5) * 255;
      normal.data[o + 2] = (1 / len) * 0.5 * 255 + 127.5;
      normal.data[o + 3] = 255;
    }
  }

  const toTexture = (data: ImageData, srgb: boolean) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    canvas.getContext("2d")!.putImageData(data, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeat, repeatY ?? repeat);
    texture.anisotropy = 8;
    return texture;
  };

  const map = toTexture(colour, true);
  const normalMap = toTexture(normal, false);

  return {
    map,
    normalMap,
    dispose: () => {
      map.dispose();
      normalMap.dispose();
    },
  };
}

const GRAIN_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  uniform float uScale;
  varying float vAlpha;

  void main() {
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Clamped: a grain passing within centimetres of the lens would otherwise
    // blow up to fill the frame.
    gl_PointSize = min(26.0, aSize * uScale / max(0.1, -mv.z));
    gl_Position = projectionMatrix * mv;
  }
`;

const GRAIN_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    // Ascending edges: smoothstep with edge0 >= edge1 is undefined in GLSL.
    float a = (1.0 - smoothstep(0.06, 0.5, d)) * vAlpha * uOpacity;
    if (a < 0.004) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`;
