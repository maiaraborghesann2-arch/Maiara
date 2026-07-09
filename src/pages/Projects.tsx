import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PageShell } from '../components/PageShell';
import { LiquidText } from '../components/LiquidText';
import { PROJECTS } from '../content/placeholder';
import './Projects.css';

const FILTERS = ['All', 'Branding', 'UI/UX', 'AI Integration'] as const;
type Filter = (typeof FILTERS)[number];

export function Projects() {
  const [filter, setFilter] = useState<Filter>('All');
  const visible = PROJECTS.filter((p) => filter === 'All' || p.category === filter);

  return (
    <PageShell className="page projects">
      <header className="page-head projects-head">
        <span className="section-label">Selected Work</span>
        <LiquidText as="h1" className="page-headline projects-headline">
          Lorem ipsum dolor sit amet.
        </LiquidText>

        <div className="projects-filters" role="group" aria-label="Filter projects">
          {FILTERS.map((f) => (
            <button
              key={f}
              className="projects-filter"
              data-magnetic
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              <span className="nav-dot" data-active={filter === f} aria-hidden="true" />
              {f}
            </button>
          ))}
        </div>
      </header>

      <motion.div className="projects-grid" layout>
        <AnimatePresence mode="popLayout">
          {visible.map((p) => (
            <motion.article
              key={p.slug}
              layout
              className="project-card"
              style={{ gridColumn: `span ${p.span}` }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link to={`/projects/${p.slug}`} className="project-card-link" data-magnetic>
                <div className="project-card-media placeholder-box" style={{ aspectRatio: p.ratio }}>
                  <span className="u-label">Image Placeholder</span>
                </div>
                <div className="project-card-meta">
                  <span className="project-card-category u-label">{p.category}</span>
                  <span className="project-card-row">
                    <LiquidText as="span" className="project-card-title" intensity={0.45} radius={70}>
                      {p.title}
                    </LiquidText>
                    <span className="project-card-arrow" aria-hidden="true">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </motion.article>
          ))}
        </AnimatePresence>
      </motion.div>
    </PageShell>
  );
}
