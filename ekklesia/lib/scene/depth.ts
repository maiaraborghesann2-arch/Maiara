import { LANDING_Y } from "@/lib/scroll/choreography";

/**
 * How much of the frame the post chain owns, `0..1`.
 *
 * Two things ask for it and they must agree exactly, or the vignette is applied
 * twice: `Focus` composites the frame (and applies the vignette in linear,
 * before the tone curve) and `Grade` applies it as a scene pass for everything
 * the composite does not own.
 *
 * Underground it follows the lens crossing the surface. Above ground it is
 * driven by the clock instead, and only in Act III — the closing shot is a
 * macro of a sprout and wants a plane of focus, while Act I's opening is a wide
 * on flat sand that was approved rendering through the default loop, and any
 * pixel of it that went through the composite would come back a different
 * colour.
 */
export function postAmount(cameraY: number, stageProgress: number) {
  const below = Math.min(1, Math.max(0, (LANDING_Y + 0.2 - cameraY) / 0.5));
  const surfaced = Math.min(1, Math.max(0, (stageProgress - 2.66) / 0.18));
  return Math.max(below, surfaced);
}
