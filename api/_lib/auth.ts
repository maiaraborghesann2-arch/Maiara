import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Single shared admin password (env: ADMIN_PASSWORD) → signed httpOnly session
 * cookie. Deliberately not a user-account system: this is one internal panel
 * for the agency's own team.
 *
 * The cookie carries only an expiry timestamp plus an HMAC of it, keyed by the
 * password itself. It therefore cannot be forged without the password, contains
 * no secret to leak, and is invalidated wholesale by rotating ADMIN_PASSWORD.
 */

const COOKIE = 'lyken_admin';
const TTL_MS = 12 * 60 * 60 * 1000; // 12h

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Length check first — timingSafeEqual throws on mismatched lengths. */
function safeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const ab = encoder.encode(a);
  const bb = encoder.encode(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function adminPasswordConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** Constant-time password check. */
export function checkPassword(submitted: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof submitted !== 'string' || submitted.length === 0) return false;
  return safeEqual(submitted, expected);
}

export function issueSession(res: VercelResponse): void {
  const secret = process.env.ADMIN_PASSWORD as string;
  const expires = Date.now() + TTL_MS;
  const value = `${expires}.${sign(String(expires), secret)}`;
  res.setHeader(
    'Set-Cookie',
    // Lax is sufficient (the panel is navigated to directly, never embedded)
    `${COOKIE}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${Math.floor(TTL_MS / 1000)}`,
  );
}

export function clearSession(res: VercelResponse): void {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}

export function hasValidSession(req: VercelRequest): boolean {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;
  const raw = req.headers.cookie
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.slice(COOKIE.length + 1);
  if (!raw) return false;

  const [expires, signature] = raw.split('.');
  if (!expires || !signature) return false;
  if (!Number.isFinite(Number(expires)) || Number(expires) < Date.now()) return false;
  return safeEqual(signature, sign(expires, secret));
}

/** Guard for protected endpoints. Returns true if the request may proceed. */
export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  if (hasValidSession(req)) return true;
  res.status(401).json({ error: 'unauthorized' });
  return false;
}
