import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { Logo } from './Logo';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { useAmbientAudio } from './AmbientAudio';
import { useLang } from '../i18n/LanguageContext';
import './LoadingScreen.css';

gsap.registerPlugin(CustomEase);
const luxEase = CustomEase.create('lyken-lux', 'M0,0 C0.65,0 0.35,1 1,1');

const SKIP_AFTER_MS = 1500;

/** Fonts + critical assets; the progress line syncs to this. */
function loadCriticalAssets(): Promise<unknown> {
  const fonts = [
    document.fonts.load('300 1rem "Cormorant Garamond"'),
    document.fonts.load('400 1rem "Cormorant Garamond"'),
    document.fonts.load('300 1rem Satoshi').catch(() => null),
    document.fonts.ready,
  ];
  return Promise.all(fonts).catch(() => null);
}

interface LoadingScreenProps {
  onComplete: () => void;
}

/**
 * Shown once per session. The particle field and emerald background live
 * OUTSIDE this component (mounted at the app root, below it), so when the
 * overlay fades out the field continues seamlessly into the page behind it.
 *
 * ENTRY GATE: after the monogram draw settles, two explicit options appear —
 * "ENTER" (dismisses AND starts the ambient audio, wired directly to this
 * click so the browser gesture is unambiguous) and a de-emphasized
 * "ENTER WITHOUT AUDIO". There is NO auto-dismiss: the user must choose,
 * which is what makes audio consent + the gesture guarantee architectural
 * rather than a race. "Skip" fast-forwards the draw animation to the gate —
 * it no longer bypasses the gate itself.
 */
