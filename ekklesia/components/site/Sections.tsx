"use client";

import {
  ACTIONS,
  ADAPTS,
  APPROACH,
  CAPABILITIES,
  CASES,
  DIAGNOSIS,
  MISSION,
  PATHS,
  PROBLEM,
  PROPOSITION,
  RESPONSIBILITY,
  SITUATIONS,
} from "@/lib/site/content";

/**
 * The site, after the film.
 *
 * The order is the company's own method, and that is the point: the page
 * understands the problem, clarifies the situation, shows the possible paths,
 * and only then says what it can do. A visitor who reads it in order has been
 * taken through a diagnosis.
 *
 *   the proposition → the problem → the method → the four paths →
 *   the capabilities → what adaptation actually means → situations →
 *   the record → what we decline → the diagnosis → the mission
 *
 * Three rules hold it together.
 *
 * THE GROUND MOVES. Sand for the argument, soil for the two passages that
 * happen below the surface — the method and the refusals — and light for
 * everything that follows from them. Four changes across eleven sections, each
 * where the argument turns, none announced: they are gradients, not borders.
 *
 * NO SECTION REPEATS ANOTHER'S SHAPE. A grid of cards eleven times would
 * flatten an argument that is not flat. So: a column, a settling list, a
 * numbered rail, a stem with four branches, a hairline index, a spread with
 * running terms, quoted situations, a record, a dark list, a numbered path, and
 * a held line. Exactly one `border-radius` exists in the stylesheet and it
 * belongs to a button.
 *
 * MOTION MEANS SOMETHING OR IT DOES NOT HAPPEN. `data-reveal` sets one
 * attribute once per element and CSS does the rest. The only place motion
 * carries an argument is the problem section, where the fragments arrive
 * misaligned and settle — the section is about things not fitting together, so
 * the layout performs it instead of illustrating it.
 */

/* ──────────────────────────────────────────────────── 02 the proposition ── */

/**
 * The hand-over.
 *
 * This is the section the tree dissolves into, so it is built to sit *under*
 * the film rather than after it: same ground the frame's foot has already
 * travelled to, first line low enough in the viewport that the canopy is still
 * leaving as the words arrive.
 *
 * The claim and its answer are one sentence broken across two type sizes — the
 * negative large, the positive small and set in the functional sans directly
 * beneath it. Giving both lines the same weight would make it a slogan; the
 * asymmetry makes it an argument.
 */
