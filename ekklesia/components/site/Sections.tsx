"use client";

import {
  ACTIONS,
  APPROACH,
  CAPABILITIES,
  DIAGNOSIS,
  PATHS,
  PHILOSOPHY,
  PROBLEM,
} from "@/lib/site/content";
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
 * Three states of the same trouble, each carrying its own mark.
 *
 * The marks are the argument and the copy is the caption: one element alone,
 * then elements that never meet, then elements that meet too many times. Drawn
 * in SVG from the same hairline the rest of the page rules with, so they read
 * as diagrams in the page's own hand rather than as illustrations dropped into
 * it.
 */
function ProblemMark({ state }: { state: string }) {
  const line = { stroke: "currentColor", strokeWidth: 1, fill: "none" } as const;
  return (
    <svg className="state__mark" viewBox="0 0 120 80" aria-hidden="true">
      {state === "desconectado" ? (
        <>
          <circle cx="26" cy="40" r="9" {...line} />
          <circle cx="60" cy="26" r="9" {...line} />
          <circle cx="94" cy="52" r="9" {...line} />
        </>
      ) : state === "fragmentado" ? (
        <>
          <circle cx="26" cy="40" r="9" {...line} />
          <circle cx="60" cy="26" r="9" {...line} />
          <circle cx="94" cy="52" r="9" {...line} />
          {/* Lines that set out toward each other and stop short. */}
          <path d="M35 37 L48 31" {...line} strokeDasharray="4 5" />
          <path d="M69 30 L84 46" {...line} strokeDasharray="4 5" />
          <path d="M33 46 L82 56" {...line} strokeDasharray="4 5" />
        </>
      ) : (
        <>
          <circle cx="26" cy="40" r="9" {...line} />
          <circle cx="60" cy="26" r="9" {...line} />
          <circle cx="94" cy="52" r="9" {...line} />
          <circle cx="60" cy="62" r="9" {...line} />
          <path d="M35 37 L51 28" {...line} />
          <path d="M69 30 L85 46" {...line} />
          <path d="M33 45 L52 59" {...line} />
          <path d="M69 60 L86 56" {...line} />
          <path d="M60 35 L60 53" {...line} />
          <path d="M34 44 L86 49" {...line} />
        </>
      )}
    </svg>
  );
}

export function Problem() {
  const { active, cardProps } = useActiveCard(PROBLEM.states.length);

  return (
    <section className="field field--cream problem" id="problema" aria-labelledby="problem-titulo">
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

      <ol className="states">
        {PROBLEM.states.map((state, i) => (
          <li key={state.id} data-reveal style={{ "--d": `${i * 110}ms` } as React.CSSProperties}>
            <button
              type="button"
              className="state"
              data-on={active === i ? "true" : "false"}
              aria-expanded={active === i}
              {...cardProps(i)}
            >
              <ProblemMark state={state.id} />
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
  const { active, cardProps } = useActiveCard(APPROACH.stages.length, "select");

  return (
    <section
      className="field field--earth approach"
      id="abordagem"
      data-ink="light"
      aria-labelledby="approach-titulo"
    >
      <div className="spread">
        <p className="eyebrow eyebrow--light" data-reveal>
          {APPROACH.eyebrow}
        </p>
        <div className="spread__body">
          <h2 className="display" id="approach-titulo" data-reveal>
            {APPROACH.title}
          </h2>
        </div>
      </div>

      <ol className="stages" data-reveal>
        {APPROACH.stages.map((stage, i) => (
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
  const { active, cardProps } = useActiveCard(PATHS.options.length);

  return (
    <section className="field field--cream paths" id="caminho" aria-labelledby="paths-question">
      <div className="paths__head">
        <p className="eyebrow" data-reveal>
          {PATHS.eyebrow}
        </p>
        <h2 className="paths__question" id="paths-question" data-reveal>
          {PATHS.question}
        </h2>
        <p className="prose prose--lead" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
          {PATHS.lede}
        </p>
      </div>

      <ol className="paths__grid">
        {PATHS.options.map((option, i) => (
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
  const { active, cardProps } = useActiveCard(CAPABILITIES.items.length);

  return (
    <section
      className="field field--sand capabilities"
      id="o-que-fazemos"
      aria-labelledby="capabilities-titulo"
    >
      <div className="spread">
        <p className="eyebrow" data-reveal>
          {CAPABILITIES.eyebrow}
        </p>
        <div className="spread__body">
          <h2 className="display" id="capabilities-titulo" data-reveal>
            {CAPABILITIES.title}
          </h2>
        </div>
      </div>

      <ol className="rail">
        {CAPABILITIES.items.map((item, i) => (
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
  return (
    <section className="field field--green philosophy" data-ink="light" aria-labelledby="philosophy-titulo">
      <div className="philosophy__column">
        <p className="eyebrow eyebrow--light" data-reveal>
          {PHILOSOPHY.eyebrow}
        </p>

        <h2 className="philosophy__title" id="philosophy-titulo" data-reveal>
          {PHILOSOPHY.title}
        </h2>

        <div className="swap" data-reveal style={{ "--d": "160ms" } as React.CSSProperties}>
          <p className="swap__wrong">
            <s>{PHILOSOPHY.wrong}</s>
          </p>
          <p className="swap__right">{PHILOSOPHY.right}</p>
        </div>

        <p className="philosophy__body" data-reveal style={{ "--d": "280ms" } as React.CSSProperties}>
          {PHILOSOPHY.body}
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
  return (
    <section className="field field--cream diagnosis" id="diagnostico" aria-labelledby="diagnosis-titulo">
      <div className="diagnosis__column">
        <p className="eyebrow" data-reveal>
          {DIAGNOSIS.eyebrow}
        </p>
        <h2 className="diagnosis__title" id="diagnosis-titulo" data-reveal>
          {DIAGNOSIS.title}
        </h2>
        <p className="prose prose--lead" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
          {DIAGNOSIS.lede}
        </p>

        <div className="actions" data-reveal style={{ "--d": "220ms" } as React.CSSProperties}>
          <a className="button button--solid" href={ACTIONS.primary.href}>
            {ACTIONS.primary.label}
          </a>
          <a className="button button--quiet" href={ACTIONS.secondary.href}>
            {ACTIONS.secondary.label}
          </a>
        </div>

        <p className="diagnosis__slogan" data-reveal style={{ "--d": "340ms" } as React.CSSProperties}>
          {DIAGNOSIS.slogan}
        </p>
      </div>
    </section>
  );
}
