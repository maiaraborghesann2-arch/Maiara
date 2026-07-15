import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LiquidText } from './LiquidText';
import { Reveal } from './Reveal';
import { PROJECTS } from '../content/placeholder';
import { useLang } from '../i18n/LanguageContext';
import type { HeadlineSegment } from '../i18n/translations';
import './HomeSections.css';

/** Emphasis headline: segments render via LiquidText, gold ones in italic. */
function Headline({ parts }: { parts: HeadlineSegment[] }) {
  return (
    <>
      {parts.map((seg, i) => (
        <LiquidText
          key={i}
          as="span"
          italic={!!seg.gold}
          className={seg.gold ? 'home-headline-gold' : ''}
        >
          {seg.text}
        </LiquidText>
      ))}
    </>
  );
}

/**
 * Home page sections below the hero — services, featured work, testimonials
 * and the closing contact CTA. Structural/interaction reference:
 * landonorris.com (large kinetic section headers, generous vertical rhythm,
 * confident large-scale cards, scroll-triggered reveals) adapted to Lyken's
 * branding-agency content and existing motion language. All reveals go
 * through <Reveal /> (GSAP ScrollTrigger fade + translateY, fade-only under
 * reduced motion); Lenis smoothing applies globally from the app root.
 */

/* ---------------------------------------------------------------- services */

export function ServicesSection() {
  const { dict } = useLang();
  return (
    <section className="home-section services-section" aria-labelledby="services-heading">
      <Reveal className="home-section-head">
        <span className="section-label">{dict.services.label}</span>
        <h2 id="services-heading" className="home-section-headline">
          <Headline parts={dict.services.headline} />
        </h2>
      </Reveal>

      <div className="services-row">
        {dict.services.items.map((s, i) => (
          <Reveal key={i} as="article" className="service-card" delay={i * 0.08}>
            <span className="service-numeral u-label">{`0${i + 1}`}</span>
            <span className="service-spark" aria-hidden="true" />
            <h3 className="service-title">{s.title}</h3>
            <p className="service-text">{s.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------- featured projects */

const FEATURED = PROJECTS.slice(0, 4);

export function FeaturedProjects() {
  const { dict } = useLang();
  return (
    <section className="home-section featured-section" aria-labelledby="featured-heading">
      <Reveal className="home-section-head featured-head">
        <div>
          <span className="section-label">{dict.featured.label}</span>
          <h2 id="featured-heading" className="home-section-headline">
            <Headline parts={dict.featured.headline} />
          </h2>
        </div>
        <Link to="/projects" className="btn-ghost featured-all" data-magnetic>
          {dict.featured.viewAll}
        </Link>
      </Reveal>

      <div className="featured-grid">
        {FEATURED.map((p, i) => (
          <Reveal key={p.slug} delay={(i % 2) * 0.1} className="featured-cell">
            <Link to={`/projects/${p.slug}`} className="featured-card" data-magnetic>
              {/* Placeholder visual — swap for real case-study imagery later */}
              <div className="featured-media" aria-hidden="true">
                <span className="featured-media-mark">LK</span>
              </div>
              <div className="featured-meta">
                <h3 className="featured-title">{p.title}</h3>
                <p className="featured-tags u-label">
                  {p.category} · {p.year}
                </p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ testimonials */

const TESTIMONIALS = [
  {
    quote:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit — sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    name: 'Firstname Lastname',
    role: 'CEO, Lorem Ipsum Co.',
  },
  {
    quote:
      'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    name: 'Firstname Lastname',
    role: 'Founder, Consectetur Ltd.',
  },
  {
    quote:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    name: 'Firstname Lastname',
    role: 'CMO, Elit Systems',
  },
];

export function TestimonialsSection() {
  const [index, setIndex] = useState(0);
  const { dict } = useLang();
  const t = TESTIMONIALS[index];

  return (
    <section className="home-section testimonials-section" aria-labelledby="testimonials-heading">
      <Reveal className="home-section-head">
        <span className="section-label">{dict.testimonials.label}</span>
        <h2 id="testimonials-heading" className="home-section-headline">
          <Headline parts={dict.testimonials.headline} />
        </h2>
      </Reveal>

      <Reveal className="testimonial-stage">
        <span className="testimonial-mark" aria-hidden="true">
          &ldquo;
        </span>
        <div className="testimonial-viewport" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.blockquote
              key={index}
              className="testimonial-quote"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
            >
              <p>{t.quote}</p>
              <footer className="testimonial-attrib">
                <span className="testimonial-name">{t.name}</span>
                <span className="testimonial-role u-label">{t.role}</span>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        <div className="testimonial-nav" role="group" aria-label={dict.testimonials.navLabel}>
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              type="button"
              className="testimonial-dot"
              data-active={i === index}
              aria-label={`${dict.testimonials.itemLabel} ${i + 1}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ------------------------------------------------------------- contact CTA */

export function ContactCta() {
  const { dict } = useLang();
  return (
    <section className="home-section cta-section" aria-labelledby="cta-heading">
      {/* soft gold ambient accent bookending the hero's particle motif —
          pure CSS radial glow; the global <ParticleField /> already drifts
          behind this section */}
      <div className="cta-glow" aria-hidden="true" />
      <Reveal className="cta-inner">
        <h2 id="cta-heading" className="cta-headline">
          <LiquidText as="span">{dict.cta.headline}</LiquidText>
        </h2>
        <Link to="/contact" className="btn-ghost" data-magnetic>
          {dict.cta.button}
        </Link>
      </Reveal>
    </section>
  );
}
