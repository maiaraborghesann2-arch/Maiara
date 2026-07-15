import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLang } from '../i18n/LanguageContext';
import './AmbientAudio.css';

/**
 * Ambient audio engine + mute toggle.
 *
 * PLAYBACK PATH (no <audio> element): the Web Audio API with TWO overlapping
 * buffer sources and a gain crossfade at every loop boundary, so the restart
 * is inaudible even if the file's head/tail aren't sample-perfect. There is
 * therefore no `audio.play()` promise — the equivalent failure points
 * (context resume, file fetch, decode) each have explicit rejection handling
 * that logs the actual reason to the console (see start()), so nothing can
 * fail silently.
 *
 * GESTURE MODEL: the engine starts ONLY from explicit user actions —
 *   1. the loading screen's "ENTER" gate button (primary, wired directly to
 *      its onClick → enableAudio()), or
 *   2. the nav speaker toggle (fallback for "enter without audio" visitors
 *      and session revisits that skip the loading screen).
 * The old "first interaction anywhere on the page" window listeners are
 * intentionally REMOVED — the gate provides the unambiguous gesture now.
 *
 * PLACEHOLDER TRACK: public/audio/ambient-loop.wav is a generated royalty-free
 * lo-fi pad loop (warm e-piano chords + vinyl crackle, pre-rendered as a
 * seamless loop). Swap in the final licensed track by replacing that file —
 * any duration works, the crossfade scheduler adapts to the buffer length.
 */
const TRACK_SRC = '/audio/ambient-loop.wav';
const VOLUME = 0.32;
const CROSSFADE_S = 1.6; // overlap at each loop boundary
const FIRST_FADE_S = 0.35; // short fade-in on the very first pass (audible < 1s after ENTER)
const MUTE_RAMP_S = 0.25;

interface AmbientAudioContextValue {
  /** true only when sound is genuinely audible: engine running AND not muted */
  audible: boolean;
  /** speaker toggle: first press starts sound, afterwards mute/unmute */
  toggle: () => void;
  /** direct gesture wiring for the intro gate's ENTER button */
  enableAudio: () => void;
}

const AmbientAudioContext = createContext<AmbientAudioContextValue>({
  audible: false,
  toggle: () => {},
  enableAudio: () => {},
});

export function AmbientAudioProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false); // intent; nothing sounds until an explicit start
  // `started` flips only after the graph is live and sources are scheduled —
  // the toggle icon derives from THIS, never from intent alone.
  const [started, setStarted] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const engineRef = useRef<{
    ctx: AudioContext;
    master: GainNode;
    timer: number;
  } | null>(null);
  const startingRef = useRef(false);

  // Must be called synchronously from inside a user-gesture handler.
  const start = useCallback(async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    try {
      // Constructed synchronously inside the gesture handler so the context
      // is born inside the user-activation window (Safari included).
      const ctx = new AudioContext();
      await ctx.resume().catch((err) => {
        console.warn('[AmbientAudio] AudioContext.resume() rejected:', err);
        throw err;
      });
      if (ctx.state !== 'running') {
        console.warn('[AmbientAudio] context not running after resume():', ctx.state);
      }

      const master = ctx.createGain();
      master.gain.value = mutedRef.current ? 0 : VOLUME;
      master.connect(ctx.destination);

      const res = await fetch(TRACK_SRC);
      if (!res.ok) {
        // wrong path / missing placeholder file → loud, explicit failure
        console.warn(`[AmbientAudio] track fetch failed: ${res.status} ${res.statusText} (${TRACK_SRC})`);
        throw new Error(`fetch ${res.status}`);
      }
      const buffer = await ctx.decodeAudioData(await res.arrayBuffer()).catch((err) => {
        console.warn('[AmbientAudio] decodeAudioData failed (corrupt/unsupported file?):', err);
        throw err;
      });

      const engine = { ctx, master, timer: 0 };
      engineRef.current = engine;

      // Dual-source crossfade loop: each pass fades in over the previous
      // pass's fade-out, centered on the loop boundary. The very first pass
      // uses a short fade so sound is clearly audible well under 1s.
      const period = Math.max(1, buffer.duration - CROSSFADE_S);
      let nextStart = ctx.currentTime + 0.03;
      let firstPass = true;

      const scheduleOne = () => {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const fade = ctx.createGain();
        src.connect(fade);
        fade.connect(master);
        const t0 = nextStart;
        const fadeIn = firstPass ? FIRST_FADE_S : CROSSFADE_S;
        firstPass = false;
        fade.gain.setValueAtTime(0, t0);
        fade.gain.linearRampToValueAtTime(1, t0 + fadeIn);
        fade.gain.setValueAtTime(1, t0 + buffer.duration - CROSSFADE_S);
        fade.gain.linearRampToValueAtTime(0, t0 + buffer.duration);
        src.start(t0);
        src.stop(t0 + buffer.duration + 0.1);
        nextStart = t0 + period;
        // wake up ~2s before the next pass is due
        const delayMs = Math.max(250, (nextStart - ctx.currentTime - 2) * 1000);
        engine.timer = window.setTimeout(scheduleOne, delayMs);
      };
      scheduleOne();
      setStarted(true);
    } catch (err) {
      startingRef.current = false; // allow retry on a later gesture
      console.warn('[AmbientAudio] engine start failed:', err);
    }
  }, []);

  // Teardown only (no window gesture listeners anymore — see header comment).
  useEffect(() => {
    return () => {
      const engine = engineRef.current;
      if (engine) {
        clearTimeout(engine.timer);
        engine.ctx.close().catch(() => {});
        engineRef.current = null;
      }
    };
  }, []);

  // Apply mute state as a smooth master-gain ramp. `started` in deps: when
  // the engine comes up after an early intent change, re-sync immediately.
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const { ctx, master } = engine;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(muted ? 0 : VOLUME, ctx.currentTime + MUTE_RAMP_S);
  }, [muted, started]);

  /** Gate "ENTER" wiring: start engine with sound ON (idempotent). */
  const enableAudio = useCallback(() => {
    setMuted(false);
    start();
  }, [start]);

  const toggle = () => {
    if (!engineRef.current) {
      // First toggle press with no engine yet: this click IS the gesture —
      // start with sound on. Never flip to muted before sound has played.
      enableAudio();
      return;
    }
    setMuted((m) => !m);
  };

  return (
    <AmbientAudioContext.Provider value={{ audible: started && !muted, toggle, enableAudio }}>
      {children}
    </AmbientAudioContext.Provider>
  );
}

/** Hook for components needing direct audio control (the intro gate). */
export function useAmbientAudio(): AmbientAudioContextValue {
  return useContext(AmbientAudioContext);
}

/** Speaker button (rendered inside the NavBar) toggling the ambient loop. */
export function AudioToggle() {
  const { audible, toggle } = useContext(AmbientAudioContext);
  const { dict } = useLang();

  return (
    <button
      type="button"
      className="ambient-audio-toggle"
      onClick={toggle}
      aria-pressed={audible}
      aria-label={audible ? dict.audio.mute : dict.audio.unmute}
      data-magnetic
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
        {!audible ? (
          <path
            d="M17 8.5 22 15.5M22 8.5 17 15.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="M16.5 8.5c1.1 1.1 1.1 5.9 0 7M19 6c2.4 2.4 2.4 9.6 0 12"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            fill="none"
          />
        )}
      </svg>
    </button>
  );
}
