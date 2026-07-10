import { useEffect, useRef, useState } from 'react';
import './AmbientAudio.css';

/**
 * Ambient loop + mute toggle, autoplay-policy safe:
 *  - starts muted (browsers always allow muted autoplay)
 *  - the first user interaction anywhere on the page unmutes and starts
 *    playback with sound
 *  - the toggle button can mute/unmute at any time afterwards
 *
 * To swap the track later: replace public/audio/ambient.mp3 — no
 * component logic needs to change.
 */
const TRACK_SRC = '/audio/ambient.mp3';

export function AmbientAudio() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.35;
    audio.play().catch(() => {}); // muted autoplay is always permitted
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && !muted) {
      audio.play().catch(() => {});
    }
  }, [muted]);

  useEffect(() => {
    const unmuteOnFirstInteraction = () => setMuted(false);
    window.addEventListener('pointerdown', unmuteOnFirstInteraction, { once: true });
    window.addEventListener('keydown', unmuteOnFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unmuteOnFirstInteraction);
      window.removeEventListener('keydown', unmuteOnFirstInteraction);
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src={TRACK_SRC} loop muted={muted} playsInline preload="auto" />
      <button
        type="button"
        className="ambient-audio-toggle"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => setMuted((m) => !m)}
        aria-pressed={!muted}
        aria-label={muted ? 'Unmute ambient sound' : 'Mute ambient sound'}
        data-magnetic
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
          {muted ? (
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
    </>
  );
}
