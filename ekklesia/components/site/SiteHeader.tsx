"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { Mark } from "@/components/brand/Mark";
import { LanguageSwitch } from "@/components/site/LanguageSwitch";
import { useCopy } from "@/lib/site/locale";

/**
 * The header.
 *
 * It is fixed, but it is not a bar: no background, no border, no shadow, and
 * nothing behind it until it is needed. During the opening it sits over the
 * film as two small marks in the corners, which is what the storyboard shows —
 * the brand at the left, one control at the right, and the picture uncovered
 * between them.
 *
 * The one concession to legibility is that it inverts over the dark sections.
 * The header is `position: fixed` and a sibling of the sections, so it cannot
 * inherit anything from them — instead an IntersectionObserver watches the
 * sections marked `data-ink="light"` against a thin strip at the top of the
 * viewport, which is the only part of the page the header actually covers. No
 * scroll listener, no measuring per frame: the browser reports the two or three
 * crossings that happen in a whole visit.
 *
 * The menu is one panel for every breakpoint. A five-item nav does not need a
 * horizontal arrangement on desktop and a drawer on mobile; it needs one quiet
 * list that behaves the same everywhere, which is also one set of focus rules
 * to get right instead of two.
 */
export function SiteHeader() {
  const { brand, nav, ui } = useCopy();
  const [open, setOpen] = useState(false);
  const [light, setLight] = useState(false);
  const [veiled, setVeiled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  /*
   * Invert over the dark sections. The root is shrunk from the bottom to a
   * band the height of the header, so a section counts as "under the header"
   * only while it is actually behind it.
   */
  useEffect(() => {
    const dark = document.querySelectorAll<HTMLElement>('[data-ink="light"]');
    if (dark.length === 0 || typeof IntersectionObserver === "undefined") return;

    // The strip the header actually covers: the top `BAND` pixels. Expressed as
    // a negative bottom margin, because `rootMargin` has no way to say "the
    // viewport height minus a fixed number" in a single value.
    const BAND = 76;
    let covering = 0;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) covering += entry.isIntersecting ? 1 : -1;
        setLight(covering > 0);
      },
      { rootMargin: `0px 0px -${Math.max(0, window.innerHeight - BAND)}px 0px`, threshold: 0 },
    );

    for (const el of dark) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /*
   * Over the film the header needs nothing behind it — the frame is dim at the
   * edges and the two marks read cleanly. Over the content it does: a fixed
   * element with no ground will sooner or later have a line of type slide
   * underneath it, and "sooner or later" is not a standard.
   *
   * So a veil, but only past the opening, and only just enough: the page's own
   * colour fading out over the header's height. No blur, no border, no card —
   * it reads as the light at the top of the page getting slightly stronger,
   * which is the same instrument the film's own hand-over uses.
   */
  useEffect(() => {
    const track = document.querySelector("[data-cinematic-track]");
    if (!track || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => setVeiled(!entry.isIntersecting),
      { rootMargin: "0px 0px -100% 0px", threshold: 0 },
    );
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  /*
   * Out of the way while reading down, back on the way up.
   *
   * A fixed header over a long page will always end up with a line of type
   * underneath it; a veil softens that but cannot prevent it. Getting out of
   * the way does, and it is also the quieter behaviour — the brand is present
   * when you look for it and absent while you are reading.
   *
   * One passive listener, one boolean, and the reading is deferred to a frame,
   * so it never forces layout during the scroll itself. This does not touch the
   * opening's scroll system: it observes `scrollY` and writes nothing back.
   */
  useEffect(() => {
    let last = window.scrollY;
    let queued = false;

    const read = () => {
      queued = false;
      const y = window.scrollY;
      const delta = y - last;
      // A dead zone, so a trackpad's jitter around a standstill does not make
      // the header flicker in and out.
      if (Math.abs(delta) > 6) {
        setHidden(delta > 0 && y > window.innerHeight);
        last = y;
      }
    };

    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(read);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    toggle.current?.focus();
  }, []);

  /*
   * While the panel is open it is the only thing on the page: Escape closes it,
   * Tab cycles inside it, and the document behind it does not scroll. Returning
   * focus to the button on close is what makes it usable without a mouse —
   * without it, focus falls back to the top of the document and the reader
   * loses their place.
   */
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = panel.current?.querySelectorAll<HTMLElement>("a[href], button");
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    panel.current?.querySelector<HTMLElement>("a[href]")?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, close]);

  return (
    <>
      {/* Every keyboard visit starts five hundred viewport-heights above the
          content. This is the way past it. */}
      <a className="skip" href="#conteudo">
        {ui.skip}
      </a>

      <header className="site-header" data-light={light && !open ? "true" : "false"}
        data-veiled={veiled && !open ? "true" : "false"}
        data-hidden={hidden && !open ? "true" : "false"}>
        <a className="site-header__brand" href="#inicio" aria-label={`${brand.name} ${brand.suffix} — ${ui.home}`}>
          <Mark size={26} />
          <span className="site-header__word">
            <strong>{brand.name}</strong>
            <em>{brand.suffix}</em>
          </span>
        </a>

        <div className="site-header__controls">
          <LanguageSwitch />

          <button
          ref={toggle}
          type="button"
          className="site-header__menu"
          aria-expanded={open}
          aria-controls="menu-principal"
          onClick={() => setOpen((was) => !was)}
        >
          <span className="site-header__menu-label">{open ? ui.close : ui.menu}</span>
          <span className="site-header__menu-icon" data-open={open} aria-hidden="true">
            <span />
            <span />
          </span>
          </button>
        </div>
      </header>

      <div
        ref={panel}
        id="menu-principal"
        className="menu"
        data-open={open}
        // Hidden from assistive technology *and* from the tab order while shut,
        // which `aria-hidden` alone would not do.
        inert={!open}
      >
        <nav className="menu__nav" aria-label={ui.nav}>
          <ul>
            {nav.map((item, i) => (
              <li key={item.href} style={{ "--i": i } as React.CSSProperties}>
                <a href={item.href} onClick={close}>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {/* The descriptor, not the slogan. Someone opening the menu may still
            not know what the company does; a slogan would not tell them. */}
        <p className="menu__note">{brand.descriptor}</p>
      </div>
    </>
  );
}
