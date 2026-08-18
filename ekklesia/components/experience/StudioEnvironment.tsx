"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

import { palette } from "@/lib/palette";

/**
 * A soft-box environment, generated rather than downloaded.
 *
 * A physically-based material with no environment map has nothing to reflect,
 * so it falls back on flat diffuse shading — which is precisely why untextured
 * three.js objects look like plastic. This paints a small equirectangular
 * gradient (bright overhead softbox, sand-coloured floor bounce, one warm key
 * blob) and runs it through PMREM so the seed gets the graded roll-off around
 * its shoulders that sells it as a physical object.
 *
 * No network request, no HDR asset, ~2 KB of canvas.
 */
export function StudioEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext("2d")!;

    const wash = ctx.createLinearGradient(0, 0, 0, 256);
    wash.addColorStop(0, "#FFFFFF");
    wash.addColorStop(0.34, "#F6EADC");
    wash.addColorStop(0.55, palette.sand);
    wash.addColorStop(1, "#8C7660");
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, 512, 256);

    // Key light, upper right — matches the directional light in `Lighting`.
    const key = ctx.createRadialGradient(350, 54, 0, 350, 54, 150);
    key.addColorStop(0, "rgba(255, 250, 240, 1)");
    key.addColorStop(1, "rgba(255, 250, 240, 0)");
    ctx.fillStyle = key;
    ctx.fillRect(0, 0, 512, 256);

    // Cool bounce opposite it, so the shadow side is not dead.
    const fill = ctx.createRadialGradient(110, 130, 0, 110, 130, 140);
    fill.addColorStop(0, "rgba(214, 206, 196, 0.75)");
    fill.addColorStop(1, "rgba(214, 206, 196, 0)");
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, 512, 256);

    const source = new THREE.CanvasTexture(canvas);
    source.mapping = THREE.EquirectangularReflectionMapping;
    source.colorSpace = THREE.SRGBColorSpace;

    const pmrem = new THREE.PMREMGenerator(gl);
    const environment = pmrem.fromEquirectangular(source).texture;
    scene.environment = environment;

    source.dispose();
    pmrem.dispose();

    return () => {
      scene.environment = null;
      environment.dispose();
    };
  }, [gl, scene]);

  return null;
}
