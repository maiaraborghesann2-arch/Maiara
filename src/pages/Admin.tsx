import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Helmet } from 'react-helmet-async';
import { PageShell } from '../components/PageShell';
import './Admin.css';

/**
 * /admin — internal briefing archive.
 *
 * Deliberately plain: clarity over polish. This is a working tool for the
 * agency, not marketing surface.
 *
 * Auth is a single shared password (ADMIN_PASSWORD, server-side only) exchanged
 * for an httpOnly session cookie by /api/admin-login. Because the site is a
 * static SPA there is no server render to gate, so the guard lives on
 * /api/admin-briefings: without a valid cookie it answers 401 and this page
 * shows the login form. No briefing data ever reaches an unauthenticated
 * browser.
 */

interface BriefingSummary {
  client_name: string;
  company: string;
  email: string;
  project_type: string;
  goals: string;
  audience: string;
  brand_personality: string;
  budget: string;
  timeline: string;
  existing_assets: string;
  other_context: string;
}

interface BriefingRecord {
  id: string;
  created_at: string;
  summary: BriefingSummary;
  suggestions: string;
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>;
}

const FIELD_LABELS: Array<[keyof BriefingSummary, string]> = [
  ['client_name', 'Name'],
  ['company', 'Company'],
  ['email', 'Email'],
  ['project_type', 'Project type'],
  ['goals', 'Goals'],
  ['audience', 'Audience'],
  ['brand_personality', 'Brand personality'],
  ['budget', 'Budget'],
  ['timeline', 'Timeline'],
  ['existing_assets', 'Existing assets'],
  ['other_context', 'Other context'],
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null); // null = probing
  const [configured, setConfigured] = useState(true);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [briefings, setBriefings] = useState<BriefingRecord[]>([]);
  const [storeReady, setStoreReady] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  // Session probe — avoids flashing the login form on an already-signed-in tab.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin-login');
        const data = (await res.json()) as { authenticated?: boolean; configured?: boolean };
        if (cancelled) return;
        setAuthed(Boolean(data.authenticated));
        setConfigured(data.configured !== false);
      } catch {
        if (!cancelled) setAuthed(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin-briefings');
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (!res.ok) throw new Error(`briefings ${res.status}`);
      const data = (await res.json()) as { briefings?: BriefingRecord[]; storeReady?: boolean };
      setBriefings(data.briefings ?? []);
      setStoreReady(data.storeReady !== false);
    } catch (err) {
      console.error('[admin] failed to load briefings', err);
      setLoadError('Could not load briefings. Check the KV connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) void load();
  }, [authed, load]);

  const signIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setPassword('');
        setAuthed(true);
        return;
      }
      if (res.status === 503) {
        setConfigured(false);
        setLoginError('ADMIN_PASSWORD is not set on the server.');
        return;
      }
      setLoginError('Incorrect password.');
    } catch (err) {
      console.error('[admin] sign-in failed', err);
      setLoginError('Network error — try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch (err) {
      console.error('[admin] sign-out failed', err);
    }
    setBriefings([]);
    setAuthed(false);
  };

  return (
    <PageShell className="page admin">
      <Helmet>
        <title>Briefing Archive — Lyken Agency</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <header className="admin-head">
        <h1 className="admin-title">Briefing Archive</h1>
        {authed && (
          <div className="admin-head-actions">
            <button type="button" className="admin-btn" onClick={() => void load()}>
              Refresh
            </button>
            <button type="button" className="admin-btn" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        )}
      </header>

      {authed === null && <p className="admin-note">Checking session…</p>}

      {authed === false && (
        <form className="admin-login" onSubmit={signIn}>
          <label className="admin-label" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            className="admin-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={!configured}
          />
          <button className="admin-btn admin-btn-primary" type="submit" disabled={submitting || !configured}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
          {loginError && (
            <p className="admin-error" role="alert">
              {loginError}
            </p>
          )}
        </form>
      )}

      {authed && (
        <section className="admin-body">
          {!storeReady && (
            <p className="admin-note admin-note-warn">
              Vercel KV is not connected yet, so nothing is being archived. Connect a KV store in
              the project’s Storage tab and redeploy.
            </p>
          )}
          {loading && <p className="admin-note">Loading…</p>}
          {loadError && (
            <p className="admin-error" role="alert">
              {loadError}
            </p>
          )}
          {!loading && !loadError && briefings.length === 0 && (
            <p className="admin-note">No briefings archived yet.</p>
          )}

          <ul className="admin-list">
            {briefings.map((b) => {
              const open = openId === b.id;
              return (
                <li className="admin-item" key={b.id}>
                  <button
                    type="button"
                    className="admin-item-head"
                    aria-expanded={open}
                    aria-controls={`briefing-${b.id}`}
                    onClick={() => setOpenId(open ? null : b.id)}
                  >
                    <span className="admin-item-client">
                      {b.summary.client_name || 'Unknown'}
                      {b.summary.company && b.summary.company !== 'Not provided'
                        ? ` · ${b.summary.company}`
                        : ''}
                    </span>
                    <span className="admin-item-type">{b.summary.project_type}</span>
                    <span className="admin-item-date">{formatDate(b.created_at)}</span>
                    <span className="admin-item-chev" aria-hidden="true">
                      {open ? '−' : '+'}
                    </span>
                  </button>

                  {open && (
                    <div className="admin-item-body" id={`briefing-${b.id}`}>
                      <h2 className="admin-h2">Summary</h2>
                      <dl className="admin-fields">
                        {FIELD_LABELS.map(([key, label]) => (
                          <div className="admin-field" key={key}>
                            <dt>{label}</dt>
                            <dd>{b.summary[key]}</dd>
                          </div>
                        ))}
                      </dl>

                      <h2 className="admin-h2">Internal notes</h2>
                      <p className="admin-suggestions">{b.suggestions}</p>

                      <h2 className="admin-h2">Transcript</h2>
                      <div className="admin-transcript">
                        {b.transcript.map((m, i) => (
                          <p className="admin-turn" key={i}>
                            <span className="admin-turn-role">
                              {m.role === 'user' ? 'Client' : 'Lykos'}
                            </span>
                            {m.content}
                          </p>
                        ))}
                      </div>

                      <p className="admin-id">ID: {b.id}</p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </PageShell>
  );
}
