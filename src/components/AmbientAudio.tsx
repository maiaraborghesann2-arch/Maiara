import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import gsap from 'gsap';
import './AmbientAudio.css';

/**
 * Global looping ambient pad. Muted by default (browser autoplay policy);
 * the user's FIRST interaction anywhere starts playback with a gentle
 * fade-in — unless they previously muted it (preference in localStorage).
 *
 * PLACEHOLDER TRACK: /public/audio/ambient-loop.wav is a generated,
 * royalty-free seamless drone. Leonardo: swap in the final licensed track
 * at the same path (or update AUDIO_SRC below).
 */
const AUDIO_SRC = '/audio/ambient-loop.wav';
const PREF_KEY = 'lyken:audio'; // 'on' | 'muted'
const TARGET_VOLUME = 0.22;

interface AudioCtx {
  muted: boolean;
  toggle: () => void;
}

const Ctx = createContext<AudioCtx>({ muted: true, toggle: () => {} });

export function useAmbientAudio() {
  return useContext(Ctx);
}

export function AmbientAudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(() => localStorage.getItem(PREF_KEY) === 'muted');
  const startedRef = useRef(false);

  const fadeTo = useCallback((vol: number) => {
    const el = audioRef.current;
    if (!el) return;
    gsap.killTweensOf(el);
    gsap.to(el, { volume: vol, duration: 1.6, ease: 'power1.inOut' });
  }, []);

  // first user interaction anywhere starts the loop (fading in unless muted)
  useEffect(() => {
    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const el = audioRef.current;
      if (!el) return;
      el.volume = 0;
      el.play()
        .then(() => {
          if (localStorage.getItem(PREF_KEY) !== 'muted') fadeTo(TARGET_VOLUME);
        })
        .catch(() => {
          startedRef.current = false; // retry on the next gesture
        });
    };
    window.addEventListener('pointerdown', start, { passive: true });
    window.addEventListener('keydown', start);
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
  }, [fadeTo]);

  const toggle = useCallback(() => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(PREF_KEY, next ? 'muted' : 'on');
    const el = audioRef.current;
    if (!el) return;
    if (next) {
      fadeTo(0);
    } else {
      if (el.paused) {
        startedRef.current = true;
        el.volume = 0;
        el.play().catch(() => {});
      }
      fadeTo(TARGET_VOLUME);
    }
  }, [muted, fadeTo]);

  return (
    <Ctx.Provider value={{ muted, toggle }}>
      <audio ref={audioRef} src={AUDIO_SRC} loop preload="auto" />
      {children}
    </Ctx.Provider>
  );
}

/** Minimal speaker toggle — lives in the NavBar, persists across routes. */
export function AudioToggle() {
  const { muted, toggle } = useAmbientAudio();
  return (
    <button
      className="audio-toggle"
      onClick={toggle}
      aria-label={muted ? 'Unmute ambient sound' : 'Mute ambient sound'}
      aria-pressed={!muted}
      data-magnetic
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 9.5v5h3.5L13 19V5L7.5 9.5H4Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {muted ? (
          <path d="M16.5 9.5 21 14.5M21 9.5l-4.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        ) : (
          <>
            <path d="M16 9.4a4 4 0 0 1 0 5.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M18.6 7a7.5 7.5 0 0 1 0 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}
      </svg>
    </button>
  );
}
