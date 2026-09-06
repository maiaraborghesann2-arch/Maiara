/**
 * The three states of the problem, drawn from one vocabulary.
 *
 * The point of this file is that there is only ONE set of nodes. All three
 * diagrams place them at the same coordinates, at the same radii, in the same
 * hand — what changes between the states is which of them are present and what
 * runs between them. That is what makes the section read as an evolution
 * instead of three unrelated illustrations: the eye recognises the same system
 * in each frame and sees only the relationships accumulate.
 *
 * THE NODE. A ring and a dot inside it, not a plain circle. The ring is the
 * boundary of a system and the dot is what it holds, which gives the mark a
 * grammar — an empty ring means a system with nothing in it, an offset ghost
 * ring means the same contents in two places. A bare circle can say none of
 * that.
 *
 * THE SCALE. Three sizes, and they are the hierarchy: one primary system, two
 * secondary, two peripheral. The composition is asymmetric on purpose — a row
 * of equal circles reads as an icon, and an unequal arrangement with real
 * negative space reads as a diagram of something.
 *
 * THE PROGRESSION.
 *   disconnected — three systems, nothing between them. The distances are the
 *                  argument, so nothing is drawn in them.
 *   fragmented   — a fourth system, a *duplicate* of the primary offset behind
 *                  it, and tentative dashed links that set out and do not
 *                  resolve. The duplicate is the section's actual claim: the
 *                  same information now exists twice.
 *   complex      — every node present, weighted links, and one route that has
 *                  to turn a corner to arrive where a straight line would have
 *                  gone. That elbow is the picture of a process bending around
 *                  what the software allows.
 *
 * Everything is stroked in `currentColor` at fractional widths, so the diagram
 * inherits the ink of whatever ground it sits on and stays in the same
 * hairline the rest of the page rules with.
 */

import type { ProblemStateId } from "@/lib/site/copy";

/** The canonical systems. Every state draws from this one table. */
const NODES = {
  a: { x: 30, y: 64, r: 6 },
  b: { x: 62, y: 30, r: 9.5 },
  c: { x: 106, y: 56, r: 7 },
  d: { x: 140, y: 26, r: 4.5 },
  e: { x: 92, y: 88, r: 4 },
} as const;

type NodeKey = keyof typeof NODES;

function Node({ k, ghost = false, empty = false }: { k: NodeKey; ghost?: boolean; empty?: boolean }) {
  const n = NODES[k];
  return (
    <g className={ghost ? "sd__node sd__node--ghost" : "sd__node"}>
      <circle cx={n.x} cy={n.y} r={n.r} />
      {empty ? null : <circle className="sd__core" cx={n.x} cy={n.y} r={1.6} />}
    </g>
  );
}

/**
 * A link between two systems, drawn edge to edge rather than centre to centre —
 * a line that disappears under a ring reads as a wire behind a shape; a line
 * that stops at the boundary reads as a connection between two things.
 *
 * `pathLength={1}` normalises a path so one dash the length of the whole line
 * can draw it — that is how the solid links reveal themselves.
 *
 * It is deliberately NOT set on the dashed ones. `pathLength` rescales the
 * coordinate system for *all* dash arithmetic, so with it a `stroke-dasharray`
 * of 2.5 means two and a half times the entire line and the pattern collapses
 * into one unbroken dash. The tentative links rendered perfectly solid — the
 * opposite of what that state claims — and the computed style still read
 * "2.5px, 3.5px", so only the pixels showed it.
 */
function Link({
  from,
  to,
  weight = "soft",
  dashed = false,
  short = 0,
  order = 0,
}: {
  from: NodeKey;
  to: NodeKey;
  weight?: "soft" | "firm";
  dashed?: boolean;
  /** Stop this far short of the target — for links that set out and give up. */
  short?: number;
  order?: number;
}) {
  const a = NODES[from];
  const b = NODES[to];
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const x1 = a.x + ux * (a.r + 3);
  const y1 = a.y + uy * (a.r + 3);
  const x2 = b.x - ux * (b.r + 3 + short);
  const y2 = b.y - uy * (b.r + 3 + short);

  return (
    <line
      className={`sd__link sd__link--${weight}${dashed ? " sd__link--dashed" : ""}`}
      style={{ "--o": order } as React.CSSProperties}
      pathLength={dashed ? undefined : 1}
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
    />
  );
}

/** The detour: a route that cannot go straight, so it turns a corner. */
function Elbow({ order = 0 }: { order?: number }) {
  const a = NODES.a;
  const c = NODES.c;
  return (
    <polyline
      className="sd__link sd__link--firm"
      style={{ "--o": order } as React.CSSProperties}
      pathLength={1}
      points={`${a.x + a.r + 3},${a.y} ${a.x + 34},${a.y} ${a.x + 34},${c.y + 18} ${c.x},${c.y + c.r + 3}`}
    />
  );
}

export function SystemDiagram({ level }: { level: ProblemStateId }) {
  return (
    /*
     * The box is tight around the node table rather than round, and it is the
     * SAME box in all three states — which is the whole reason the field holds
     * still while the relationships change. An earlier version left `d` out of
     * the first state, and the three diagrams then had visibly different
     * widths: the eye read three pictures instead of one system three times.
     */
    <svg className="sd" viewBox="18 13 136 88" aria-hidden="true">
      {level === "fragmented" || level === "complex" ? (
        <>
          {/* The duplicate: the same system, offset, holding the same thing.
              This is the section's claim rather than an ornament. */}
          <g className="sd__ghost-wrap">
            <circle className="sd__ghost" cx={NODES.b.x + 7} cy={NODES.b.y + 6} r={NODES.b.r} />
          </g>
        </>
      ) : null}

      {level === "complex" ? <Elbow order={5} /> : null}

      {level === "fragmented" ? (
        <>
          <Link from="a" to="b" dashed short={7} order={0} />
          <Link from="b" to="c" dashed short={9} order={1} />
          <Link from="c" to="d" dashed short={5} order={2} />
        </>
      ) : null}

      {level === "complex" ? (
        <>
          <Link from="a" to="b" weight="firm" order={0} />
          <Link from="b" to="c" weight="firm" order={1} />
          <Link from="c" to="d" order={2} />
          <Link from="b" to="e" order={3} />
          <Link from="e" to="c" order={4} />
          <Link from="a" to="e" order={6} />
        </>
      ) : null}

      {/*
        Four systems in every state. They exist before anyone connects them, so
        they are drawn in all three and only the lines between them accumulate.
        `d` is an empty ring — a system holding nothing of its own — which is
        what keeps it legible as peripheral without shrinking it out of the
        composition.
      */}
      <Node k="a" />
      <Node k="b" />
      <Node k="c" />
      <Node k="d" empty />
      {/* The fifth appears only in the last state, because it is the extra hop
          the process was forced through. */}
      {level === "complex" ? <Node k="e" /> : null}
    </svg>
  );
}
