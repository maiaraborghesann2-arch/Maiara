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

All tokens live in `src/styles/tokens.css`. **Emerald Noir `#0B1F1A` is the
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
- [ ] **Phase 3 — About, Projects, Insights, Contact pages**
