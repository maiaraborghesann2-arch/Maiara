import { Suspense, lazy, useLayoutEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LiquidText } from './LiquidText';
import { particleTuning } from './ParticleField';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import './HeroSection.css';

gsap.registerPlugin(ScrollTrigger);

const LykosFigure = lazy(() => import('./LykosFigure'));

const PILLARS = [
  {
    numeral: 'I',
    title: 'Strategic',
    text: 'Every decision starts with positioning, not decoration.',
  },
  {
    numeral: 'II',
    title: 'Considered',
    text: 'Restraint is a design choice. We use it deliberately.',
  },
  {
    numeral: 'III',
    title: 'Enduring',
    text: 'Brands built to outlast trends, not chase them.',
  },
];

/**
 * Cinematic pinned scroll sequence (~250vh):
 *   Stage 1 (0–100vh)   — headline parallax-shrinks, rule line draws, particles energise
 *   Stage 2 (100–180vh) — hero exits up, Lykos figure emerges with its caption
 *   Stage 3 (180vh+)    — pillar cards + final CTA in normal flow
 * Reduced motion: no pinning — stages stack and simply fade in on scroll.
 */
export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduced = useMemo(() => prefersReducedMotion(), []);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      if (reduced) {
        // simple fade-in-on-scroll for every marked block
        gsap.utils.toArray<HTMLElement>('[data-fade]').forEach((el) => {
          gsap.fromTo(
            el,
            { autoAlpha: 0 },
            {
              autoAlpha: 1,
              duration: 0.5,
              ease: 'power1.out',
              scrollTrigger: { trigger: el, start: 'top 88%' },
            },
          );
        });
        return;
      }

      // ---- pinned master timeline (stages 1 + 2 over 180vh of scroll) ----
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: '.hero-pin',
          start: 'top top',
          end: '+=180%',
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
        },
      });

      // Stage 1: 0 → 1
      tl.to('.hero-stage1-inner', { scale: 0.85, y: -70, duration: 1 }, 0)
        .to('.hero-rule', { scaleX: 1, duration: 0.9 }, 0.08)
        .to(particleTuning, { energy: 1, duration: 1 }, 0)
        // Stage 2: 1 → 1.8
        .to('.hero-stage1', { autoAlpha: 0, scale: 0.82, y: -140, duration: 0.45 }, 1)
        .fromTo(
          '.hero-stage2-figure',
          { autoAlpha: 0, scale: 0.7 },
          { autoAlpha: 1, scale: 1, duration: 0.55 },
          1.1,
        )
        .fromTo(
          '.hero-caption',
          { autoAlpha: 0, y: 28 },
          { autoAlpha: 1, y: 0, duration: 0.35 },
          1.4,
        );

      // ---- stage 3: pillar cards + final CTA, individually triggered ----
      gsap.utils.toArray<HTMLElement>('.pillar-card').forEach((card, i) => {
        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 48 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.9,
            delay: i * 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 85%' },
          },
        );
      });

      gsap.fromTo(
        '.hero-final-inner',
        { autoAlpha: 0, y: 36 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: { trigger: '.hero-final', start: 'top 78%' },
        },
      );
    }, section);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section ref={sectionRef} className={`hero ${reduced ? 'hero-reduced' : ''}`}>
      <div className="hero-pin">
        {/* -------- Stage 1 -------- */}
        <div className="hero-stage1" data-fade>
          <div className="hero-stage1-inner">
            <h1 className="hero-headline">
              <span className="hero-line">
                <LiquidText as="span">Intelligent Strategy.</LiquidText>
              </span>
              <span className="hero-line">
                <LiquidText as="span" italic className="hero-line-gold">
                  Unforgettable
                </LiquidText>{' '}
                <LiquidText as="span">Brands.</LiquidText>
              </span>
            </h1>
            <p className="hero-subline">
              Brand identity, digital experience, and AI-integrated design for ambitious
              companies.
            </p>
            <Link to="/projects" className="btn-ghost" data-magnetic>
              View Our Work
            </Link>
          </div>
          <div className="hero-rule" aria-hidden="true" />
        </div>

        {/* -------- Stage 2 -------- */}
        <div className="hero-stage2" data-fade>
          <div className="hero-stage2-figure" aria-hidden="true">
            <Suspense fallback={null}>
              <LykosFigure />
            </Suspense>
          </div>
          <p className="hero-caption">Where strategy becomes shape.</p>
        </div>
      </div>

      {/* -------- Stage 3 -------- */}
      <div className="hero-pillars">
        <div className="hero-pillars-row">
          {PILLARS.map((p) => (
            <article key={p.numeral} className="pillar-card" data-fade>
              <span className="pillar-numeral" aria-hidden="true">
                {p.numeral}
              </span>
              <h2 className="pillar-title">{p.title}</h2>
              <p className="pillar-text">{p.text}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="hero-final">
        <div className="hero-final-inner" data-fade>
          <LiquidText as="h2" className="hero-final-headline">
            Let's build something unforgettable.
          </LiquidText>
          <Link to="/contact" className="btn-ghost" data-magnetic>
            Start a Conversation
          </Link>
        </div>
      </div>
    </section>
  );
}
