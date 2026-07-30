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

## Lykos briefing (`/briefing`) + archive (`/admin`)

`/briefing` runs an AI intake conversation ("Lykos") and, on completion, stores a
structured brief for the team. `/admin` lists those briefs behind a shared
password. Both are served by Vercel serverless functions in `api/` — the browser
never holds a key or a secret.

| Env var | Set by | Notes |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | you, from the Anthropic Console | server-side only |
| `ADMIN_PASSWORD` | you — any strong string | unlocks `/admin`; rotating it signs everyone out |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Vercel, automatically | injected when a KV store is connected (Storage tab) |

Set all of them in **Vercel → Project → Settings → Environment Variables**
(Production, Preview and Development), then redeploy. Nothing is read from a
committed file, and there is no `.env` in the repo. Provisioning steps for KV are
documented at the top of `api/_lib/store.ts`; until KV is connected the chat and
the summary still work, only the archive write is skipped.

Cost guards live in `api/lykos-chat.ts` (`WRAP_UP_AFTER`, `MAX_MESSAGES`): Lykos
is told to conclude once a conversation runs long, and is force-concluded at the
hard ceiling.

## Design system

All tokens live in `src/styles/tokens.css`. **Emerald Noir `#143128` is the
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
- [x] **Phase 4.5 — hero & global refinement**: two-column hero (copy left,
      sphere right, 48px+ gutter; mobile stacks copy-then-sphere), sphere
      radius +23%, halo/blob removed (per-particle shader glow only — the
      composer Bloom pass zeroed canvas alpha and aggregated into a blob,
      removed deliberately), peek-through reveal (dual point layers: cursor
      repels sphere particles while hidden monogram particles brighten
      through the gaps — no full morph), monogram fitted inside the sphere
      (90% of diameter), noise-driven idle drift, ParticleField lines
      removed (glow dots only, matching the sphere), lighter
      --color-emerald-noir-deep bottom gradient, 3D camera-pivot page
      transitions (rotateY ±8° / translateZ -100px, overlap via popLayout),
      ambient audio loop (generated placeholder — swap licensed track at
      public/audio/ambient-loop.wav) with nav mute toggle + localStorage
      preference, and a stale-IntersectionObserver fix in useCanvasActive.
- [x] **Phase 5a — Lykos briefing**: footer CTA renamed to "Start your journey"
      with a secondary path to `/briefing`; AI intake chat (`api/lykos-chat.ts`,
      Claude via the Anthropic SDK, server-side key only) that gathers contact,
      project type, goals, audience, brand personality, budget, timeline and
      existing assets one question at a time, then generates a structured
      summary plus an internal-only recommendations readout, archived to Vercel
      KV; password-protected `/admin` archive (HMAC-signed httpOnly session
      cookie, no user accounts). Lykos's portrait goes at
      `public/images/lykos-avatar.png` (falls back to the LK monogram until it
      is added).
- [ ] **Phase 5 — real content, imagery, form backend, deploy**
