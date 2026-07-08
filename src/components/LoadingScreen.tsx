import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { Logo } from './Logo';
import { prefersReducedMotion } from '../hooks/usePrefersReducedMotion';
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
 */
export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const veilRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);
  const [skippable, setSkippable] = useState(false);
  const doneRef = useRef(false);

  useEffect(() => {
    const veil = veilRef.current;
    const overlay = overlayRef.current;
    const lockup = lockupRef.current;
    const fill = fillRef.current;
    const wordmark = wordmarkRef.current;
    if (!veil || !overlay || !lockup || !fill || !wordmark) return;

    let cancelled = false;
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      onComplete();
    };

    // Reduced motion: no draw, no pulse — a simple 0.4s fade.
    if (prefersReducedMotion()) {
      gsap.set(veil, { opacity: 0 });
      gsap.set(wordmark, { autoAlpha: 1 });
      const t = gsap.to(overlay, { autoAlpha: 0, duration: 0.4, delay: 0.6, onComplete: finish });
      return () => {
        t.kill();
      };
    }

    const paths = lockup.querySelectorAll<SVGPathElement>('.lyken-monogram-path');
    paths.forEach((p) => {
      const len = p.getTotalLength();
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
    });
    gsap.set(wordmark, { autoAlpha: 0, y: 8 });
    gsap.set(fill, { scaleX: 0 });

    const tweens: gsap.core.Tween[] = [];
    const track = (t: gsap.core.Tween) => {
      tweens.push(t);
      return t;
    };

    // 1. pure black veil dissolves into the emerald radial pulse behind it
    track(gsap.to(veil, { opacity: 0, duration: 2.6, ease: luxEase }));

    // 3. monogram draws itself in
    track(
      gsap.to(paths, {
        strokeDashoffset: 0,
        duration: 2.2,
        ease: luxEase,
        stagger: 0.18,
      }),
    );

    // 4. progress line synced to asset loading (ramps to 92%, completes on load)
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
      // 5. wordmark reveal
      await tweenAsync({ autoAlpha: 1, y: 0, duration: 0.8, ease: 'power2.out' }, wordmark);
      if (cancelled) return;
      // 6. brief pause, then the overlay alone fades — particles persist below
      await wait(0.4);
      if (cancelled) return;
      await tweenAsync({ autoAlpha: 0, duration: 1.2, ease: luxEase }, overlay);
      finish();
    })();

    const skipTimer = window.setTimeout(() => setSkippable(true), SKIP_AFTER_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(skipTimer);
      tweens.forEach((t) => t.kill());
    };
  }, [onComplete]);

  const skip = () => {
    if (doneRef.current || !skippable) return;
    doneRef.current = true;
    const overlay = overlayRef.current;
    const veil = veilRef.current;
    gsap.killTweensOf('*');
    if (veil) gsap.to(veil, { opacity: 0, duration: 0.4 });
    if (overlay) {
      gsap.to(overlay, { autoAlpha: 0, duration: 0.5, ease: 'power2.out', onComplete });
    } else {
      onComplete();
    }
  };

  return (
    <>
      {/* Boot veil sits BELOW the particle field (z: background - 1) */}
      <div ref={veilRef} className="app-bg-boot" aria-hidden="true" />

      <div
        ref={overlayRef}
        className="loading-overlay"
        role="status"
        aria-label="Lyken Agency is loading"
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
              STRATEGIC&nbsp;DESIGN&nbsp;STUDIO
              <span className="lyken-wordmark-dash" />
            </span>
          </div>
        </div>

        {skippable && (
          <button className="loading-skip u-label" onClick={skip} data-magnetic>
            Skip
          </button>
        )}
      </div>
    </>
  );
}
