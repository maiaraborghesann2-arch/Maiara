import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin } from './_lib/auth.js';
import { briefingStoreReady, listBriefings } from './_lib/store.js';

/**
 * Archived briefings for the admin panel. Guarded by the signed session cookie —
 * an unauthenticated request gets a 401 and the client shows the login form.
 *
 * In an SPA the /admin *markup* cannot be gated server-side, so the protection
 * lives here, on the only thing worth protecting: the data.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!requireAdmin(req, res)) return;

  if (!briefingStoreReady()) {
    // Not an error state worth failing on: KV simply has not been provisioned.
    return res.status(200).json({ briefings: [], storeReady: false });
  }

  try {
    const briefings = await listBriefings();
    return res.status(200).json({ briefings, storeReady: true });
  } catch (err) {
    console.error('[admin-briefings] KV read failed', err);
    return res.status(502).json({ error: 'store_unavailable' });
  }
}
