import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';
import { Reveal } from '../components/Reveal';
import { LiquidText } from '../components/LiquidText';
import { LOREM, PROJECTS } from '../content/placeholder';
import './ProjectDetail.css';

const GALLERY_RATIOS = ['16 / 9', '4 / 5', '1 / 1'];

export function ProjectDetail() {
  const { slug } = useParams();
  const project = PROJECTS.find((p) => p.slug === slug) ?? PROJECTS[0];

  return (
    <PageShell className="page project-detail">
      <Seo title={`${project.title} — Lyken Agency`} path={`/projects/${project.slug}`} />
      <Link to="/projects" className="project-detail-back u-label" data-magnetic>
        ← Back to Projects
      </Link>

      <header className="project-detail-head">
        <span className="section-label">{project.category}</span>
        <LiquidText as="h1" className="page-headline project-detail-headline">
          {project.title}
        </LiquidText>
      </header>

      <Reveal className="project-detail-hero placeholder-box">
        <span className="u-label">Hero Image Placeholder</span>
      </Reveal>

      <div className="project-detail-cols">
        <Reveal as="aside" className="project-detail-sidebar" aria-label="Project details">
          <dl>
            <dt className="u-label">Client</dt>
            <dd>{project.client}</dd>
            <dt className="u-label">Year</dt>
            <dd>{project.year}</dd>
            <dt className="u-label">Services</dt>
            <dd>{project.services}</dd>
          </dl>
        </Reveal>

        <div className="project-detail-body">
          {LOREM.paragraphs.slice(0, 3).map((p, i) => (
            <Reveal as="p" key={i} delay={i * 0.05}>
              {p}
            </Reveal>
          ))}
        </div>
      </div>

      <div className="project-detail-gallery">
        {GALLERY_RATIOS.map((ratio, i) => (
          <Reveal key={ratio} className="placeholder-box" delay={i * 0.06}>
            <div style={{ aspectRatio: ratio, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <span className="u-label">Image Placeholder</span>
            </div>
          </Reveal>
        ))}
      </div>
    </PageShell>
  );
}
