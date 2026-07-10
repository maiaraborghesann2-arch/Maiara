import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';
import { Reveal } from '../components/Reveal';
import { LiquidText } from '../components/LiquidText';
import { LOREM, MILESTONES } from '../content/placeholder';
import './About.css';

const PHILOSOPHY = [
  { numeral: 'I', title: 'Lorem ipsum dolor', text: LOREM.medium },
  { numeral: 'II', title: 'Sed do eiusmod', text: LOREM.medium },
  { numeral: 'III', title: 'Ut enim ad minim', text: LOREM.medium },
];

export function About() {
  return (
    <PageShell className="page about">
      <Seo title="About — Lyken Agency" path="/about" />
      {/* Stage 1 — intro */}
      <header className="page-head about-intro">
        <span className="section-label">About Lyken</span>
        <h1 className="page-headline about-headline">
          <LiquidText as="span">Lorem ipsum dolor sit</LiquidText>{' '}
          <LiquidText as="span" italic className="u-gold">
            amet,
          </LiquidText>{' '}
          <LiquidText as="span">consectetur.</LiquidText>
        </h1>

        <div className="about-intro-cols">
          <Reveal as="p" className="about-intro-text">
            {LOREM.long}
          </Reveal>
          <Reveal className="about-portrait placeholder-box" delay={0.1}>
            <span className="u-label">Image Placeholder</span>
          </Reveal>
        </div>
      </header>

      {/* Stage 2 — philosophy pillars */}
      <section className="about-philosophy" aria-label="Philosophy">
        {PHILOSOPHY.map((p, i) => (
          <Reveal key={p.numeral} className={`about-pillar ${i % 2 === 1 ? 'about-pillar-right' : ''}`}>
            <span className="about-pillar-numeral" aria-hidden="true">
              {p.numeral}
            </span>
            <h2 className="about-pillar-title">{p.title}</h2>
            <p className="about-pillar-text">{p.text}</p>
          </Reveal>
        ))}
      </section>

      {/* Stage 3 — milestones */}
      <section className="about-timeline" aria-label="Milestones">
        <Reveal>
          <span className="section-label">Milestones</span>
        </Reveal>
        <div className="about-timeline-row">
          {MILESTONES.map((m, i) => (
            <Reveal as="article" key={m.year} className="milestone-card" delay={i * 0.06} data-magnetic>
              <span className="milestone-year u-label">{m.year}</span>
              <h3 className="milestone-title">{m.title}</h3>
              <p className="milestone-text">{m.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Stage 4 — CTA */}
      <section className="about-cta">
        <Reveal className="about-cta-inner">
          <LiquidText as="h2" className="about-cta-headline">
            Let's build something unforgettable.
          </LiquidText>
          <Link to="/contact" className="btn-ghost" data-magnetic>
            Start a Conversation
          </Link>
        </Reveal>
      </section>
    </PageShell>
  );
}
