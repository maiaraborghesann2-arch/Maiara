/**
 * Legal document content — Privacy Policy (/privacy) and Terms of Service
 * (/terms).
 *
 * ⚠️ DRAFT. Written as a working template, not reviewed by a lawyer. Both
 * documents render a visible disclaimer saying so; remove that banner (see
 * `legal.disclaimer` in src/i18n/translations.ts and the `disclaimer` flag
 * below) only once a qualified data protection professional has signed off.
 *
 * PLACEHOLDERS TO CONFIRM BEFORE PRODUCTION — search for them here:
 *   • LAST_UPDATED — bump whenever either document changes.
 *   • privacy@lyken.agency — confirm the mailbox exists and is monitored.
 *   • Registered entity name/address of the controller (currently just
 *     "Lyken Agency", Ireland) — a GDPR privacy notice must identify the
 *     controller properly.
 *   • Retention periods (§6 of the privacy policy) — currently deliberately
 *     open-ended placeholders.
 *   • Governing law (Ireland) in the terms — confirm it matches where the
 *     business is actually established.
 *
 * These are kept in English only, in one place, rather than in the i18n
 * dictionaries: legal wording should not be paraphrased by a non-lawyer into
 * a second language. The PT-BR UI shows a short note pointing that out.
 */

/** Displayed on both documents. Bump on every substantive edit. */
export const LAST_UPDATED = '31 July 2026';

export const PRIVACY_EMAIL = 'privacy@lyken.agency';

/** A paragraph (string) or a bulleted list (array of strings). */
export type LegalBlock = string | string[];

export interface LegalSection {
  heading: string;
  blocks: LegalBlock[];
}

export interface LegalDoc {
  /** Route this document lives at, used for canonical/SEO. */
  path: string;
  title: string;
  /** Short standfirst under the headline. */
  intro: string;
  sections: LegalSection[];
}

