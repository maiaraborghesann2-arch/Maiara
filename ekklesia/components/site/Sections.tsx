"use client";

import {
  ABOUT,
  CLOSING,
  COMMUNITY,
  DEPTH,
  ECOSYSTEM,
  HOW,
  MANIFESTO,
  RESOURCES,
} from "@/lib/site/content";

/**
 * The site, after the film.
 *
 * Eight sections, and the order is an argument rather than a menu: the promise,
 * who is making it, the idea underneath it, what is actually offered, who else
 * is there, how to begin, and the invitation. Each one earns its place by
 * saying something the one before it left open.
 *
 * Two rules hold the whole thing together.
 *
 * The first is that the page has a *ground*, and it moves. It opens in the
 * ivory the film's last frame dissolves into, deepens through sand as the
 * argument gets more concrete, drops to soil for the one contemplative beat —
 * the same soil the roots were shot against — and comes back to light for the
 * invitation. Nothing announces those changes; they are just the colour the
 * next section happens to be, which is how the film handled its own light.
 *
 * The second is that almost nothing is a card. Sections are columns and rules
 * and space. Where items genuinely enumerate, they are a list with a hairline
 * and an index, not a box with a border radius and a shadow.
 *
 * `data-reveal` marks anything that should arrive rather than simply be there.
 * The mechanism is in `lib/site/useReveal.ts` and amounts to one class change
 * per element, once.
 */

/* ─────────────────────────────────────────────────────────── 02 manifesto ── */

/**
 * The hand-over.
 *
 * This is the section the tree dissolves into, so it is built to be *under* the
 * film rather than after it: it opens on the same ivory the frame's foot has
 * already become, and its first line sits low enough in the viewport that the
 * canopy is still leaving as the words arrive. The seam is meant to be
 * impossible to point at.
 */
