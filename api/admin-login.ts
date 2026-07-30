import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  adminPasswordConfigured,
  checkPassword,
  clearSession,
  hasValidSession,
  issueSession,
} from './_lib/auth.js';

/**
 * Admin session endpoint for /admin.
 *
 *   GET                       → { authenticated: boolean }  (cheap session probe)
 *   POST { password }         → sets the httpOnly session cookie
 *   POST { action:'logout' }  → clears it
 *
 * The password lives only in process.env.ADMIN_PASSWORD. It is never returned,
 * never logged, and never placed in the cookie (see _lib/auth.ts).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({
      authenticated: hasValidSession(req),
      configured: adminPasswordConfigured(),
    });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) as Record<
    string,
    unknown
  > | null;

  if (body?.action === 'logout') {
    clearSession(res);
    return res.status(200).json({ authenticated: false });
  }

  if (!adminPasswordConfigured()) {
    console.error('[admin-login] ADMIN_PASSWORD is not set — admin panel is unreachable');
    return res.status(503).json({ error: 'not_configured' });
  }

  if (!checkPassword(body?.password)) {
    // No detail in the response, and no password material in the log.
    console.error('[admin-login] failed sign-in attempt');
    return res.status(401).json({ error: 'invalid_password' });
  }

  issueSession(res);
  return res.status(200).json({ authenticated: true });
}

function safeJson(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}