export const PRIVACY_POLICY: LegalDoc = {
  path: '/privacy',
  title: 'Privacy Policy',
  intro:
    'This policy explains what personal data Lyken Agency collects through this website, why we collect it, who processes it on our behalf, and the rights you have over it under the EU General Data Protection Regulation (GDPR).',
  sections: [
    {
      heading: 'Who we are',
      blocks: [
        'Lyken Agency ("we", "us") is a strategic design studio operating from Ireland. For the personal data described in this policy, we are the data controller — we decide why and how it is processed.',
        `You can reach us about anything in this policy at ${PRIVACY_EMAIL}.`,
      ],
    },
    {
      heading: 'What personal data we collect',
      blocks: [
        'We only collect what you choose to give us. There are two places on this site where that happens.',
        'From the contact form:',
        [
          'Your name',
          'Your email address',
          'Your company name, if you provide one (optional)',
          'The content of the message you write',
        ],
        'From the Lykos project briefing (the AI conversation at /briefing):',
        [
          'Your name and the company you represent',
          'Your email address',
          'Project details you describe — the type of work, your goals, your audience, your brand personality, budget range, timeline, and any existing brand assets or references',
          'The full transcript of the conversation, exactly as it was typed',
          'An AI-generated summary of that conversation, and internal notes prepared for our team',
          'The date and time the briefing was completed',
        ],
        'We do not ask for special category data (health, political opinions, and so on) anywhere on this site, and you should not include any in a message or a briefing.',
        'Your browser also stores a small amount of information locally on your own device — your language preference, your ambient audio preference, and the fact that you dismissed our consent notice. That information stays on your device and is never sent to us. Our hosting provider additionally keeps standard server logs, including IP addresses, for security and reliability.',
      ],
    },
    {
      heading: 'Why we collect it, and our legal basis',
      blocks: [
        'We use the data described above to:',
        [
          'Respond to your enquiry',
          'Understand your project and prepare a proposal, quote, or scope of work',
          'Generate an AI-assisted summary of your briefing so our team can review it properly',
          'Keep a record of the conversation so that nothing you told us is lost between people',
        ],
        'Our legal basis for this is Article 6(1)(b) GDPR — taking steps at your request before entering into a contract — and, where you are enquiring on behalf of an organisation, Article 6(1)(f), our legitimate interest in responding to business enquiries and running our studio. Where we ask for your consent (for example, before you start a briefing), the legal basis is Article 6(1)(a), and you may withdraw that consent at any time.',
        'We do not sell your data, and we do not use it for advertising.',
      ],
    },
    {
      heading: 'AI processing of your briefing',
      blocks: [
        'The Lykos briefing is conducted by an AI system. When you send a message in that conversation, its content — together with the conversation so far — is transmitted to Anthropic PBC, the maker of Claude, which generates the reply. When the briefing concludes, the full transcript is sent to the same service once more to produce the structured summary and the internal notes our team reads.',
        'Anthropic acts as a data processor on our behalf: it processes this content to provide the service to us, under its commercial terms, and not for its own purposes.',
        'Everything you type in that conversation is therefore processed by a third-party AI provider. That is why we ask you to acknowledge this before the conversation starts, and why we suggest you do not include anything confidential, anything covered by an NDA with someone else, or anyone else\'s personal data in a briefing.',
        'The AI does not make any decision that produces a legal effect for you, and it does not significantly affect you within the meaning of Article 22 GDPR. Its output is a draft summary; a person at Lyken Agency reads it and decides what happens next.',
      ],
    },
    {
      heading: 'Who else processes your data',
      blocks: [
        'We keep our supplier list short. The following sub-processors handle personal data on our behalf:',
        [
          'Anthropic PBC (United States) — AI processing of briefing conversations and generation of the summary and internal notes.',
          'Vercel Inc. (United States) — hosting of this website and of the serverless functions behind it, and storage of completed briefings in Vercel KV, its hosted key-value database.',
        ],
        'Both are established in the United States, so your data is transferred outside the European Economic Area. Those transfers rely on the European Commission\'s Standard Contractual Clauses and the safeguards set out in each provider\'s data processing agreement.',
        'Email you send us is handled by our email provider in the ordinary way.',
      ],
    },
    {
      heading: 'How long we keep it',
      blocks: [
        'Completed briefings are retained for as long as we need them to evaluate the opportunity and deliver the project, or until you ask us to delete them — whichever comes first.',
        'Messages sent through the contact form are retained for as long as needed to handle the enquiry and any engagement that follows from it.',
        'When we no longer need the data for those purposes, we delete it, unless we are required to keep records for a legal or accounting reason.',
        'These retention periods are placeholders in this draft. We will state a defined period here once it has been confirmed.',
      ],
    },
    {
      heading: 'Your rights',
      blocks: [
        'Under GDPR you have the right to:',
        [
          'Access — ask for a copy of the personal data we hold about you',
          'Rectification — have inaccurate or incomplete data corrected',
          'Erasure — ask us to delete your data ("the right to be forgotten")',
          'Restriction — ask us to pause processing while a concern is resolved',
          'Portability — receive your data in a structured, commonly used, machine-readable format, or have it sent to another controller',
          'Objection — object to processing we carry out on the basis of legitimate interests',
          'Withdraw consent — at any time, where processing is based on consent, without affecting anything done before you withdrew it',
        ],
      ],
    },
    {
      heading: 'How to exercise your rights',
      blocks: [
        `Email ${PRIVACY_EMAIL} and tell us what you would like us to do. Please give us enough detail to find your data — the name and email address you used, and roughly when you contacted us or completed a briefing.`,
        'We will respond within one month. There is no charge for this.',
        'If you are not satisfied with how we handle your request, you have the right to lodge a complaint with the Irish Data Protection Commission (dataprotection.ie), or with the supervisory authority in the EU country where you live or work.',
      ],
    },
    {
      heading: 'Security',
      blocks: [
        'Briefings are stored in a hosted database that is not publicly accessible, and the internal archive that displays them is protected by authentication. Traffic to and from this site is encrypted in transit. Access to briefing content is limited to the people at Lyken Agency who need it to do their work.',
        'No system is perfectly secure, so please use your judgement about what you share with us before an engagement is in place.',
      ],
    },
    {
      heading: 'Children',
      blocks: [
        'This site is intended for businesses and professionals. It is not directed at children, and we do not knowingly collect personal data from anyone under 16. If you believe a child has provided us with personal data, contact us and we will delete it.',
      ],
    },
    {
      heading: 'Changes to this policy',
      blocks: [
        'If we change how we handle personal data, we will update this page and change the date shown at the top. Material changes will be described here rather than made quietly.',
      ],
    },
  ],
};

