import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MODEL, anthropic, textOf } from './_lib/anthropic.js';
import {
  briefingStoreReady,
  newBriefingId,
  saveBriefing,
  type BriefingRecord,
  type BriefingSummary,
} from './_lib/store.js';

/**
 * Lykos — the client-briefing assistant behind /briefing.
 *
 * Two modes on one endpoint:
 *   mode: 'chat'    → next conversational turn (cheap: low effort, small cap)
 *   mode: 'summary' → structured summary + internal recommendations, archived to KV
 *
 * The ANTHROPIC_API_KEY only ever exists in this process. The browser posts the
 * transcript here; this function calls Anthropic.
 */

/** Message pairs before Lykos is told to wrap up (cost guard). */
const WRAP_UP_AFTER = 16;
/** Hard ceiling — the conversation is force-concluded past this (cost guard). */
const MAX_MESSAGES = 26;
const MAX_CHARS_PER_MESSAGE = 4000;
/** Sentinel Lykos emits when it has gathered enough; stripped before display. */
const DONE_TOKEN = '[[BRIEFING_COMPLETE]]';
/**
 * The Messages API requires the first message to come from the user, but the
 * conversation the visitor sees opens with Lykos introducing itself. This seed
 * turn is injected server-side for the API call only — it never reaches the
 * browser and never lands in the archived transcript.
 */
const KICKOFF = 'I would like to start a project brief.';

const SYSTEM_CHAT = `You are Lykos, the intake strategist for Lyken Agency — a studio doing brand identity, digital experience, AI-integrated design, and strategic positioning. You run the first conversation with a prospective client: a focused project briefing.

Voice: warm, confident, economical. A senior strategist, not a form. No emoji. No bulleted lists. Write like a person, in prose.

Over the conversation, gather:
1. Contact — their name, company, and email address
2. Project type — brand identity, digital experience/website, AI-integrated design, strategic positioning, or a mix
3. Goals — what success looks like; what problem this solves
4. Audience — who they need to reach
5. Brand personality — tone, feeling, references they admire
6. Budget range
7. Timeline
8. Existing assets — current brand, site, materials
9. Anything else they want the team to know

Rules:
- Ask ONE question per message, TWO only when they're closely related. Never more.
- Acknowledge what they just said, specifically and briefly, before asking the next thing. No empty praise.
- Let the conversation set the order. If they volunteer something early, don't ask for it again.
- If an answer is too vague to act on (especially budget, timeline, or goals), ask one targeted follow-up — then move on. Do not interrogate.
- Never invent Lyken's pricing, availability, process, team, or past clients. If asked something you don't know, say a human will cover it.
- Keep every message under about 80 words.

Your first message: introduce yourself in one sentence, then ask for their name and company.

When you have contact details, project type, goals, audience, and at least a rough budget and timeline, you are done: thank them, tell them the team will review the brief and follow up by email, and end that final message with ${DONE_TOKEN} on its own line. Never emit that token before you are genuinely finished.`;

const SYSTEM_SUMMARY = `You are preparing an internal briefing document for the Lyken Agency team from a client intake conversation. The reader is a strategist or designer at the agency who was not present. This is internal — never client-facing copy.

Fill every field of the summary from what the client actually said. Do not invent, infer beyond what is reasonable, or pad. If something genuinely never came up, write exactly "Not provided". Keep each field tight — a phrase or a couple of sentences, not an essay. Quote the client directly where their own wording matters (tone, references, goals).

For "suggestions", write a short internal readout with three parts, as plain prose under these exact headings:

How to approach this
Two or three concrete recommendations for running this specific project well, grounded in what they said — not generic best practice.

Case-study angles
Where the interesting story might be if this becomes a portfolio piece.

Watch out for
The real risks: budget/scope mismatch, unrealistic timeline, unclear decision-maker, vague goals, anything they said that contradicts something else. Be direct — this is the section the team most needs.

Be candid. If the brief is thin or the budget does not match the ambition, say so plainly.`;

const SUMMARY_FIELDS = [
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
] as const;

const SUMMARY_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'object',
      properties: Object.fromEntries(SUMMARY_FIELDS.map((f) => [f, { type: 'string' }])),
      required: [...SUMMARY_FIELDS],
      additionalProperties: false,
    },
    suggestions: { type: 'string' },
  },
  required: ['summary', 'suggestions'],
  additionalProperties: false,
} as const;

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
}

