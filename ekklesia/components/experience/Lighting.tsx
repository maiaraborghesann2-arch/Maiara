"use client";

/**
 * Soft product-shot lighting to match frames 01–04: a warm key from the upper
 * right, a cool bounce filling the shadow side, and a rim to lift the seed off
 * the cream. No shadow maps — the contact shadow is faked by `GroundShadow`,
 * which is both cheaper and closer to the storyboard's diffuse look.
 */
export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.85} color="#FFF6EA" />
      <directionalLight position={[2.6, 3.4, 2.8]} intensity={2.1} color="#FFF3E0" />
      <directionalLight position={[-2.6, 0.6, 1.6]} intensity={0.55} color="#D2C3A9" />
      <directionalLight position={[-1.2, 1.8, -2.6]} intensity={0.9} color="#FFE9CC" />
    </>
  );
}