export const TERMS_OF_SERVICE: LegalDoc = {
  path: '/terms',
  title: 'Terms of Service',
  intro:
    'These terms govern your use of the Lyken Agency website, including the Lykos project briefing. Client work itself is governed by a separate written agreement, not by this page.',
  sections: [
    {
      heading: 'Acceptance',
      blocks: [
        'By using this website you agree to these terms. If you do not agree with them, please do not use the site.',
        'We may update these terms from time to time. The version published here is the one that applies, and the date at the top tells you when it last changed.',
      ],
    },
    {
      heading: 'Intellectual property',
      blocks: [
        'All content on this site — text, design, layout, graphics, the Lyken mark and wordmark, photography, code, animation, and the arrangement of all of it — belongs to Lyken Agency or to its licensors, and is protected by copyright, trade mark, and other intellectual property law.',
        'You may view the site and print or download extracts for your own reference or to evaluate working with us. You may not republish, redistribute, sell, or exploit any part of it commercially, or use our name or marks, without our written permission.',
        'Work shown in the portfolio may include material owned by our clients. Nothing here grants you any right to use it.',
      ],
    },
    {
      heading: 'Acceptable use',
      blocks: [
        'You agree not to:',
        [
          'Use the site for any unlawful purpose, or in a way that infringes anyone else\'s rights',
          'Submit anything through the contact form or the Lykos briefing that is unlawful, abusive, defamatory, or infringing',
          'Submit third-party confidential information, material covered by someone else\'s non-disclosure agreement, or other people\'s personal data',
          'Attempt to gain unauthorised access to any part of the site, its servers, or its administrative areas',
          'Interfere with the site\'s operation, including by automated scraping, load generation, or attempts to exhaust our resources or those of our providers',
          'Use the AI briefing for any purpose other than genuinely discussing a project with us',
        ],
        'We may restrict or withdraw access to the site, in whole or in part, if these terms are breached.',
      ],
    },
    {
      heading: 'The Lykos briefing',
      blocks: [
        'The Lykos briefing is an AI-assisted intake conversation. Its replies are generated automatically by a third-party AI system and are not reviewed by a person before you see them.',
        'It is there to gather information about your project. It does not give professional, legal, financial, or technical advice; it does not price work; and it does not commit either of us to anything. Nothing it says is an offer, a quote, or a contract, and completing a briefing does not create a client relationship or oblige us to take on the work.',
        'AI systems can be wrong. Do not rely on anything the briefing tells you about our pricing, availability, process, or past work — ask a person, and we will confirm it.',
        'How we handle what you type there is set out in our Privacy Policy.',
      ],
    },
    {
      heading: 'Third-party links',
      blocks: [
        'This site links to third-party sites and services that we do not control. We include those links for convenience and do not endorse, and are not responsible for, their content, their terms, or their privacy practices.',
      ],
    },
    {
      heading: 'Disclaimer of warranties',
      blocks: [
        'The site is provided "as is" and "as available". To the fullest extent permitted by law, we make no warranties or representations of any kind about it — in particular, we do not warrant that it will be uninterrupted, error-free, secure, or free of harmful components, or that any content on it is accurate, complete, or current.',
        'Portfolio content, case studies, and written insights are provided for general information only.',
      ],
    },
    {
      heading: 'Limitation of liability',
      blocks: [
        'To the fullest extent permitted by law, Lyken Agency will not be liable for any indirect, incidental, special, or consequential loss, or for any loss of profit, revenue, business, goodwill, or data, arising out of your use of — or inability to use — this site or the Lykos briefing.',
        'Nothing in these terms limits or excludes liability for death or personal injury caused by negligence, for fraud or fraudulent misrepresentation, or for anything else that cannot lawfully be limited or excluded. If you are a consumer, your statutory rights under Irish and EU consumer law are unaffected.',
      ],
    },
    {
      heading: 'Governing law',
      blocks: [
        'These terms, and any dispute arising out of them or out of your use of this site, are governed by the laws of Ireland. The courts of Ireland have jurisdiction, save that if you are a consumer resident in another EU member state you keep the protection of the mandatory rules of your own country and may bring proceedings there.',
      ],
    },
    {
      heading: 'Contact',
      blocks: [
        `Questions about these terms can be sent to ${PRIVACY_EMAIL}.`,
      ],
    },
  ],
};