function validateMessages(value: unknown): IncomingMessage[] | null {
  if (!Array.isArray(value) || value.length > MAX_MESSAGES) return null;
  const out: IncomingMessage[] = [];
  for (const m of value) {
    if (!m || typeof m !== 'object') return null;
    const { role, content } = m as Record<string, unknown>;
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof content !== 'string' || content.length === 0) return null;
    out.push({ role, content: content.slice(0, MAX_CHARS_PER_MESSAGE) });
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const body = (typeof req.body === 'string' ? safeJson(req.body) : req.body) as Record<string, unknown> | null;
  const mode = body?.mode === 'summary' ? 'summary' : 'chat';
  const messages = validateMessages(body?.messages ?? []);
  if (!messages) return res.status(400).json({ error: 'invalid_messages' });

  try {
    return mode === 'summary'
      ? await handleSummary(messages, res)
      : await handleChat(messages, res);
  } catch (err) {
    // Server-side log for later debugging; the client gets a friendly retry.
    console.error('[lykos-chat] failure', { mode, messageCount: messages.length, err });
    return res.status(502).json({ error: 'upstream_failed' });
  }
}

function safeJson(raw: string): Record<string, unknown> | null {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Guarantees a user-role first turn (see KICKOFF). */
function withKickoff(messages: IncomingMessage[]): IncomingMessage[] {
  if (messages.length > 0 && messages[0].role === 'user') return messages;
  return [{ role: 'user', content: KICKOFF }, ...messages];
}

async function handleChat(messages: IncomingMessage[], res: VercelResponse) {
  const overLimit = messages.length >= MAX_MESSAGES;
  const shouldWrapUp = messages.length >= WRAP_UP_AFTER;

  // Operator nudges are appended as an extra system instruction rather than
  // edited into SYSTEM_CHAT, so the cached prompt prefix stays intact.
  const system = overLimit
    ? `${SYSTEM_CHAT}\n\nThis conversation has run long. Close it out now: thank them, say the team will follow up by email for anything still missing, and end with ${DONE_TOKEN}.`
    : shouldWrapUp
      ? `${SYSTEM_CHAT}\n\nThis conversation is running long. Cover only what is still genuinely missing, then conclude.`
      : SYSTEM_CHAT;

  const response = await anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system,
    // `low` effort keeps intake turns fast and cheap; the reasoning demand here
    // is small. The summary call below runs at `high`.
    output_config: { effort: 'low' },
    // Opus 5 safety classifiers can decline a request; 'default' re-runs it on
    // Anthropic's recommended fallback server-side instead of failing the turn.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    messages: withKickoff(messages).map((m) => ({ role: m.role, content: m.content })),
  });

  if (response.stop_reason === 'refusal') {
    console.error('[lykos-chat] refusal', response.stop_details);
    return res.status(200).json({
      reply:
        "I wasn't able to process that one. Could you rephrase it, or skip ahead to the next part of the brief?",
      done: false,
    });
  }

  const raw = textOf(response.content as Array<{ type: string; text?: string }>);
  const done = raw.includes(DONE_TOKEN);
  const reply = raw.replace(DONE_TOKEN, '').trim();

  return res.status(200).json({
    reply: reply || 'Sorry — could you say that again?',
    done: done || overLimit,
  });
}

async function handleSummary(messages: IncomingMessage[], res: VercelResponse) {
  if (messages.length < 2) return res.status(400).json({ error: 'transcript_too_short' });

  const transcript = messages
    .map((m) => `${m.role === 'user' ? 'CLIENT' : 'LYKOS'}: ${m.content}`)
    .join('\n\n');

  const response = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: SYSTEM_SUMMARY,
    output_config: {
      effort: 'high',
      format: { type: 'json_schema', schema: SUMMARY_SCHEMA as unknown as Record<string, unknown> },
    },
    messages: [
      {
        role: 'user',
        content: `Here is the full intake conversation. Produce the internal briefing.\n\n${transcript}`,
      },
    ],
  });

  if (response.stop_reason === 'refusal') {
    console.error('[lykos-chat] summary refusal', response.stop_details);
    return res.status(502).json({ error: 'summary_refused' });
  }

  const parsed = safeJson(textOf(response.content as Array<{ type: string; text?: string }>));
  const summary = parsed?.summary as BriefingSummary | undefined;
  const suggestions = typeof parsed?.suggestions === 'string' ? parsed.suggestions : '';
  if (!summary || !suggestions) {
    console.error('[lykos-chat] summary did not match schema', { parsed });
    return res.status(502).json({ error: 'summary_malformed' });
  }

  const record: BriefingRecord = {
    id: newBriefingId(),
    created_at: new Date().toISOString(),
    summary,
    suggestions,
    transcript: messages,
  };

  // Archive is best-effort: a KV outage (or KV simply not provisioned yet) must
  // not lose the client's summary — it is still returned below.
  let archived = false;
  if (briefingStoreReady()) {
    try {
      await saveBriefing(record);
      archived = true;
    } catch (err) {
      console.error('[lykos-chat] KV write failed', err);
    }
  } else {
    console.error('[lykos-chat] KV not configured — briefing not archived', { id: record.id });
  }

  return res.status(200).json({
    id: record.id,
    summary: record.summary,
    suggestions: record.suggestions,
    archived,
  });
}
