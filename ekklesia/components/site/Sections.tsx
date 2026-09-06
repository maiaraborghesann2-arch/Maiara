"use client";

import { SystemDiagram } from "@/components/site/SystemDiagram";
import { useCopy } from "@/lib/site/locale";
import { useActiveCard } from "@/lib/site/useActiveCard";

/**
 * The homepage, after the film. Six sections, and each carries exactly one idea.
 *
 *   the problem → the method → the decision → the work → the difference → the
 *   invitation
 *
 * Three rules hold it together.
 *
 * THE GROUND IS A SET OF FIELDS, NOT A FADE. Cream, deep earth, cream, sand,
 * green, cream — every change is a hard edge at a section boundary, because a
 * gradient between two sections is an apology for the boundary rather than a
 * design of it. The visitor should know they have entered a new section; the
 * palette is what tells them, and spacing and composition do the rest.
 *
 * EVERY CARD SYSTEM HAS ITS OWN LOGIC. Three of them, and none is a grid of
 * identical rounded rectangles: the problem is three states of one diagram, the
 * method is a sequence with one stage open at a time, the paths are four
 * answers to one question, and the capabilities are a rail that opens on
 * demand. A card exists here to hold a piece of the information architecture —
 * if it were only holding a box, it would be a paragraph.
 *
 * MOTION IS ELEVATION AND OPACITY, AND NOTHING ELSE. No parallax, no floating,
 * no rotation. The film is the movement on this page; the content is where it
 * settles.
 */

/* ─────────────────────────────────────────────────────────── 02 problem ── */

/**
 * Three states of the same trouble.
 *
 * The diagrams are in `SystemDiagram` and they are the argument — one set of
 * nodes, drawn identically in all three, with only the relationships between
 * them changing. The copy is their caption.
 */