export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const { dict } = useLang();
  const { enableAudio } = useAmbientAudio();
  const veilRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const [skippable, setSkippable] = useState(false);
  const [gateVisible, setGateVisible] = useState(false);
  const gateVisibleRef = useRef(false);
  const doneRef = useRef(false);

  const showGate = () => {
    if (gateVisibleRef.current) return;
    gateVisibleRef.current = true;
    setGateVisible(true);
    setSkippable(false);
  };

  useEffect(() => {
    const veil = veilRef.current;
    const overlay = overlayRef.current;
    const lockup = lockupRef.current;
    const fill = fillRef.current;
    const wordmark = wordmarkRef.current;
    if (!veil || !overlay || !lockup || !fill || !wordmark) return;

    let cancelled = false;

    // Reduced motion: no draw, no pulse — quick fade to the gate.
    if (prefersReducedMotion()) {
      gsap.set(veil, { opacity: 0 });
      gsap.set(wordmark, { autoAlpha: 1 });
      const t = gsap.delayedCall(0.6, showGate);
      return () => {
        t.kill();
      };
    }

    // the monogram is a filled glyph: draw its outline first, fill fades in after
    const paths = lockup.querySelectorAll<SVGPathElement>('.lyken-monogram-path');
    paths.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
    });
    gsap.set(paths, { fillOpacity: 0, stroke: 'currentColor', strokeWidth: 1.4 });
    gsap.set(wordmark, { autoAlpha: 0, y: 8 });
    gsap.set(fill, { scaleX: 0 });

    const tweens: gsap.core.Tween[] = [];
    const track = (t: gsap.core.Tween) => {
      tweens.push(t);
      return t;
    };

    // 1. pure black veil dissolves into the emerald radial pulse behind it
    track(gsap.to(veil, { opacity: 0, duration: 2.6, ease: luxEase }));

    // 2. monogram draws itself in
    track(
      gsap.to(paths, {
        strokeDashoffset: 0,
        duration: 2.2,
        ease: luxEase,
        stagger: 0.18,
      }),
    );

    // 3. progress line synced to asset loading (ramps to 92%, completes on load)
    const progress = { value: 0 };
    const applyProgress = () => {
      gsap.set(fill, { scaleX: progress.value });
    };
    track(
      gsap.to(progress, {
        value: 0.92,
        duration: 2.4,
        ease: 'power1.inOut',
        onUpdate: applyProgress,
      }),
    );

    const wait = (s: number) =>
      new Promise<void>((resolve) => {
        track(gsap.delayedCall(s, resolve) as unknown as gsap.core.Tween);
      });

    const tweenAsync = (vars: Parameters<typeof gsap.to>[1], target: gsap.TweenTarget) =>
      new Promise<void>((resolve) => {
        track(gsap.to(target, { ...vars, onComplete: resolve }));
      });

    const minSequence = wait(2.4); // never complete the line before the draw settles
    const assets = loadCriticalAssets();

    (async () => {
      await Promise.all([assets, minSequence]);
      if (cancelled) return;
      await tweenAsync({ value: 1, duration: 0.3, ease: 'power2.out', onUpdate: applyProgress }, progress);
      if (cancelled) return;
      // outline hands over to the solid glyph (concurrent with the wordmark)
      track(
        gsap.to(paths, { fillOpacity: 1, strokeOpacity: 0, duration: 0.9, ease: 'power2.out' }),
      );
      // wordmark reveal, then the gate — the sequence PAUSES here until the
      // user chooses; there is intentionally no auto-dismiss.
      await tweenAsync({ autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, wordmark);
      if (cancelled) return;
      await wait(0.2);
      if (cancelled) return;
      showGate();
    })();

    const skipTimer = window.setTimeout(() => setSkippable(true), SKIP_AFTER_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(skipTimer);
      tweens.forEach((t) => t.kill());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Dismiss the gate. `withAudio` runs inside the button's click gesture. */
  const enter = (withAudio: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (withAudio) enableAudio(); // synchronous with the user gesture
    const overlay = overlayRef.current;
    const veil = veilRef.current;
    if (veil) gsap.to(veil, { opacity: 0, duration: 0.4 });
    if (overlay) {
      gsap.to(overlay, { autoAlpha: 0, duration: 0.9, ease: luxEase, onComplete });
    } else {
      onComplete();
    }
  };

  /** Fast-forward the intro animation to the gate (does NOT enter the site). */
  const skip = () => {
    if (doneRef.current || gateVisibleRef.current || !skippable) return;
    const veil = veilRef.current;
    const lockup = lockupRef.current;
    const fill = fillRef.current;
    const wordmark = wordmarkRef.current;
    gsap.killTweensOf('*');
    if (veil) gsap.set(veil, { opacity: 0 });
    if (lockup) {
      const paths = lockup.querySelectorAll<SVGPathElement>('.lyken-monogram-path');
      gsap.set(paths, { strokeDashoffset: 0, fillOpacity: 1, strokeOpacity: 0 });
    }
    if (fill) gsap.set(fill, { scaleX: 1 });
    if (wordmark) gsap.set(wordmark, { autoAlpha: 1, y: 0 });
    showGate();
  };

  return (
    <>
      {/* Boot veil sits BELOW the particle field (z: background - 1) */}
      <div ref={veilRef} className="app-bg-boot" aria-hidden="true" />

      <div
        ref={overlayRef}
        className="loading-overlay"
        role="status"
        aria-label={dict.loading.label}
        onClick={skip}
      >
        <div ref={lockupRef} className="loading-lockup lyken-logo">
          <Logo size={120} monogramOnly />

          <div className="loading-progress" aria-hidden="true">
            <div ref={fillRef} className="loading-progress-fill" />
          </div>

          <div ref={wordmarkRef} className="loading-wordmark lyken-wordmark">
            <span className="lyken-wordmark-name">LYKEN&nbsp;AGENCY</span>
            <span className="lyken-wordmark-sub u-label">
              <span className="lyken-wordmark-dash" />
              {dict.loading.tagline.replace(/ /g, ' ')}
              <span className="lyken-wordmark-dash" />
            </span>
          </div>

          {gateVisible && (
            <div className="loading-gate">
              <button
                type="button"
                className="btn-ghost loading-gate-enter"
                onClick={(e) => {
                  e.stopPropagation();
                  enter(true);
                }}
                aria-label={dict.loading.enterAria}
                data-magnetic
              >
                {dict.loading.enter}
              </button>
            </div>
          )}
        </div>

        {/* Secondary option OUTSIDE the animated gate container: the gate's
            entrance transform would otherwise become the containing block
            for this fixed-position button and pull it off bottom-center. */}
        {gateVisible && (
          <button
            type="button"
            className="loading-gate-muted u-label"
            onClick={(e) => {
              e.stopPropagation();
              enter(false);
            }}
            aria-label={dict.loading.enterMutedAria}
          >
            {dict.loading.enterMuted}
          </button>
        )}

        {skippable && !gateVisible && (
          <button
            className="loading-skip u-label"
            onClick={(e) => {
              e.stopPropagation();
              skip();
            }}
            data-magnetic
          >
            {dict.loading.skip}
          </button>
        )}
      </div>
    </>
  );
}
