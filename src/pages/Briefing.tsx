import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { PageShell } from '../components/PageShell';
import { Seo } from '../components/Seo';
import { LiquidText } from '../components/LiquidText';
import { useLang } from '../i18n/LanguageContext';
import './Briefing.css';

/**
 * /briefing — the Lykos intake conversation.
 *
 * Everything AI-facing happens in /api/lykos-chat (a Vercel serverless
 * function). This component never sees an API key; it only posts the visible
 * transcript and renders what comes back.
 */

const ENDPOINT = '/api/lykos-chat';
/** Mirrors MAX_MESSAGES in api/lykos-chat.ts — the server is the real guard. */
const MAX_MESSAGES = 26;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

type SummaryFieldKey =
  | 'client_name'
  | 'company'
  | 'email'
  | 'project_type'
  | 'goals'
  | 'audience'
  | 'brand_personality'
  | 'budget'
  | 'timeline'
  | 'existing_assets'
  | 'other_context';

type BriefingSummary = Record<SummaryFieldKey, string>;

const SUMMARY_ORDER: SummaryFieldKey[] = [
  'client_name',
  'company',
  'email',
  'project_type',
  'goals',
  'audience',
  'brand_personality',
  'budget',
  'timeline',
  'existing_assets',
  'other_context',
];

/**
 * Lykos's portrait. The artwork lives at public/images/lykos-avatar.png — if it
 * is missing (or fails to load) the frame falls back to the LK monogram rather
 * than showing a broken image.
 */
