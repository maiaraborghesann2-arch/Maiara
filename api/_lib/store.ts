import { createClient } from '@vercel/kv';

/**
 * Briefing archive — persisted in Vercel KV (Redis-backed key-value store).
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ ONE-TIME SETUP (Vercel dashboard — Maiara/Leonardo must do this once):   │
 * │                                                                          │
 * │ 1. Open the project in vercel.com → the "Storage" tab.                   │
 * │ 2. "Create Database" → choose KV / Redis (Upstash is the current         │
 * │    first-party provider behind Vercel KV) → pick a region near your      │
 * │    users → Create.                                                       │
 * │ 3. On the new store's page, "Connect Project" → select this project →    │
 * │    connect to Production, Preview and Development.                       │
 * │ 4. Vercel then injects KV_REST_API_URL and KV_REST_API_TOKEN (plus a     │
 * │    few read-only variants) automatically — nothing to paste by hand.     │
 * │ 5. Redeploy so the running functions pick up the new variables.          │
 * │                                                                          │
 * │ Until step 4 is done, briefings still work end to end (the chat and the  │
 * │ summary both run) but the archive write is skipped and the summary is    │
 * │ returned to the caller only — see `briefingStoreReady()` below.          │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Layout:
 *   briefing:<id>   → JSON record (the full briefing)
 *   briefings:index → Redis list of ids, newest first (LPUSH)
 */

const INDEX_KEY = 'briefings:index';

export interface BriefingSummary {
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

export interface BriefingRecord {
  id: string;
  created_at: string;
  /** structured summary of what the client answered */
  summary: BriefingSummary;
  /** internal-facing recommendations (markdown-ish plain text) */
  suggestions: string;
  /** raw conversation, for when the summary loses nuance */
  transcript: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/** Whether KV credentials are present. False = archive disabled, not an error. */
export function briefingStoreReady(): boolean {
  return Boolean(
    (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
      (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN),
  );
}

/** Accepts either the KV_* names Vercel KV injects or the UPSTASH_* equivalents. */
function kv() {
  return createClient({
    url: (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) as string,
    token: (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN) as string,
  });
}

/** `20260730-a4f2c1` — sorts chronologically as a string, still collision-safe. */
export function newBriefingId(now = new Date()): string {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const slug = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${slug}`;
}

export async function saveBriefing(record: BriefingRecord): Promise<void> {
  const store = kv();
  await store.set(`briefing:${record.id}`, record);
  await store.lpush(INDEX_KEY, record.id);
}

export async function listBriefings(limit = 100): Promise<BriefingRecord[]> {
  const store = kv();
  const ids = await store.lrange<string>(INDEX_KEY, 0, limit - 1);
  if (!ids?.length) return [];
  const records = await Promise.all(ids.map((id) => store.get<BriefingRecord>(`briefing:${id}`)));
  return records.filter((r): r is BriefingRecord => Boolean(r));
}
