import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useLang } from '../i18n/LanguageContext';
import './AmbientAudio.css';

/**
 * Ambient audio engine + mute toggle, autoplay-policy safe.
 *
 * Playback uses the Web Audio API with TWO overlapping buffer sources and a
 * gain crossfade at every loop boundary, so the restart is inaudible even if
 * the underlying file's head/tail aren't sample-perfect. Nothing is audible
 * until the user's first interaction (pointer/key) — browsers require a
 * gesture before an AudioContext may produce sound, and we only build the
 * graph inside that first gesture.
 *
 * PLACEHOLDER TRACK: public/audio/ambient-loop.wav is a generated royalty-free
 * lo-fi pad loop (warm e-piano chords + vinyl crackle, pre-rendered as a
 * seamless loop). Swap in the final licensed track by replacing that file —
 * any duration works, the crossfade scheduler adapts to the buffer length.
 */
const TRACK_SRC = '/audio/ambient-loop.wav';
const VOLUME = 0.32;
const CROSSFADE_S = 1.6; // overlap at the loop boundary
const MUTE_RAMP_S = 0.25;

interface AmbientAudioContextValue {
  /** true only when sound is genuinely audible: engine running AND not muted */
  audible: boolean;
  toggle: () => void;
}

const AmbientAudioContext = createContext<AmbientAudioContextValue>({
  audible: false,
  toggle: () => {},
});

export function AmbientAudioProvider({ children }: { children: ReactNode }) {
  const [muted, setMuted] = useState(false); // intent; silent until first gesture regardless
  // `started` flips only after the graph is live and sources are scheduled —
  // the toggle icon derives from THIS, never from intent alone. (Previous
  // bug: the icon showed "sound on" from bare React state while no engine
  // existed yet, and the toggle's own first click started the engine AND
  // flipped to muted simultaneously — forcing a mute/unmute cycle.)
  const [started, setStarted] = useState(false);
  const mutedRef = useRef(muted);
  mutedRef.current = muted;

  const engineRef = useRef<{
    ctx: AudioContext;
    master: GainNode;
    timer: number;
  } | null>(null);
  const startingRef = useRef(false);
  const startRef = useRef<() => void>(() => {});

  // Build the audio graph inside the first user gesture (autoplay-safe).
  useEffect(() => {
    const start = async () => {
      if (startingRef.current) return;
      startingRef.current = true;
      try {
        // Constructed synchronously inside the gesture handler: the context
        // is born inside the user-activation window, so resume() resolves
        // even in Safari. Everything after (fetch/decode) may run past the
        // gesture window — that's fine for Web Audio once resumed.
        const ctx = new AudioContext();
        await ctx.resume();
        const master = ctx.createGain();
        master.gain.value = mutedRef.current ? 0 : VOLUME;
        master.connect(ctx.destination);

        const res = await fetch(TRACK_SRC);
        const buffer = await ctx.decodeAudioData(await res.arrayBuffer());

        const engine = { ctx, master, timer: 0 };
        engineRef.current = engine;

        // Dual-source crossfade loop: each pass fades in over the previous
        // pass's fade-out, centered on the loop boundary.
        const period = Math.max(1, buffer.duration - CROSSFADE_S);
        let nextStart = ctx.currentTime + 0.05;

        const scheduleOne = () => {
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          const fade = ctx.createGain();
          src.connect(fade);
          fade.connect(master);
          const t0 = nextStart;
          fade.gain.setValueAtTime(0, t0);
          fade.gain.linearRampToValueAtTime(1, t0 + CROSSFADE_S);
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
        if (import.meta.env.DEV) {
          // dev-only: surfaces autoplay/decode failures without debugging by ear
          console.warn('[AmbientAudio] engine start failed:', err);
        }
      }
    };
    startRef.current = start;

    // Browser-recognized activation gestures ONLY (never mousemove — motion
    // is not a gesture and will not unlock audio in any browser). The set
    // covers engine differences: Chrome/Firefox honor pointerdown/keydown,
    // Safari is most reliable on touchend/click. start() is idempotent, so
    // whichever fires first wins. These can fire as early as the loading
    // intro — that's fine, it's still a real user gesture.
    const GESTURES = ['pointerdown', 'touchend', 'keydown', 'click'] as const;
    GESTURES.forEach((ev) => window.addEventListener(ev, start, { once: true, passive: true }));
    return () => {
      GESTURES.forEach((ev) => window.removeEventListener(ev, start));
      const engine = engineRef.current;
      if (engine) {
        clearTimeout(engine.timer);
        engine.ctx.close().catch(() => {});
        engineRef.current = null;
      }
    };
  }, []);

  // Apply mute state as a smooth master-gain ramp (never leaves the gain
  // stranded at 0: the ramp always targets the explicit VOLUME level).
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const { ctx, master } = engine;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(muted ? 0 : VOLUME, ctx.currentTime + MUTE_RAMP_S);
    // `started` in deps: when the engine comes up AFTER an early mute click,
    // this re-syncs the real gain to the latest intent immediately.
  }, [muted, started]);

  const toggle = () => {
    if (!engineRef.current) {
      // First toggle press with no engine yet: this click IS the qualifying
      // gesture — start the engine and make sure intent is "sound on".
      // (The window-level gesture listener races us harmlessly; start() is
      // idempotent.) Never flip to muted before sound has ever played.
      setMuted(false);
      startRef.current();
      return;
    }
    setMuted((m) => !m);
  };

  return (
    <AmbientAudioContext.Provider value={{ audible: started && !muted, toggle }}>
      {children}
    </AmbientAudioContext.Provider>
  );
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
