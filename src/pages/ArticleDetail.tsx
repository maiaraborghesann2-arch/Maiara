import { Link, useParams } from 'react-router-dom';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';
import { Reveal } from '../components/Reveal';
import { LiquidText } from '../components/LiquidText';
import { ARTICLES, LOREM } from '../content/placeholder';
import './ArticleDetail.css';

function PullQuote({ children }: { children: string }) {
  return (
    <figure className="article-pullquote">
      <span className="article-pullquote-rule" aria-hidden="true" />
      <blockquote>{children}</blockquote>
      <span className="article-pullquote-rule" aria-hidden="true" />
    </figure>
  );
}

export function ArticleDetail() {
  const { slug } = useParams();
  const article = ARTICLES.find((a) => a.slug === slug) ?? ARTICLES[0];

  return (
    <PageShell className="page article-detail">
      <Seo title={`${article.title} — Lyken Agency`} path={`/insights/${article.slug}`} />
      <Link to="/insights" className="article-back u-label" data-magnetic>
        ← Back to Insights
      </Link>

      <article className="article-body-wrap">
        <header className="article-head">
          <span className="section-label">{article.category}</span>
          <LiquidText as="h1" className="article-headline">
            {article.title}
          </LiquidText>
          <p className="article-byline u-label">Lorem Ipsum · {article.date}</p>
        </header>

        <div className="article-body">
          {LOREM.paragraphs.slice(0, 2).map((p, i) => (
            <Reveal as="p" key={`a-${i}`}>
              {p}
            </Reveal>
          ))}

          <Reveal>
            <PullQuote>{LOREM.pullQuote}</PullQuote>
          </Reveal>

          {LOREM.paragraphs.slice(2, 4).map((p, i) => (
            <Reveal as="p" key={`b-${i}`}>
              {p}
            </Reveal>
          ))}

          <Reveal>
            <PullQuote>{LOREM.short}</PullQuote>
          </Reveal>

          <Reveal as="p">{LOREM.paragraphs[4]}</Reveal>
        </div>
      </article>
    </PageShell>
  );
}
