import { Link } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';
import { Reveal } from '../components/Reveal';
import { LiquidText } from '../components/LiquidText';
import { ARTICLES } from '../content/placeholder';
import './Insights.css';

export function Insights() {
  return (
    <PageShell className="page insights">
      <Seo title="Insights — Lyken Agency" path="/insights" />
      <header className="page-head insights-head">
        <span className="section-label">Insights</span>
        <LiquidText as="h1" className="page-headline insights-headline">
          Lorem ipsum dolor sit amet, consectetur adipiscing.
        </LiquidText>
      </header>

      <div className="insights-list">
        {ARTICLES.map((a, i) => (
          <Reveal key={a.slug} delay={i * 0.05} y={24}>
            <Link to={`/insights/${a.slug}`} className="insight-row" data-magnetic>
              <span className="insight-meta">
                <span className="u-label insight-category">{a.category}</span>
                <span className="u-label insight-date">{a.date}</span>
              </span>
              <LiquidText as="span" className="insight-title" intensity={0.45} radius={80}>
                {a.title}
              </LiquidText>
              <span className="insight-arrow" aria-hidden="true">
                →
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </PageShell>
  );
}
