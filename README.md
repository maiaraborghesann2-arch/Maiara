# Lyken Agency

Premium strategic design studio website — a 2.5D scroll-driven experience.

## Stack

- Vite + React 18 + TypeScript
- Three.js via @react-three/fiber (particle field / WebGL background layer only)
- GSAP + ScrollTrigger (scroll & hover animation)
- Lenis (smooth inertial scrolling)
- Framer Motion (UI micro-interactions)
- React Router

## Commands

```bash
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build
```

## Design system

All tokens live in `src/styles/tokens.css`. **Emerald Noir `#10281F` is the
only green permitted anywhere on the site** — do not introduce any other
green shade. No raw hex values outside `tokens.css`.

## Phase status

- [x] **Phase 1 — Foundation**: design tokens, `<Logo />` (LK monogram),
      `<ParticleField />` (persistent constellation background),
      `<CustomCursor />` (magnetic cursor + `[data-magnetic]` pull),
      `<LiquidText />` (proximity ripple headlines), `<LoadingScreen />`
      (monogram draw + synced progress, once per session, reduced-motion
      aware), Lenis + Router shell.
- [x] **Phase 2 — Navigation & Home hero**: `<NavBar />` (blur-on-scroll,
      magnetic liquid links with gradient underline draw, active-route dot,
      mobile full-screen overlay menu), `<HeroSection />` (180vh pinned
      GSAP ScrollTrigger sequence: headline parallax + rule-line draw +
      particle energise → lazy-loaded low-poly Lykos figure with
      spring-damped mouse tilt → pillar cards + final CTA), `<Footer />`,
      particle caps (80 desktop / 35 mobile), reduced-motion unpinned
      fallback, placeholder routes for Phase 3 pages.
- [x] **Phase 3 — Inner pages**: About (intro + alternating philosophy
      pillars with watermark numerals + scroll-snap milestone cards + CTA),
      Projects (filterable asymmetric grid with Framer Motion layout reflow,
      `/projects/:slug` detail), Insights (editorial row list,
      `/insights/:slug` reading layout with pull-quotes), Contact
      (floating-label underline form logging to console + decorative Lykos
      figure). Shared: `<PageShell />` route transitions (AnimatePresence
      fade+scale), `<Reveal />` scroll entrances, route-aware particle
      density, `--space-section` rhythm token. Body copy is Lorem Ipsum —
      labels/headings/microcopy are final English.
- [x] **Phase 2.5 — hero refinement**: Lykos gem removed; `<ParticleSphere />`
      centerpiece (3200 glowing instanced particles + bloom) with three
      states — resting sphere right of the headline, hover morph into the
      LK monogram, scroll-scrubbed fullscreen expansion handing off to the
      particle field. Monogram rebuilt in `src/assets/logoPath.ts` (shared
      by Logo, loader draw, and sphere sampling). Global brightness pass:
      larger/brighter field particles with glow sprites + bloom, brighter
      links, raised text opacities (background color unchanged).
- [x] **Phase 4 — production polish**: official LK mark (vector geometry
      extracted from the brand PDF into `src/assets/logoPath.ts`; filled
      glyph shared by Logo, loader outline-draw + fill-in, and sphere
      fill-area sampling), per-route SEO via react-helmet-async (+ OG/
      Twitter tags, sitemap.xml, robots.txt), favicon/PWA icon set + OG
      image generated from the real mark, lazy-loaded routes with branded
      fallback, canvases pause when tab hidden / out of view, manual chunk
      splitting (three/gsap/motion/react), <480px static-orb sphere,
      aria-live form feedback.
- [ ] **Phase 5 — real content, imagery, form backend, deploy**
