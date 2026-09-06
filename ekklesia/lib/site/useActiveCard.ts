"use client";

import { useCallback, useState } from "react";

/**
 * The interaction behind every card system on the page.
 *
 * Three rules, and they exist because hover alone is not an interaction — it is
 * an interaction that excludes touch and the keyboard:
 *
 *   • pointing at a card opens it, but only for a real mouse. A touch reports
 *     `pointerenter` immediately before its `click`, so honouring hover on
 *     touch makes the first tap open and the second tap close something the
 *     visitor never saw open.
 *   • focusing a card opens it, so the whole system works from the keyboard.
 *   • clicking pins it, so it stays open when the pointer leaves — and clicking
 *     the pinned card again releases it.
 *
 * A pin outranks a hover, which is what stops the two mechanisms fighting: once
 * something is deliberately open, moving the mouse across its neighbours cannot
 * take it away.
 *
 * `mode: "select"` keeps exactly one card open at all times — right for a
 * sequence, where "none of the five stages" is not a meaningful state.
 * `mode: "disclose"` allows nothing open, which is right where the closed state
 * is the composition and opening is exploration.
 */
export type CardMode = "select" | "disclose";

export function useActiveCard(count: number, mode: CardMode = "disclose") {
  const [pinned, setPinned] = useState<number | null>(mode === "select" ? 0 : null);
  const [hovered, setHovered] = useState<number | null>(null);

  const active = hovered ?? pinned;

  const enter = useCallback((i: number, pointerType: string) => {
    if (pointerType !== "mouse") return;
    setHovered(i);
  }, []);

  const leave = useCallback(() => setHovered(null), []);

  const select = useCallback(
    (i: number) => {
      setHovered(null);
      setPinned((current) => {
        // In a selection there is always one; re-clicking it changes nothing.
        if (mode === "select") return i;
        return current === i ? null : i;
      });
    },
    [mode],
  );

  const focus = useCallback((i: number) => setHovered(i), []);

  /** Props for the card's own button. Spread and forget. */
  const cardProps = useCallback(
    (i: number) => ({
      onPointerEnter: (e: React.PointerEvent) => enter(i, e.pointerType),
      onPointerLeave: leave,
      onFocus: () => focus(i),
      onBlur: leave,
      onClick: () => select(i),
    }),
    [enter, leave, focus, select],
  );

  return { active, count, mode, cardProps } as const;
}
