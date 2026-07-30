import Anthropic from '@anthropic-ai/sdk';

/**
 * Shared Anthropic client for the Lykos briefing endpoints.
 *
 * The API key is read from process.env.ANTHROPIC_API_KEY by the SDK itself and
 * NEVER reaches the browser — every call in this directory runs inside a Vercel
 * serverless function. Do not import anything from this file into src/.
 */

export const MODEL = 'claude-opus-5';

let client: Anthropic | null = null;

/** Lazily constructed so a missing key surfaces as a handled 500, not a cold-start crash. */
export function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set (add it in Vercel → Settings → Environment Variables)');
  }
  if (!client) client = new Anthropic();
  return client;
}

/** Extracts the concatenated text of a response, ignoring thinking/other blocks. */
export function textOf(content: Array<{ type: string; text?: string }>): string {
  return content
    .filter((b): b is { type: 'text'; text: string } => b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('')
    .trim();
}