function LykosAvatar({ alt, size = 44 }: { alt: string; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="lykos-avatar" style={{ width: size, height: size }}>
      {failed ? (
        <span className="lykos-avatar-fallback" aria-hidden="true">
          LK
        </span>
      ) : (
        <img
          src="/images/lykos-avatar.png"
          alt={alt}
          width={size}
          height={size}
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

export function Briefing() {
  const { dict } = useLang();
  const t = dict.briefing;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<BriefingSummary | null>(null);
  const [summaryPending, setSummaryPending] = useState(false);
  /** Bumped by "try again" so the summary effect runs a fresh attempt. */
  const [summaryAttempt, setSummaryAttempt] = useState(0);

  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  /** Guards against React 18 StrictMode double-invoking the opening turn. */
  const openedRef = useRef(false);

  /** One chat turn. `history` is the full visible transcript to send. */
  const turn = useCallback(async (history: ChatMessage[]) => {
    setPending(true);
    setError(false);
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'chat', messages: history }),
      });
      if (!res.ok) throw new Error(`chat ${res.status}`);
      const data = (await res.json()) as { reply?: string; done?: boolean };
      if (!data.reply) throw new Error('empty reply');
      setMessages([...history, { role: 'assistant', content: data.reply }]);
      if (data.done) setDone(true);
    } catch (err) {
      console.error('[briefing] chat turn failed', err);
      setError(true);
    } finally {
      setPending(false);
    }
  }, []);

  // Opening turn: Lykos introduces itself. Sent with an empty transcript —
  // the function seeds the required first user turn on the server side.
  useEffect(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    void turn([]);
  }, [turn]);

  // Once Lykos signals completion, fetch the structured summary. The same call
  // archives the briefing server-side.
  useEffect(() => {
    if (!done || summary || summaryPending) return;
    let cancelled = false;
    setSummaryPending(true);
    (async () => {
      try {
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'summary', messages }),
        });
        if (!res.ok) throw new Error(`summary ${res.status}`);
        const data = (await res.json()) as { summary?: BriefingSummary };
        if (cancelled) return;
        if (!data.summary) throw new Error('missing summary');
        setSummary(data.summary);
      } catch (err) {
        console.error('[briefing] summary failed', err);
        // The conversation itself still succeeded — say so instead of stalling
        // on a spinner. The transcript is already in the team's hands.
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setSummaryPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, summaryAttempt]);

  // Keep the newest message in view without scrolling the page itself.
  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, pending, error]);

  // Hand the caret back after each Lykos turn so answering stays keyboard-only.
  // preventScroll matters: a plain focus() scrolls the input into view, which on
  // load would yank the page past its own headline.
  useEffect(() => {
    if (!pending && !done && messages.length > 0) inputRef.current?.focus({ preventScroll: true });
  }, [pending, done, messages.length]);

  const atLimit = messages.length >= MAX_MESSAGES;
  const canSend = !pending && !done && !atLimit && draft.trim().length > 0;

  const send = (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: draft.trim() }];
    setDraft('');
    setMessages(next);
    void turn(next);
  };

  /** Retry re-sends the transcript as-is: nothing the visitor typed is lost. */
  const retry = () => {
    setError(false);
    if (done) {
      setSummaryAttempt((n) => n + 1);
      return;
    }
    void turn(messages);
  };

  const showSummaryPanel = done && (summary !== null || summaryPending);

  return (
    <PageShell className="page briefing">
      <Seo
        title="Project Briefing — Lyken Agency"
        description="Start a guided project brief with Lykos, Lyken Agency's AI intake strategist."
        path="/briefing"
      />

      {/* two columns from 1200px up (brief on the left, conversation on the
          right); stacked below, matching the Contact page's rhythm */}
      <div className="briefing-layout">
        <header className="page-head briefing-head">
          <span className="section-label">{t.label}</span>
          <h1 className="page-headline briefing-headline">
            <LiquidText as="span">{t.headline}</LiquidText>
          </h1>
          <p className="briefing-intro">{t.intro}</p>
        </header>

        <AnimatePresence mode="wait">
          {showSummaryPanel ? (
            <motion.section
              key="summary"
              className="briefing-summary"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              aria-labelledby="briefing-summary-heading"
            >
              <span className="section-label">{t.summaryLabel}</span>
              <h2 id="briefing-summary-heading" className="briefing-summary-headline">
                {t.summaryHeadline}
              </h2>

              {summary ? (
                <>
                  <p className="briefing-summary-intro">{t.summaryIntro}</p>
                  <dl className="briefing-summary-grid">
                    {SUMMARY_ORDER.map((key) => (
                      <div className="briefing-summary-row" key={key}>
                        <dt className="u-label">{t.summaryFields[key]}</dt>
                        <dd>{summary[key]}</dd>
                      </div>
                    ))}
                  </dl>
                  {/* `suggestions` is internal-facing: kept out of the client view
                      on purpose — it is archived for the team, not shown here. */}
                  <Link to="/" className="btn-ghost briefing-summary-cta" data-magnetic>
                    {t.backHome}
                  </Link>
                </>
              ) : (
                <p className="briefing-summary-intro" role="status">
                  {t.summaryPending}
                  <span className="briefing-dots" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                </p>
              )}
            </motion.section>
          ) : (
            <motion.section
              key="chat"
              className="briefing-chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{ duration: 0.5 }}
              aria-label={t.logLabel}
            >
              <header className="briefing-chat-head">
                <LykosAvatar alt={t.avatarAlt} />
                <span className="briefing-chat-titles">
                  <strong>{t.withLykos}</strong>
                  <span className="u-label briefing-chat-role">{t.role}</span>
                </span>
              </header>

              <div
                className="briefing-log"
                ref={logRef}
                role="log"
                aria-live="polite"
                aria-atomic="false"
                /* internal scroll container: keep the wheel here, not on Lenis */
                data-lenis-prevent
                tabIndex={0}
              >
                {messages.map((m, i) => (
                  <div className={`briefing-msg briefing-msg-${m.role}`} key={`${m.role}-${i}`}>
                    {m.role === 'assistant' && <LykosAvatar alt={t.avatarAlt} size={28} />}
                    <p className="briefing-bubble">{m.content}</p>
                  </div>
                ))}

                {pending && (
                  <div className="briefing-msg briefing-msg-assistant">
                    <LykosAvatar alt={t.avatarAlt} size={28} />
                    <p className="briefing-bubble briefing-bubble-typing">
                      <span className="u-visually-hidden">{t.thinking}</span>
                      <span className="briefing-dots" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                      </span>
                    </p>
                  </div>
                )}

                {error && (
                  <div className="briefing-error" role="alert">
                    <p>{t.error}</p>
                    <button type="button" className="briefing-retry" onClick={retry}>
                      {t.retry}
                    </button>
                  </div>
                )}
              </div>

              <form className="briefing-composer" onSubmit={send}>
                <label className="u-visually-hidden" htmlFor="briefing-input">
                  {t.inputLabel}
                </label>
                <input
                  id="briefing-input"
                  ref={inputRef}
                  className="briefing-input"
                  type="text"
                  autoComplete="off"
                  placeholder={t.placeholder}
                  value={draft}
                  disabled={pending || done}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" className="briefing-send" disabled={!canSend}>
                  {t.send}
                </button>
              </form>
            </motion.section>
            )}
        </AnimatePresence>
      </div>
    </PageShell>
  );
}