export function Proposition() {
  return (
    <section className="proposition" id="conteudo" aria-labelledby="proposition-titulo">
      <div className="proposition__column">
        <p className="proposition__eyebrow" data-reveal>
          <span className="rule" aria-hidden="true" />
          {PROPOSITION.eyebrow}
        </p>

        <h1 className="proposition__title" id="proposition-titulo">
          {PROPOSITION.title.map((line, i) => (
            /*
             * `data-reveal` sits on the wrapper, never on the line inside it.
             * The line hides by translating fully below the wrapper's clipped
             * box, so an observer watching the line itself would see it as
             * permanently clipped by an ancestor and never fire — it would hide
             * itself out of its own trigger's reach.
             */
            <span className="mask" data-reveal key={line} style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
              <span className="mask__line">{line}</span>
            </span>
          ))}
        </h1>

        <p className="proposition__counter" data-reveal style={{ "--d": "240ms" } as React.CSSProperties}>
          {PROPOSITION.counter}
        </p>

        <p className="proposition__lede" data-reveal style={{ "--d": "320ms" } as React.CSSProperties}>
          {PROPOSITION.lede}
        </p>

        <div className="actions" data-reveal style={{ "--d": "400ms" } as React.CSSProperties}>
          <a className="button button--solid" href={ACTIONS.primary.href}>
            {ACTIONS.primary.label}
          </a>
          <a className="button button--quiet" href={ACTIONS.secondary.href}>
            {ACTIONS.secondary.label}
          </a>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── 03 problem ── */

/**
 * The fragments arrive out of line and settle.
 *
 * This is the one place on the page where motion carries the argument rather
 * than decorating it: the section is about tools that do not line up, so the
 * lines do not line up until they have been read. Each is offset by a different
 * amount and returns to the same left edge — the settling *is* the point being
 * made, which is why it is here and nowhere else.
 */
export function Problem() {
  return (
    <section className="problem" id="problema" aria-labelledby="problem-titulo">
      <div className="spread">
        <p className="eyebrow" data-reveal>
          {PROBLEM.eyebrow}
        </p>
        <div className="spread__body">
          <h2 className="display" id="problem-titulo" data-reveal>
            {PROBLEM.title}
          </h2>
          <p className="prose prose--lead" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            {PROBLEM.lede}
          </p>
        </div>
      </div>

      <ul className="fragments">
        {PROBLEM.fragments.map((line, i) => (
          <li
            key={line}
            data-reveal
            style={
              {
                "--d": `${i * 110}ms`,
                // Alternating, decreasing — so it reads as scatter rather than
                // as a staircase, and lands flush.
                "--off": `${(i % 2 === 0 ? 1 : -1) * (34 - i * 4)}px`,
              } as React.CSSProperties
            }
          >
            {line}
          </li>
        ))}
      </ul>

      <p className="problem__close" data-reveal>
        {PROBLEM.close}
      </p>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── 04 approach ── */

/**
 * The method, on the dark ground.
 *
 * Five stages down a single hairline rail with the index sitting on the rule
 * itself — a spine, not five cards. It is set below the surface for the same
 * reason the film spends its widest and quietest beat underground: this is the
 * part of the work nobody sees, and it is the part the company is selling.
 */
export function Approach() {
  return (
    <section className="approach" id="abordagem" data-ink="light" aria-labelledby="approach-titulo">
      <div className="approach__head">
        <p className="eyebrow eyebrow--light" data-reveal>
          {APPROACH.eyebrow}
        </p>
        <h2 className="display" id="approach-titulo" data-reveal>
          {APPROACH.title}
        </h2>
        <p className="approach__lede" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
          {APPROACH.lede}
        </p>
      </div>

      <ol className="rail">
        {APPROACH.stages.map((stage, i) => (
          <li key={stage.index} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
            <span className="rail__index">{stage.index}</span>
            <h3 className="rail__label">{stage.label}</h3>
            <p className="rail__body">{stage.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ───────────────────────────────────────────────────────── 05 the paths ── */

/**
 * One stem, four branches.
 *
 * The four outcomes share a rule across the top and each hangs from it by a
 * short descender, so they read as results of one decision rather than as four
 * things on a menu. Four boxes here would say "four services", which is the
 * opposite of the argument.
 */
export function Paths() {
  return (
    <section className="paths" aria-labelledby="paths-titulo">
      <div className="paths__head">
        <p className="eyebrow" data-reveal>
          {PATHS.eyebrow}
        </p>
        <h2 className="display display--wide" id="paths-titulo" data-reveal>
          {PATHS.title}
        </h2>
        <p className="prose prose--lead" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
          {PATHS.lede}
        </p>
      </div>

      <ol className="branches">
        {PATHS.options.map((option, i) => (
          <li key={option.label} data-reveal style={{ "--d": `${i * 100}ms` } as React.CSSProperties}>
            <span className="branches__stem" aria-hidden="true" />
            <h3 className="branches__label">{option.label}</h3>
            <p className="branches__body">{option.body}</p>
          </li>
        ))}
      </ol>

      <p className="paths__close" data-reveal>
        {PATHS.close}
      </p>
    </section>
  );
}

/* ────────────────────────────────────────────────────── 06 capabilities ── */

export function Capabilities() {
  return (
    <section className="capabilities" id="o-que-fazemos" aria-labelledby="capabilities-titulo">
      <div className="spread">
        <p className="eyebrow" data-reveal>
          {CAPABILITIES.eyebrow}
        </p>
        <div className="spread__body">
          <h2 className="display" id="capabilities-titulo" data-reveal>
            {CAPABILITIES.title}
          </h2>
          <p className="prose prose--lead" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            {CAPABILITIES.lede}
          </p>
        </div>
      </div>

      {/* A hairline index. These are downstream of the method and are set to
          look it — five boxes would give them the weight of the argument. */}
      <dl className="index">
        {CAPABILITIES.items.map((item, i) => (
          <div key={item.label} data-reveal style={{ "--d": `${i * 70}ms` } as React.CSSProperties}>
            <dt>{item.label}</dt>
            <dd>{item.body}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── 07 adapts ── */

/**
 * What personalisation actually means.
 *
 * The nine dimensions are set as running text separated by hairlines rather
 * than as nine chips or nine icons: they are a list of things a system has to
 * bend around, and a wall of tags would turn them into features.
 */
export function Adapts() {
  return (
    <section className="adapts" aria-labelledby="adapts-titulo">
      <div className="adapts__head">
        <p className="eyebrow" data-reveal>
          {ADAPTS.eyebrow}
        </p>
        <h2 className="display" id="adapts-titulo" data-reveal>
          {ADAPTS.title}
        </h2>
        <p className="adapts__counter" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
          {ADAPTS.counter}
        </p>
      </div>

      <div className="adapts__body">
        <p className="prose" data-reveal>
          {ADAPTS.lede}
        </p>
        <ul className="terms" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
          {ADAPTS.dimensions.map((term) => (
            <li key={term}>{term}</li>
          ))}
        </ul>
      </div>

      <p className="adapts__close" data-reveal>
        {ADAPTS.close}
      </p>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── 08 situations ── */

/**
 * Sentences a church leader would actually say, each with the direction it
 * points to. Set as pull quotes with a quiet answer beneath — the recognition
 * has to land before the response means anything.
 */
export function Situations() {
  return (
    <section className="situations" aria-labelledby="situations-titulo">
      <div className="spread">
        <p className="eyebrow" data-reveal>
          {SITUATIONS.eyebrow}
        </p>
        <div className="spread__body">
          <h2 className="display" id="situations-titulo" data-reveal>
            {SITUATIONS.title}
          </h2>
        </div>
      </div>

      <ul className="situations__list">
        {SITUATIONS.items.map((item, i) => (
          <li key={item.quote} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
            <blockquote>{item.quote}</blockquote>
            <p className="situations__answer">{item.answer}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────────────────────────────────────────────────────────── 09 cases ── */

/**
 * The record, built empty.
 *
 * There are no EBD assets in this repository, so every field says what belongs
 * in it rather than inventing a result. The layout takes several entries — a
 * second one is another object in `CASES.entries`.
 */
export function Cases() {
  return (
    <section className="cases" id="casos" aria-labelledby="cases-titulo">
      <div className="spread">
        <p className="eyebrow" data-reveal>
          {CASES.eyebrow}
        </p>
        <div className="spread__body">
          <h2 className="display" id="cases-titulo" data-reveal>
            {CASES.title}
          </h2>
          <p className="prose prose--lead" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            {CASES.lede}
          </p>
        </div>
      </div>

      {CASES.entries.map((entry) => (
        <article className="record" key={entry.name} data-reveal>
          <h3 className="record__name">{entry.name}</h3>
          <dl className="record__fields">
            {entry.fields.map((field) => (
              <div key={field.label}>
                <dt>{field.label}</dt>
                <dd>{field.body}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </section>
  );
}

/* ─────────────────────────────────────────────────── 10 responsibility ── */

/**
 * The refusals, on the dark ground.
 *
 * The headline is about what does not get built, because that is the claim a
 * church leadership actually needs to hear before trusting a supplier. The
 * eight principles sit under it as a quiet row — named, not explained, because
 * a paragraph each would turn a position into a brochure.
 */
export function Responsibility() {
  return (
    <section className="responsibility" data-ink="light" aria-labelledby="responsibility-titulo">
      <div className="responsibility__column">
        <p className="eyebrow eyebrow--light" data-reveal>
          {RESPONSIBILITY.eyebrow}
        </p>
        <h2 className="display" id="responsibility-titulo" data-reveal>
          {RESPONSIBILITY.title}
        </h2>
        <p className="responsibility__lede" data-reveal style={{ "--d": "140ms" } as React.CSSProperties}>
          {RESPONSIBILITY.lede}
        </p>
      </div>

      <ul className="principles" data-reveal style={{ "--d": "240ms" } as React.CSSProperties}>
        {RESPONSIBILITY.principles.map((principle) => (
          <li key={principle}>{principle}</li>
        ))}
      </ul>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── 11 diagnosis ── */

export function Diagnosis() {
  return (
    <section className="diagnosis" id="diagnostico" aria-labelledby="diagnosis-titulo">
      <div className="diagnosis__head">
        <p className="eyebrow" data-reveal>
          {DIAGNOSIS.eyebrow}
        </p>
        <h2 className="display display--wide" id="diagnosis-titulo" data-reveal>
          {DIAGNOSIS.title}
        </h2>
        <p className="prose prose--lead" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
          {DIAGNOSIS.lede}
        </p>
      </div>

      <ol className="path">
        {DIAGNOSIS.steps.map((step, i) => (
          <li key={step.index} data-reveal style={{ "--d": `${i * 80}ms` } as React.CSSProperties}>
            <span className="path__index" aria-hidden="true">
              {step.index}
            </span>
            <p>{step.body}</p>
          </li>
        ))}
      </ol>

      <div className="diagnosis__foot" data-reveal>
        <div className="actions">
          <a className="button button--solid" href={ACTIONS.primary.href}>
            {ACTIONS.primary.label}
          </a>
          <a className="button button--quiet" href={ACTIONS.secondary.href}>
            {ACTIONS.secondary.label}
          </a>
        </div>
        <p className="diagnosis__note">{DIAGNOSIS.note}</p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────────── 12 mission ── */

/**
 * The close. Back to the metaphor, and the only place the slogan appears —
 * after eleven sections have established what the company does, which is the
 * only condition under which a line like that means anything.
 */
export function Mission() {
  return (
    <section className="mission" aria-labelledby="mission-titulo">
      <h2 className="mission__title" id="mission-titulo">
        {MISSION.title.map((line, i) => (
          <span className="mask" data-reveal key={line} style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
            <span className="mask__line">{line}</span>
          </span>
        ))}
      </h2>
      <p className="mission__body" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
        {MISSION.body}
      </p>
      <p className="mission__slogan" data-reveal style={{ "--d": "320ms" } as React.CSSProperties}>
        {MISSION.slogan}
      </p>
    </section>
  );
}