export function Problem() {
  const { problem } = useCopy();
  const { active, cardProps } = useActiveCard(problem.states.length);

  return (
    <section className="field field--cream problem" id="problema" aria-labelledby="problem-titulo">
      <div className="spread">
        <p className="eyebrow" data-reveal>
          {problem.eyebrow}
        </p>
        <div className="spread__body">
          <h2 className="display" id="problem-titulo" data-reveal>
            {problem.title}
          </h2>
          <p className="prose prose--lead" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            {problem.lede}
          </p>
        </div>
      </div>

      <ol className="states">
        {problem.states.map((state, i) => (
          <li key={state.id} data-reveal style={{ "--d": `${i * 110}ms` } as React.CSSProperties}>
            <button
              type="button"
              className="state"
              data-on={active === i ? "true" : "false"}
              aria-expanded={active === i}
              {...cardProps(i)}
            >
              <SystemDiagram level={state.id} />
              <span className="state__label">{state.label}</span>
              <span className="state__body">{state.body}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ────────────────────────────────────────────────────────── 03 approach ── */

/**
 * The method, on the deep earth, as a sequence with one stage open.
 *
 * A selection rather than a disclosure: "none of the five" is not a meaningful
 * state for a process, so one is always open and the first is open on arrival.
 * The five sit on a single rule, and the open one takes the room — which is the
 * shape of the argument, since the work is sequential and not a menu.
 */
export function Approach() {
  const { approach } = useCopy();
  const { active, cardProps } = useActiveCard(approach.stages.length, "select");

  return (
    <section
      className="field field--earth approach"
      id="abordagem"
      data-ink="light"
      aria-labelledby="approach-titulo"
    >
      <div className="spread">
        <p className="eyebrow eyebrow--light" data-reveal>
          {approach.eyebrow}
        </p>
        <div className="spread__body">
          <h2 className="display" id="approach-titulo" data-reveal>
            {approach.title}
          </h2>
        </div>
      </div>

      <ol className="stages" data-reveal>
        {approach.stages.map((stage, i) => (
          <li key={stage.index} data-on={active === i ? "true" : "false"}>
            <button type="button" className="stage" aria-current={active === i} {...cardProps(i)}>
              <span className="stage__index">{stage.index}</span>
              <span className="stage__label">{stage.label}</span>
              <span className="stage__body">{stage.body}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ───────────────────────────────────────────────────────── 04 the paths ── */

/**
 * One question, four answers.
 *
 * The question is set larger than any of the answers, because the question is
 * the thing being sold — a supplier that asks it is a different kind of
 * supplier from one that arrives with an answer already chosen. Closed, each
 * card shows only its name and its one-line claim; opening it gives the reason.
 */
export function Paths() {
  const { paths } = useCopy();
  const { active, cardProps } = useActiveCard(paths.options.length);

  return (
    <section className="field field--cream paths" id="caminho" aria-labelledby="paths-question">
      <div className="paths__head">
        <p className="eyebrow" data-reveal>
          {paths.eyebrow}
        </p>
        <h2 className="paths__question" id="paths-question" data-reveal>
          {paths.question}
        </h2>
        <p className="prose prose--lead" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
          {paths.lede}
        </p>
      </div>

      <ol className="paths__grid">
        {paths.options.map((option, i) => (
          <li key={option.id} data-reveal style={{ "--d": `${i * 90}ms` } as React.CSSProperties}>
            <button
              type="button"
              className="path"
              data-on={active === i ? "true" : "false"}
              aria-expanded={active === i}
              {...cardProps(i)}
            >
              <span className="path__rule" aria-hidden="true" />
              <span className="path__label">{option.label}</span>
              <span className="path__claim">{option.claim}</span>
              <span className="path__body">{option.body}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ────────────────────────────────────────────────────── 05 capabilities ── */

/**
 * A rail that opens on demand.
 *
 * The shortest section on the page, and the flattest: these are the consequence
 * of the method, not the identity of the company, so they get a rail of names
 * rather than five boxes competing with the decision above them.
 */
export function Capabilities() {
  const { capabilities } = useCopy();
  const { active, cardProps } = useActiveCard(capabilities.items.length);

  return (
    <section
      className="field field--sand capabilities"
      id="o-que-fazemos"
      aria-labelledby="capabilities-titulo"
    >
      <div className="spread">
        <p className="eyebrow" data-reveal>
          {capabilities.eyebrow}
        </p>
        <div className="spread__body">
          <h2 className="display" id="capabilities-titulo" data-reveal>
            {capabilities.title}
          </h2>
        </div>
      </div>

      <ol className="rail">
        {capabilities.items.map((item, i) => (
          <li key={item.id} data-reveal style={{ "--d": `${i * 70}ms` } as React.CSSProperties}>
            <button
              type="button"
              className="capability"
              data-on={active === i ? "true" : "false"}
              aria-expanded={active === i}
              {...cardProps(i)}
            >
              <span className="capability__label">{item.label}</span>
              <span className="capability__claim">{item.claim}</span>
              <span className="capability__body">{item.body}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── 06 philosophy ── */

/**
 * The difference, as a swap rather than a paragraph.
 *
 * The question most suppliers open with is struck through, and the one this
 * company opens with is set beneath it. Two lines carry the whole idea; the
 * sentence under them exists to say the part the swap cannot — that sometimes
 * the honest answer is to build nothing.
 *
 * The only green field on the page, and it is here because this is the one
 * claim the company would want a visitor to remember.
 */
export function Philosophy() {
  const { philosophy } = useCopy();

  return (
    <section className="field field--green philosophy" data-ink="light" aria-labelledby="philosophy-titulo">
      <div className="philosophy__column">
        <p className="eyebrow eyebrow--light" data-reveal>
          {philosophy.eyebrow}
        </p>

        <h2 className="philosophy__title" id="philosophy-titulo" data-reveal>
          {philosophy.title}
        </h2>

        <div className="swap" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
          <p className="swap__wrong">
            <s>{philosophy.wrong}</s>
          </p>
          <p className="swap__right">{philosophy.right}</p>
        </div>

        <p className="philosophy__body" data-reveal style={{ "--d": "280ms" } as React.CSSProperties}>
          {philosophy.body}
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────────────── 07 the diagnosis ── */

/**
 * The close. One action, one line under it, and the slogan — which appears here
 * and nowhere else, because it can only mean something to a visitor who has now
 * been told what the company does.
 */
export function Diagnosis() {
  const { diagnosis, actions, brand } = useCopy();

  return (
    <section className="field field--cream diagnosis" id="diagnostico" aria-labelledby="diagnosis-titulo">
      <div className="diagnosis__column">
        <p className="eyebrow" data-reveal>
          {diagnosis.eyebrow}
        </p>
        <h2 className="diagnosis__title" id="diagnosis-titulo" data-reveal>
          {diagnosis.title}
        </h2>
        <p className="prose prose--lead" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
          {diagnosis.lede}
        </p>

        <div className="actions" data-reveal style={{ "--d": "220ms" } as React.CSSProperties}>
          <a className="button button--solid" href={actions.primary.href}>
            {actions.primary.label}
          </a>
          <a className="button button--quiet" href={actions.secondary.href}>
            {actions.secondary.label}
          </a>
        </div>

        <p className="diagnosis__slogan" data-reveal style={{ "--d": "340ms" } as React.CSSProperties}>
          {brand.slogan}
        </p>
      </div>
    </section>
  );
}