export function Manifesto() {
  return (
    <section className="manifesto" id="conteudo" aria-labelledby="manifesto-titulo">
      <div className="manifesto__column">
        <p className="manifesto__eyebrow" data-reveal>
          <span className="rule" aria-hidden="true" />
          {MANIFESTO.eyebrow}
        </p>

        <h1 className="manifesto__title" id="manifesto-titulo">
          {MANIFESTO.title.map((line, i) => (
            /*
             * `data-reveal` sits on the wrapper, never on the line inside it.
             * The line hides by translating fully below the wrapper's clipped
             * box, which means an IntersectionObserver watching the line itself
             * would see it as permanently clipped by an ancestor and never fire
             * — it would hide itself out of its own trigger's reach.
             *
             * Wiped up rather than faded: display serif at this size goes grey
             * and muddy halfway through a fade, where a wipe keeps every stroke
             * at full weight the whole way in.
             */
            <span className="mask" data-reveal key={line} style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
              <span className="mask__line">{line}</span>
            </span>
          ))}
        </h1>

        <p className="manifesto__lede" data-reveal style={{ "--d": "220ms" } as React.CSSProperties}>
          {MANIFESTO.lede}
        </p>

        <div data-reveal style={{ "--d": "300ms" } as React.CSSProperties}>
          <a className="button" href={MANIFESTO.action.href}>
            {MANIFESTO.action.label}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────── 03 about ── */

export function About() {
  return (
    <section className="about" id="quem-somos" aria-labelledby="about-titulo">
      <div className="spread">
        <p className="eyebrow" data-reveal>
          {ABOUT.eyebrow}
        </p>
        <div className="spread__body">
          <h2 className="about__lead" id="about-titulo" data-reveal>
            {ABOUT.lead}
          </h2>
          {ABOUT.body.map((paragraph, i) => (
            <p
              key={paragraph.slice(0, 24)}
              className="prose"
              data-reveal
              style={{ "--d": `${120 + i * 90}ms` } as React.CSSProperties}
            >
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────── 04 depth ── */

/**
 * The pause, and the only dark section on the page.
 *
 * It is set as a page of a book: no eyebrow, no rule, no action, one line of
 * display serif and two quieter ones under it. The film spends its widest beat
 * underground and says almost nothing while it is down there; this is the same
 * silence, in type.
 *
 * It also does the page's structural work. Running the ground all the way down
 * to soil here and back up afterwards is what stops the site reading as one
 * long cream scroll, and it puts the darkest moment where the argument is at
 * its most inward rather than wherever a layout wanted contrast.
 */
export function Depth() {
  return (
    <section className="depth" data-ink="light" aria-labelledby="depth-lead">
      <div className="depth__column">
        <p className="depth__lead" id="depth-lead" data-reveal>
          {DEPTH.lead}
        </p>
        <p className="depth__body" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
          {DEPTH.body}
        </p>
        <p className="depth__note" data-reveal style={{ "--d": "280ms" } as React.CSSProperties}>
          {DEPTH.note}
        </p>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── 05 ecosystem ── */

export function Ecosystem() {
  return (
    <section className="ecosystem" id="ecossistema" aria-labelledby="ecosystem-titulo">
      <div className="spread">
        <p className="eyebrow" data-reveal>
          {ECOSYSTEM.eyebrow}
        </p>
        <div className="spread__body">
          <h2 className="display" id="ecosystem-titulo" data-reveal>
            {ECOSYSTEM.title}
          </h2>
          <p className="prose prose--lead" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            {ECOSYSTEM.lede}
          </p>
        </div>
      </div>

      <ol className="ledger">
        {ECOSYSTEM.items.map((item, i) => (
          <li key={item.index} data-reveal style={{ "--d": `${i * 110}ms` } as React.CSSProperties}>
            <span className="ledger__index">{item.index}</span>
            <h3 className="ledger__label">{item.label}</h3>
            <p className="ledger__body">{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── 06 resources ── */

export function Resources() {
  return (
    <section className="resources" id="recursos" aria-labelledby="resources-titulo">
      <div className="spread">
        <p className="eyebrow" data-reveal>
          {RESOURCES.eyebrow}
        </p>
        <div className="spread__body">
          <h2 className="display" id="resources-titulo" data-reveal>
            {RESOURCES.title}
          </h2>
          <p className="prose prose--lead" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            {RESOURCES.lede}
          </p>
        </div>
      </div>

      {/*
        A list with hairlines, not a grid of cards. Four boxes here would be the
        exact moment the page started looking like every other product site.
      */}
      <dl className="index">
        {RESOURCES.items.map((item, i) => (
          <div key={item.label} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
            <dt>{item.label}</dt>
            <dd>{item.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── 07 community ── */

export function Community() {
  return (
    <section className="community" id="comunidade" aria-labelledby="community-quote">
      <div className="community__column">
        <p className="eyebrow" data-reveal>
          {COMMUNITY.eyebrow}
        </p>
        <h2 className="community__quote" id="community-quote" data-reveal>
          {COMMUNITY.quote}
        </h2>
        <p className="prose" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
          {COMMUNITY.body}
        </p>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────── 08 how ── */

export function How() {
  return (
    <section className="how" id="como-funciona" aria-labelledby="how-titulo">
      <div className="spread">
        <p className="eyebrow" data-reveal>
          {HOW.eyebrow}
        </p>
        <div className="spread__body">
          <h2 className="display" id="how-titulo" data-reveal>
            {HOW.title}
          </h2>
        </div>
      </div>

      <ol className="steps">
        {HOW.steps.map((step, i) => (
          <li key={step.index} data-reveal style={{ "--d": `${i * 110}ms` } as React.CSSProperties}>
            <span className="steps__index" aria-hidden="true">
              {step.index}
            </span>
            <h3 className="steps__label">{step.label}</h3>
            <p className="steps__body">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────── 09 closing ── */

export function Closing() {
  return (
    <section className="closing" aria-labelledby="closing-titulo">
      <h2 className="closing__title" id="closing-titulo">
        {CLOSING.title.map((line, i) => (
          <span className="mask" data-reveal key={line} style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
            <span className="mask__line">{line}</span>
          </span>
        ))}
      </h2>
      <div data-reveal style={{ "--d": "240ms" } as React.CSSProperties}>
        <a className="button button--solid" href={CLOSING.action.href}>
          {CLOSING.action.label}
        </a>
      </div>
    </section>
  );
}
